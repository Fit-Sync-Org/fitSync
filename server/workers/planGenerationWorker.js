const { planGenerationQueue } = require("../config/queue");
const { PrismaClient } = require("@prisma/client");
const { geminimodel } = require("../firebase");

const prisma = new PrismaClient();

planGenerationQueue.process(async (job) => {
  const { userId } = job.data;

  try {
    console.log(`Starting plan generation for user ${userId}`);

    await job.progress(10);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { goals: true },
    });

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    await job.progress(20);

    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - daysFromMonday);
    weekStart.setHours(0, 0, 0, 0);

    const existingPlan = await prisma.userPlan.findFirst({
      where: {
        userId: userId,
        weekStart: weekStart,
      },
    });

    if (existingPlan) {
      console.log(
        `Plan already exists for user ${userId} for week ${weekStart.toISOString()}`
      );
      return { planId: existingPlan.id, status: "existing" };
    }

    await job.progress(30);

    const userProfile = {
      name: user.firstName || "User",
      age: user.age || 30,
      gender: user.gender || "OTHER",
      weight: user.weightKg || 70,
      height: user.heightCm || 170,
      occupation: user.occupation || "Not specified",
      goals: user.goals?.map((goal) => goal.name) || ["HEALTH_AND_LONGEVITY"],
      weeklyWorkoutHours: user.weeklyWorkoutHours || 3,
      sessionPreference: user.sessionPreference || "SHORTER_MORE",
      dietaryRestrictions: user.dietaryRestrictions || "None",
    };

    await job.progress(40);

    const weekStartStr = weekStart.toISOString().split("T")[0];
    const prompt = `Generate a 7-day fitness and meal plan for the following user profile:
${JSON.stringify(userProfile, null, 2)}

The plan should start on Monday ${weekStartStr} and include:
- Daily workouts with exercises, sets, reps, and rest periods
- Meal plans with specific foods, calories, and macros
- Rest days and recovery periods
- Variety throughout the week

IMPORTANT: Return ONLY the raw JSON object with no markdown formatting, no code blocks, no backticks, and no additional text. The response should start with { and end with } and be valid JSON that can be directly parsed with JSON.parse().

Use this exact structure:
{
  "weekStart": "${weekStartStr}",
  "totalWeeklyCalories": 0,
  "days": [
    {
      "date": "${weekStartStr}",
      "dayOfWeek": "Monday",
      "workouts": [
        {
          "name": "Exercise Name",
          "sets": 3,
          "reps": "8-10",
          "weight": "bodyweight",
          "rest_seconds": 90,
          "calories_burned": 50
        }
      ],
      "meals": [
        {
          "name": "Breakfast",
          "foods": ["Food item 1", "Food item 2"],
          "calories": 450,
          "macros": {
            "protein": 25,
            "carbs": 50,
            "fat": 15
          }
        }
      ],
      "totalCalories": 2200,
      "totalWorkouts": 1
    }
  ]
}`;

    await job.progress(50);

    console.log(`Calling LLM for user ${userId}`);
    const result = await geminimodel.generateContent([prompt]);
    const rawText = result.response.text();

    await job.progress(70);

    let jsonText = rawText.trim();

    if (jsonText.includes("```")) {
      const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonText = jsonMatch[1].trim();
      }
    }

    jsonText = jsonText.replace(/^`+|`+$/g, "").trim();

    const firstBrace = jsonText.indexOf("{");
    const lastBrace = jsonText.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonText = jsonText.substring(firstBrace, lastBrace + 1);
    }

    console.log(`Cleaned JSON for user ${userId}:`, jsonText.substring(0, 200) + "...");

    let planData;
    try {
      planData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error(`JSON parsing failed for user ${userId}:`, parseError.message);
      console.error(`Raw text: ${rawText.substring(0, 500)}...`);
      throw new Error(`Invalid JSON response from LLM: ${parseError.message}`);
    }

    await job.progress(80);

    if (!planData.days || !Array.isArray(planData.days) || planData.days.length === 0) {
      throw new Error("Invalid plan structure: missing or empty days array");
    }

    const savedPlan = await prisma.userPlan.create({
      data: {
        userId: userId,
        weekStart: weekStart,
        planJson: planData,
        status: "ACTIVE",
      },
    });

    await job.progress(90);

    await prisma.notification.create({
      data: {
        userId: userId,
        type: "PLAN_READY",
        title: "Your Weekly Plan is Ready!",
        message: `Your personalized fitness and meal plan for the week of ${weekStartStr} has been generated and is ready to use.`,
        isRead: false,
      },
    });

    await job.progress(100);

    console.log(`Plan generation completed for user ${userId}, plan ID: ${savedPlan.id}`);

    return {
      planId: savedPlan.id,
      status: "success",
      weekStart: weekStartStr,
      totalDays: planData.days.length,
    };
  } catch (error) {
    console.error(`Plan generation failed for user ${userId}:`, error.message);

    try {
      await prisma.userPlan.updateMany({
        where: {
          userId: userId,
          status: "GENERATING",
        },
        data: {
          status: "FAILED",
        },
      });
    } catch (updateError) {
      console.error("Failed to update plan status:", updateError);
    }

    try {
      await prisma.notification.create({
        data: {
          userId: userId,
          type: "PLAN_FAILED",
          title: "Plan Generation Failed",
          message:
            "We encountered an issue generating your weekly plan. Please try again or contact support.",
          isRead: false,
        },
      });
    } catch (notificationError) {
      console.error(
        "Failed to create failure notification:",
        notificationError
      );
    }

    throw error;
  }
});

console.log("Plan generation worker started");

module.exports = planGenerationQueue;



