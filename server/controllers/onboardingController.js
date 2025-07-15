const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

exports.registerNewUser = async (req, res) => {
  const { uid, email } = req.decoded;
  const data = req.body;

  const exists = await db.user.findUnique({ where: { firebaseUid: uid } });
  if (exists) return res.status(409).json({ error: "User already exists" });

  const user = await db.user.create({
    data: {
      firebaseUid: uid,
      email,
      firstName: data.name.firstName,
      lastName : data.name.lastName,
      age : data.age,
      gender   : data.gender,
      occupation: data.occupation,
      phone     : data.phone,
      weeklyWorkoutHours: data.availability,
      sessionPreference : data.preference,
      dietaryRestrictions: data.diet,
      heightCm:  data.metrics.height,
      weightKg:  data.metrics.weight,
      goals: {
        connect: Array.isArray(data.goal) ? data.goal.map(id => ({ name: id })) : [],
      },
      hasCompletedOnboarding: true,
    },
  });

  const isProd = process.env.NODE_ENV === "production";

  res.cookie("token", req.headers.authorization.split("Bearer ")[1], {
    sameSite: isProd ? "none" : "lax",
    secure  : isProd,
    path    : "/",
    domain  : isProd ? ".onrender.com" : "localhost",
  });


  try {
    const planJob = await enqueuePlanGeneration(user.id);
    console.log(
      `Plan generation job ${planJob.id} queued for new user ${user.id}`
    );

    res.json({
      message: "Onboarding complete",
      userId: user.id,
      planGenerationQueued: true,
    });
  } catch (queueError) {
    console.warn(
      `Failed to queue plan generation for user ${user.id}:`,
      queueError.message
    );

    res.json({
      message: "Onboarding complete",
      userId: user.id,
      planGenerationQueued: false,
      planGenerationError: "Plan generation will be available later",
    });
  }
};

exports.completeOnboarding = async (req, res) => {
  try {
    await db.user.update({
      where: { id: req.user.id },
      data: { hasCompletedOnboarding: true },
    });
    res.json({ message: "Onboarding marked complete" });
  } catch (err) {
    console.error("completeOnboarding error:", err);
    res.status(500).json({ error: "Failed to update onboarding status" });
  }
};
