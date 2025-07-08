const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

exports.getWorkoutByDate = async (req, res) => {
  try {
    const { date } = req.query;
    const userId = req.user?.id;
    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    const target = new Date(date);
    const startOfDay = new Date(target);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(target);
    endOfDay.setHours(23, 59, 59, 999);

    const list = await db.workout.findMany({
      where: {
        userId,
        date: { gte: startOfDay, lte: endOfDay }
      },
      orderBy: { date: 'asc' }
    });

    const grouped = {
      cardio: [],
      strength: [],
      flexibility: [],
      sports: []
    };
    list.forEach(w => {
      if (grouped[w.workoutType]) {
        grouped[w.workoutType].push({
          id: w.id,
          name: w.name,
          durationMinutes: w.durationMinutes,
          caloriesBurned: w.caloriesBurned,
          sets: w.sets,
          reps: w.reps,
          weight: w.weight,
          notes: w.notes
        });
      }
    });

    res.json(grouped);
  } catch (err) {
    console.error('getWorkoutsByDate error:', err);
    res.status(500).json({ error: 'Failed to fetch workouts' });
  }
};

exports.addWorkout = async (req, res) => {
  try {
    const userId = req.user?.id;
    const {
      workoutType,
      name,
      durationMinutes,
      caloriesBurned,
      sets,
      reps,
      weight,
      notes,
      date
    } = req.body;

    if (!workoutType || !name || durationMinutes == null || caloriesBurned == null) {
      return res
        .status(400)
        .json({ error: 'WorkoutType, name, durationMinutes and caloriesBurned are required' });
    }

    const workoutDate = date ? new Date(date) : new Date();
    const w = await db.workout.create({
      data: {
        userId,
        workoutType,
        name,
        durationMinutes,
        caloriesBurned,
        sets: sets || 0,
        reps: reps || 0,
        weight: weight || 0,
        notes: notes || '',
        date: workoutDate
      }
    });

    res.status(201).json({
      id: w.id,
      workoutType: w.workoutType,
      name: w.name,
      durationMinutes: w.durationMinutes,
      caloriesBurned: w.caloriesBurned,
      sets: w.sets,
      reps: w.reps,
      weight: w.weight,
      notes: w.notes,
      date: w.date
    });
  } catch (err) {
    console.error('addWorkout error:', err);
    res.status(500).json({ error: 'Failed to add workout' });
  }
};

exports.updateWorkout = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const data = req.body;

    const existing = await db.workout.findFirst({
      where: { id: Number(id), userId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Workout not found' });
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
        notes: data.notes ?? existing.notes
      }
    });

    res.json({
      id: updated.id,
      workoutType: updated.workoutType,
      name: updated.name,
      durationMinutes: updated.durationMinutes,
      caloriesBurned: updated.caloriesBurned,
      sets: updated.sets,
      reps: updated.reps,
      weight: updated.weight,
      notes: updated.notes,
      date: updated.date
    });
  } catch (err) {
    console.error('updateWorkout error:', err);
    res.status(500).json({ error: 'Failed to update workout' });
  }
};

exports.deleteWorkout = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const existing = await db.workout.findFirst({
      where: { id: Number(id), userId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    await db.workout.delete({ where: { id: Number(id) } });
    res.json({ message: 'Workout deleted successfully' });
  } catch (err) {
    console.error('deleteWorkout error:', err);
    res.status(500).json({ error: 'Failed to delete workout' });
  }
};
