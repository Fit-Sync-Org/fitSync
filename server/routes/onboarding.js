const express      = require("express");
const router       = express.Router();
const requireAuth  = require("../middleware/requireAuth");
const { PrismaClient } = require("@prisma/client");
const db           = new PrismaClient();

router.put("/profile", requireAuth,  async (req, res) => {
    const userId = req.user.id;
    const {
    firstName,
    lastName,
    ageRange,
    gender,
    occupation,
    inspiration,
    phone,
    weeklyWorkoutHours,
    sessionPreference,
    goals,
  } = req.body;

  try {
    const updated = await db.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        ageRange,
        gender,
        occupation,
        inspiration,
        phone,
        weeklyWorkoutHours,
        sessionPreference,
        goals: {
          connect: Array.isArray(goals)
            ? goals.map((id) => ({ id }))
            : [],
        },
      },
    });

    
    const { password, ...publicData } = updated;
    res.json(publicData);
  } catch (err) {
    console.error("Onboarding update failed:", err);
    res.status(500).json({ error: "Onboarding update failed" });
  }
});

module.exports = router;
