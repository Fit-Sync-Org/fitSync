const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

exports.completeOnboarding = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      age,
      goal,
      gender,
      occupation,
      availability,
      preference,
      diet,
      metrics,
      phone,
    } = req.body;

    await db.user.update({
      where: { id: userId },
      data: {
        firstName: name.firstName,
        lastName: name.lastName,
        ageRange: age,
        gender,
        occupation,
        phone,
        weeklyWorkoutHours: availability,
        sessionPreference: preference,
        dietaryRestrictions: diet,
        heightCm: metrics.height,
        weightKg: metrics.weight,
        Goals: {
          connect: Array.isArray(goal) ? goal.map((id) => ({ id })) : [],
        },
        hasCompletedOnboarding: true,
      },
    });

    res.json({ message: "Onboarding marked complete" });
  } catch (err) {
    console.error("completeOnboarding error:", err);
    res.status(500).json({ error: "Failed to update onboarding status" });
  }
};
