import { geminimodel } from '../firebase';

export const generateAIPlan = async (userProfile) => {
  try {
    console.log('Starting AI plan generation for user:', userProfile.id);

    // Calculate week start (Monday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - daysFromMonday);
    weekStart.setHours(0, 0, 0, 0);

    const weekStartStr = weekStart.toISOString().split('T')[0];

    // AI promt
    const prompt = `
You are a professional fitness and nutrition coach. Create a comprehensive 7-day fitness and meal plan for the following user profile:

**User Profile:**
- Name: ${userProfile.firstName} ${userProfile.lastName}
- Age: ${userProfile.age}
- Gender: ${userProfile.gender}
- Height: ${userProfile.heightCm}cm
- Weight: ${userProfile.weightKg}kg
- Goals: ${userProfile.goals?.map(g => g.name).join(', ') || 'General fitness'}
- Weekly Workout Hours Available: ${userProfile.weeklyWorkoutHours || 'Not specified'}
- Session Preference: ${userProfile.sessionPreference || 'Not specified'}
- Dietary Restrictions: ${userProfile.dietaryRestrictions || 'None'}
- Occupation: ${userProfile.occupation || 'Not specified'}

**Requirements:**
1. Create exactly 7 days of plans (Monday to Sunday)
2. Each day should include both workout and meal plans, feel free to include rest days for workouts
3. Workouts should fit within the user's available time and preferences
4. Meals should respect dietary restrictions and support the user's goals
5. Include specific exercises, sets, reps, and duration for workouts
6. Include specific meals with estimated calories for each meal
7. Provide variety throughout the week
8. Make it realistic and achievable

**Response Format (JSON only, no additional text):**
{
  "weekStart": "${weekStartStr}",
  "totalWeeklyCalories": 0,
  "days": [
    {
      "date": "YYYY-MM-DD",
      "dayName": "Monday",
      "totalCalories": 0,
      "meals": {
        "breakfast": {
          "name": "Meal name",
          "calories": 0,
          "description": "Brief description",
          "ingredients": ["ingredient1", "ingredient2"]
        },
        "lunch": {
          "name": "Meal name",
          "calories": 0,
          "description": "Brief description",
          "ingredients": ["ingredient1", "ingredient2"]
        },
        "dinner": {
          "name": "Meal name",
          "calories": 0,
          "description": "Brief description",
          "ingredients": ["ingredient1", "ingredient2"]
        },
        "snacks": [
          {
            "name": "Snack name",
            "calories": 0,
            "description": "Brief description"
          }
        ]
      },
      "workouts": [
        {
          "name": "Workout name",
          "type": "cardio|strength|flexibility|sports",
          "duration": 0,
          "caloriesBurned": 0,
          "exercises": [
            {
              "name": "Exercise name",
              "sets": 0,
              "reps": 0,
              "duration": 0,
              "notes": "Any specific instructions"
            }
          ]
        }
      ]
    }
  ]
}

Generate the complete 7-day plan now:`;

    console.log('Sending prompt to Gemini AI...');
    const result = await geminimodel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('Received response from Gemini AI');

    let planData;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      planData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.log('Raw AI response:', text);
      throw new Error('Failed to parse AI response as JSON');
    }

    if (!planData.days || !Array.isArray(planData.days) || planData.days.length !== 7) {
      throw new Error('Invalid plan structure: missing or invalid days array');
    }

    let totalWeeklyCalories = 0;
    planData.days.forEach(day => {
      if (day.meals) {
        const dayCalories =
          (day.meals.breakfast?.calories || 0) +
          (day.meals.lunch?.calories || 0) +
          (day.meals.dinner?.calories || 0) +
          (day.meals.snacks?.reduce((sum, snack) => sum + (snack.calories || 0), 0) || 0);

        day.totalCalories = dayCalories;
        totalWeeklyCalories += dayCalories;
      }
    });

    planData.totalWeeklyCalories = totalWeeklyCalories;

    console.log('AI plan generation completed successfully');
    return {
      success: true,
      planData,
      weekStart: weekStartStr
    };

  } catch (error) {
    console.error('Error generating AI plan:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate AI plan'
    };
  }
};

export const savePlanToServer = async (planData, weekStart) => {
  try {
    console.log('Saving plan to server...');

    const idToken = sessionStorage.getItem("fitsyncTempToken");
    const headers = {
      'Content-Type': 'application/json',
    };

    if (idToken) {
      headers.Authorization = `Bearer ${idToken}`;
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ai-plans/generate`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        planData,
        weekStart
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save plan');
    }

    const result = await response.json();
    console.log('Plan saved successfully:', result);

    return {
      success: true,
      data: result
    };

  } catch (error) {
    console.error('Error saving plan to server:', error);
    return {
      success: false,
      error: error.message || 'Failed to save plan to server'
    };
  }
};

export const generateAndSavePlan = async (userProfile) => {
  try {
    const generationResult = await generateAIPlan(userProfile);

    if (!generationResult.success) {
      return generationResult;
    }

    const saveResult = await savePlanToServer(
      generationResult.planData,
      generationResult.weekStart
    );

    if (!saveResult.success) {
      return saveResult;
    }

    return {
      success: true,
      planId: saveResult.data.planId,
      weekStart: generationResult.weekStart,
      message: 'Plan generated and saved successfully'
    };

  } catch (error) {
    console.error('Error in generateAndSavePlan:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate and save plan'
    };
  }
};
