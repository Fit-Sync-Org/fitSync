const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
const { checkProgressAndNotify } = require("../utils/simpleProgressTracking");
const webSocketService = require("../services/webSocketService");

exports.getMealsByDate = async(req, res) => {
  try {
    const { date } = req.query;
    const userId = req.user.id;

    if (!date) {
      return res.status(400).json({ error: "Date parameter is required" });
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);

    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const meals = await db.meal.findMany({
      where: {
        userId: userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    const groupedMeals = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: [],
    };

    meals.forEach(meal => {
      const mealType = meal.mealType.toLowerCase();
      if (groupedMeals[mealType]) {
        groupedMeals[mealType].push({
          id: meal.id,
          name: meal.foodName,
          calories: meal.calories,
          carbs: meal.carbs,
          fat: meal.fat,
          protein: meal.protein,
          sodium: meal.sodium,
          sugar: meal.sugar,
          quantity: meal.quantity,
        });
      }
    });

    res.json(groupedMeals);
  } catch (err) {
    console.error("getMealsByDate error:", err);
    res.status(500).json({ error: "Failed to fetch meals" });
  }
};

exports.addMeal = async(req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      calories,
      carbs,
      fat,
      protein,
      sodium,
      sugar,
      quantity = 1,
      mealType,
      date
    } = req.body;

    if (!name || !mealType) {
      return res.status(400).json({ error: "Food name and meal type are required" });
    }
    const mealDate = date ? new Date(date) : new Date();
    const meal = await db.meal.create({
      data: {
        userId: userId,
        foodName: name,
        calories: calories || 0,
        carbs: carbs || 0,
        fat: fat || 0,
        protein: protein || 0,
        sodium: sodium || 0,
        sugar: sugar || 0,
        quantity: quantity,
        mealType: mealType,
        date: mealDate,
      },
    });

    await checkProgressAndNotify(userId);

    const mealData = {
      id: meal.id,
      name: meal.foodName,
      calories: meal.calories,
      carbs: meal.carbs,
      fat: meal.fat,
      protein: meal.protein,
      sodium: meal.sodium,
      sugar: meal.sugar,
      quantity: meal.quantity,
      mealType: meal.mealType,
      date: meal.date,
      action: "added",
      timestamp: new Date().toISOString()
    };

    webSocketService.broadcastMealUpdate(userId, mealData);
    res.status(201).json(mealData);

  } catch (err) {
    console.error("addMeal error:", err);
    res.status(500).json({ error: "Failed to add meal" });
  }
};

exports.updateMeal = async(req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const {
      name,
      calories,
      carbs,
      fat,
      protein,
      sodium,
      sugar,
      quantity,
      mealType
    } = req.body;

    const existingMeal = await db.meal.findFirst({
      where: {
        id: parseInt(id),
        userId: userId,
      },
    });

    if (!existingMeal) {
      return res.status(404).json({ error: "Meal not found" });
    }

    const updatedMeal = await db.meal.update({
      where: { id: parseInt(id) },
      data: {
        foodName: name || existingMeal.foodName,
        calories: calories !== undefined ? calories : existingMeal.calories,
        carbs: carbs !== undefined ? carbs : existingMeal.carbs,
        fat: fat !== undefined ? fat : existingMeal.fat,
        protein: protein !== undefined ? protein : existingMeal.protein,
        sodium: sodium !== undefined ? sodium : existingMeal.sodium,
        sugar: sugar !== undefined ? sugar : existingMeal.sugar,
        quantity: quantity !== undefined ? quantity : existingMeal.quantity,
        mealType: mealType || existingMeal.mealType,
      },
    });


    const mealData = {
      id: updatedMeal.id,
      name: updatedMeal.foodName,
      calories: updatedMeal.calories,
      carbs: updatedMeal.carbs,
      fat: updatedMeal.fat,
      protein: updatedMeal.protein,
      sodium: updatedMeal.sodium,
      sugar: updatedMeal.sugar,
      quantity: updatedMeal.quantity,
      mealType: updatedMeal.mealType,
      date: updatedMeal.date,
      action: "updated",
      timestamp: new Date().toISOString()
    };

    webSocketService.broadcastMealUpdate(userId, mealData);
    res.json(mealData);
  } catch (err) {
    console.error("updateMeal error:", err);
    res.status(500).json({ error: "Failed to update meal" });
  }
};

exports.deleteMeal = async(req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existingMeal = await db.meal.findFirst({
      where: {
        id: parseInt(id),
        userId: userId,
      },
    });

    if (!existingMeal) {
      return res.status(404).json({ error: "Meal not found" });
    }

    await db.meal.delete({
      where: { id: parseInt(id) },
    });

    const deleteData = {
      id: existingMeal.id,
      name: existingMeal.foodName,
      mealType: existingMeal.mealType,
      date: existingMeal.date,
      action: "deleted",
      timestamp: new Date().toISOString()
    };

    webSocketService.broadcastMealUpdate(userId, deleteData);
    res.json({ message: "Meal deleted successfully", deleredMeal: deleteData });
  } catch (err) {
    console.error("deleteMeal error:", err);
    res.status(500).json({ error: "Failed to delete meal" });
  }
};

exports.completeEntry = async(req, res) => {
  try {
    const userId = req.user.id;
    const {
      date,
      summary,
      totalCalories,
      totalCarbs,
      totalFat,
      totalProtein,
      totalSodium,
      totalSugar,
      waterIntake
    } = req.body;

    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }

    const entryDate = new Date(date);

    const existingEntry = await db.completedMealEntry.findFirst({
      where: {
        userId: userId,
        date: entryDate,
      },
    });

    let completedEntry;
    if (existingEntry) {
      completedEntry = await db.completedMealEntry.update({
        where: { id: existingEntry.id },
        data: {
          summary: summary || existingEntry.summary,
          totalCalories: totalCalories || existingEntry.totalCalories,
          totalCarbs: totalCarbs || existingEntry.totalCarbs,
          totalFat: totalFat || existingEntry.totalFat,
          totalProtein: totalProtein || existingEntry.totalProtein,
          totalSodium: totalSodium || existingEntry.totalSodium,
          totalSugar: totalSugar || existingEntry.totalSugar,
          waterIntake: waterIntake || existingEntry.waterIntake,
          isCompleted: true,
        },
      });
    } else {
      completedEntry = await db.completedMealEntry.create({
        data: {
          userId: userId,
          date: entryDate,
          summary: summary || "No meals logged",
          totalCalories: totalCalories || 0,
          totalCarbs: totalCarbs || 0,
          totalFat: totalFat || 0,
          totalProtein: totalProtein || 0,
          totalSodium: totalSodium || 0,
          totalSugar: totalSugar || 0,
          waterIntake: waterIntake || 0,
          isCompleted: true,
        },
      });
    }

    res.status(201).json(completedEntry);
  } catch (err) {
    console.error("completeEntry error:", err);
    res.status(500).json({ error: "Failed to complete meal entry" });
  }
};

exports.getCompletedEntries = async(req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    const completedEntries = await db.completedMealEntry.findMany({
      where: {
        userId: userId,
        date: {
          gte: daysAgo,
        },
        isCompleted: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    res.json(completedEntries);
  } catch (err) {
    console.error("getCompletedEntries error:", err);
    res.status(500).json({ error: "Failed to fetch completed entries" });
  }
};
