import { geminimodel } from '../firebase';

// BMI calculation function
export const calculateBMI = (weightKg, heightCm) => {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  return (weightKg / (heightM * heightM)).toFixed(1);
};

export const getBMICategory = (bmi) => {
  if (!bmi) return 'Unknown';
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

export const getAgeBasedApproach = (age) => {
  if (!age) return 'general';
  if (age < 30) return 'high_activity';
  if (age < 40) return 'moderate_activity';
  if (age < 50) return 'balanced';
  if (age < 60) return 'gentle';
  return 'senior';
};

//age-appropriate prompt section
export const generateAgeBasedPrompt = (age, approach) => {
  const basePrompts = {
    high_activity: `
**Fitness Approach for Young Adults (Under30**
- Focus on high-intensity workouts and strength training
- Include advanced exercises like HIIT, plyometrics, and heavy lifting
- Emphasize muscle building and athletic performance
- Allow for more aggressive calorie deficits or surpluses
- Include recovery days but maintain high overall activity level
- Target 5-6 workout sessions per week with varying intensity`,

    moderate_activity: `
**Fitness Approach for Adults (30
- Balance between high-intensity and moderate workouts
- Focus on functional fitness and injury prevention
- Include strength training with moderate weights
- Emphasize sustainable habits and lifestyle changes
- Include flexibility and mobility work
- Target 4-5 workout sessions per week with good recovery`,

    balanced: `
**Fitness Approach for Adults (40-49Moderate intensity workouts with focus on form
- Emphasize functional movements and core strength
- Include low-impact cardio options
- Focus on injury prevention and joint health
- Include stretching and flexibility work
- Target 3-4 workout sessions per week with adequate rest`,

    gentle: `
**Fitness Approach for Adults (50
- Low to moderate intensity workouts
- Focus on mobility, flexibility, and balance
- Include walking, swimming, and gentle strength training
- Emphasize consistency over intensity
- Include regular stretching and recovery
- Target 3-4 workout sessions per week`,

    senior: `
**Fitness Approach for Seniors (60+):**
- Very gentle, low-impact exercises
- Focus on balance, flexibility, and mobility
- Include walking, gentle yoga, and light resistance training
- Emphasize safety and injury prevention
- Include regular stretching and rest days
- Target 2-3 gentle sessions per week with plenty of recovery`,

    general: `
**General Fitness Approach:**
- Balanced mix of cardio, strength, and flexibility
- Moderate intensity suitable for most fitness levels
- Focus on sustainable habits and gradual progress
- Include variety in workout types
- Emphasize proper form and safety
- Target 3-4 workout sessions per week`,
  };


  return basePrompts[approach] || basePrompts.general;
};
// Check for significant changes that warrant regeneration
export const shouldRegeneratePlan = (currentPlan, userProfile) => {
  if (!currentPlan || !userProfile) return false;
  const planData = currentPlan.plan;
  if (!planData || !planData.userProfile) return true;

  const storedProfile = planData.userProfile;

  const ageChanged = Math.abs((storedProfile.age || 0) - (userProfile.age || 0)) >= 5;
  const weightChanged = Math.abs((storedProfile.weightKg || 0) - (userProfile.weightKg || 0)) >= 5;
  const heightChanged = Math.abs((storedProfile.heightCm || 0) - (userProfile.heightCm || 0)) >= 3;
  const goalsChanged = JSON.stringify(storedProfile.goals) !== JSON.stringify(userProfile.goals);
  const dietaryChanged = storedProfile.dietaryRestrictions !== userProfile.dietaryRestrictions;
  return ageChanged || weightChanged || heightChanged || goalsChanged || dietaryChanged;
};

export const generateAIPlan = async (userProfile) => {
  try {
    console.log('Starting AI plan generation for user:', userProfile.id);

    // Calculate week start (Monday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - daysFromMonday);
    weekStart.setHours(0, 0, 0);

    const weekStartStr = weekStart.toISOString().split('T')[0];

    const bmi = calculateBMI(userProfile.weightKg, userProfile.heightCm);
    const bmiCategory = getBMICategory(bmi);
    const ageApproach = getAgeBasedApproach(userProfile.age);
    const ageBasedPrompt = generateAgeBasedPrompt(userProfile.age, ageApproach);

    const prompt = `
You are a professional fitness and nutrition coach. Create a comprehensive 7-day fitness and meal plan for the following user profile:

**User Profile:**
- Name: ${userProfile.firstName} ${userProfile.lastName}
- Age: ${userProfile.age}
- Gender: ${userProfile.gender}
- Height: ${userProfile.heightCm}cm
- Weight: ${userProfile.weightKg}kg
- BMI: ${bmi} (${bmiCategory})
- Goals: ${userProfile.goals?.map(g => g.name).join(', ') || 'General fitness'}
- Weekly Workout Hours Available: ${userProfile.weeklyWorkoutHours || 'Not specified'}
- Session Preference: ${userProfile.sessionPreference || 'Not specified'}
- Dietary Restrictions: ${userProfile.dietaryRestrictions || 'None'}
- Occupation: ${userProfile.occupation || 'Not specified'}

${ageBasedPrompt}

**BMI Considerations:**
- Current BMI: ${bmi} (${bmiCategory})
- ${bmiCategory === 'Underweight' ? 'Focus on healthy weight gain with nutrient-dense foods and strength training' : ''}
- ${bmiCategory === 'Normal weight' ? 'Maintain healthy habits with balanced nutrition and regular exercise' : ''}
- ${bmiCategory === 'Overweight' ? 'Focus on sustainable weight loss with moderate calorie deficit and regular cardio' : ''}
- ${bmiCategory === 'Obese' ? 'Prioritize gradual weight loss with low-impact exercises and balanced nutrition' : ''}

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
      weekStart: weekStartStr,
      bmi,
      bmiCategory,
      ageApproach,
    };

  } catch (error) {
    console.error('Error generating AI plan:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate AI plan',
    };
  }
};

export const savePlanToServer = async (planData, weekStart) => {
  try {
    console.log('Saving plan to server...');

    const idToken = sessionStorage.getItem('fitsyncTempToken');
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
        weekStart,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save plan');
    }

    const result = await response.json();
    console.log('Plan saved successfully:', result);

    return {
      success: true,
      data: result,
    };

  } catch (error) {
    console.error('Error saving plan to server:', error);
    return {
      success: false,
      error: error.message || 'Failed to save plan to server',
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
      generationResult.weekStart,
    );

    if (!saveResult.success) {
      return saveResult;
    }

    return {
      success: true,
      planId: saveResult.data.planId,
      weekStart: generationResult.weekStart,
      message: 'Plan generated and saved successfully',
      bmi: generationResult.bmi,
      bmiCategory: generationResult.bmiCategory,
      ageApproach: generationResult.ageApproach,
    };

  } catch (error) {
    console.error('Error in generateAndSavePlan:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate and save plan',
    };
  }
};

// Enhanced plan regeneration function
export const regeneratePlanIfNeeded = async (currentPlan, userProfile) => {
  try {
    if (shouldRegeneratePlan(currentPlan, userProfile)) {
      console.log('Profile changes detected, regenerating plan...');
      const clearResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/ai-plans/regenerate`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!clearResponse.ok) {
        throw new Error('Failed to clear existing plan');
      }
      return await generateAndSavePlan(userProfile);
    }

    return {
      success: true,
      message: 'No significant profile changes detected, keeping current plan',
      planId: currentPlan.id,
    };

  } catch (error) {
    console.error('Error in regeneratePlanIfNeeded:', error);
    return {
      success: false,
      error: error.message || 'Failed to regenerate plan',
    };
  }
};
