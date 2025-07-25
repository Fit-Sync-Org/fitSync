const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
const { checkProgressAndNotify } = require("../utils/simpleProgressTracking");
const webSocketService = require("../services/webSocketService");

exports.getWorkoutByDate = async(req, res) => {
  try {
    const { date } = req.query;
    const userId = req.user?.id;
    if (!date) {
      return res.status(400).json({ error: "Date parameter is required" });
    }

    const target = new Date(date);
    const startOfDay = new Date(target);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(target);
    endOfDay.setHours(23, 59, 59, 999);

    const list = await db.workout.findMany({
      where: {
        userId,
        date: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { date: "asc" },
    });

    const grouped = {
      cardio: [],
      strength: [],
      flexibility: [],
      sports: [],
    };
    list.forEach((w) => {
      if (grouped[w.workoutType]) {
        grouped[w.workoutType].push({
          id: w.id,
          name: w.name,
          duration: w.durationMinutes,
          calories: w.caloriesBurned,
          sets: w.sets,
          reps: w.reps,
          weight: w.weight,
          notes: w.notes,
        });
      }
    });

    res.json(grouped);
  } catch (err) {
    console.error("getWorkoutsByDate error:", err);
    res.status(500).json({ error: "Failed to fetch workouts" });
  }
};

exports.addWorkout = async(req, res) => {
  try {
    const userId = req.user?.id;
    const {
      workoutType,
      type,
      name,
      durationMinutes,
      duration,
      caloriesBurned,
      calories,
      sets,
      reps,
      weight,
      notes,
      date,
    } = req.body;

    const finalWorkoutType = type || workoutType;
    const finalDuration = duration || durationMinutes;
    const finalCalories = calories || caloriesBurned;

    if (
      !finalWorkoutType ||
      !name ||
      finalDuration == null ||
      finalCalories == null
    ) {
      return res
        .status(400)
        .json({
          error: "Workout type, name, duration, and calories are required",
        });
    }

    const workoutDate = date ? new Date(date) : new Date();
    const w = await db.workout.create({
      data: {
        userId,
        workoutType: finalWorkoutType,
        name,
        durationMinutes: finalDuration,
        caloriesBurned: finalCalories,
        sets: sets || 0,
        reps: reps || 0,
        weight: weight || 0,
        notes: notes || "",
        date: workoutDate,
      },
    });

    await checkProgressAndNotify(userId);

    const workoutData = {
      id: w.id,
      type: w.workoutType,
      name: w.name,
      duration: w.durationMinutes,
      calories: w.caloriesBurned,
      sets: w.sets,
      reps: w.reps,
      weight: w.weight,
      notes: w.notes,
      date: w.date,
      action: "added",
      timestamp: new Date().toISOString(),
    };

    webSocketService.broadcastWorkoutUpdate(userId, workoutData);
    res.status(201).json(workoutData);
  } catch (err) {
    console.error("addWorkout error:", err);
    res.status(500).json({ error: "Failed to add workout" });
  }
};

exports.updateWorkout = async(req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const data = req.body;

    const existing = await db.workout.findFirst({
      where: { id: Number(id), userId },
    });
    if (!existing) {
      return res.status(404).json({ error: "Workout not found" });
    }

    const updated = await db.workout.update({
      where: { id: Number(id) },
      data: {
        workoutType: data.workoutType ?? existing.workoutType,
        name: data.name ?? existing.name,
        durationMinutes: data.durationMinutes ?? existing.durationMinutes,
        caloriesBurned: data.caloriesBurned ?? existing.caloriesBurned,
        sets: data.sets ?? existing.sets,
        reps: data.reps ?? existing.reps,
        weight: data.weight ?? existing.weight,
        notes: data.notes ?? existing.notes,
      },
    });

    const workoutData = {
      id: updated.id,
      type: updated.workoutType,
      name: updated.name,
      duration: updated.durationMinutes,
      calories: updated.caloriesBurned,
      sets: updated.sets,
      reps: updated.reps,
      weight: updated.weight,
      notes: updated.notes,
      date: updated.date,
      action: "updated",
      timestamp: new Date().toISOString(),
    };

    webSocketService.broadcastWorkoutUpdate(userId, workoutData);
    res.json(workoutData);
  } catch (err) {
    console.error("updateWorkout error:", err);
    res.status(500).json({ error: "Failed to update workout" });
  }
};

exports.deleteWorkout = async(req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const existing = await db.workout.findFirst({
      where: { id: Number(id), userId },
    });
    if (!existing) {
      return res.status(404).json({ error: "Workout not found" });
    }

    await db.workout.delete({ where: { id: Number(id) } });

    const deleteData = {
      id: existing.id,
      name: existing.name,
      type: existing.workoutType,
      date: existing.date,
      action: "deleted",
      timestamp: new Date().toISOString(),
    };

    webSocketService.broadcastWorkoutUpdate(userId, deleteData);
    res.json({
      message: "Workout deleted successfully",
      deletedWorkout: deleteData,
    });
  } catch (err) {
    console.error("deleteWorkout error:", err);
    res.status(500).json({ error: "Failed to delete workout" });
  }
};

exports.completeEntry = async(req, res) => {
  try {
    const userId = req.user?.id;
    const {
      date,
      summary,
      totalCaloriesBurned,
      totalDuration,
      totalExercises,
    } = req.body;

    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }

    const entryDate = new Date(date);

    const existingEntry = await db.completedWorkoutEntry.findFirst({
      where: {
        userId: userId,
        date: entryDate,
      },
    });

    let completedEntry;
    if (existingEntry) {
      completedEntry = await db.completedWorkoutEntry.update({
        where: { id: existingEntry.id },
        data: {
          summary: summary || existingEntry.summary,
          totalCaloriesBurned:
            totalCaloriesBurned || existingEntry.totalCaloriesBurned,
          totalDuration: totalDuration || existingEntry.totalDuration,
          totalExercises: totalExercises || existingEntry.totalExercises,
          isCompleted: true,
        },
      });
    } else {
      completedEntry = await db.completedWorkoutEntry.create({
        data: {
          userId: userId,
          date: entryDate,
          summary: summary || "No workouts logged",
          totalCaloriesBurned: totalCaloriesBurned || 0,
          totalDuration: totalDuration || 0,
          totalExercises: totalExercises || 0,
          isCompleted: true,
        },
      });
    }

    res.status(201).json(completedEntry);
  } catch (err) {
    console.error("completeEntry error:", err);
    res.status(500).json({ error: "Failed to complete workout entry" });
  }
};

exports.getCompletedEntries = async(req, res) => {
  try {
    const userId = req.user?.id;
    const { days = 30 } = req.query;

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    const completedEntries = await db.completedWorkoutEntry.findMany({
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
