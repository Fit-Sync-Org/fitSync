const admin = require("../firebase");
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

exports.firebaseLogin = async (req, res) => {
  const { idToken } = req.body;

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const { uid, email } = decoded;

    let user = await db.user.findUnique({
      where: { firebaseUid: uid },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          firebaseUid: uid,
          email,
          createdAt: new Date(),
        },
      });
    }

    res.cookie("token", idToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" ? true : false,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
      });


    res.json({
    message: "Firebase login successful",
     user: {
        id: user.id, email: user.email, hasCompletedOnboarding: user.hasCompletedOnboarding}
});
  } catch (err) {
    console.error("firebaseLogin error:", err);
    return res
      .status(401)
      .json({ error: err.errorInfo?.message || "Invalid Firebase ID token" });
  }
};

exports.logout = (req, res) => {
  res
    .clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    })
    .json({ message: "Logged out successfully" });
};

exports.me = (req, res) => {
  try {
    const { password, ...publicData } = req.user;
    return res.json(publicData);
  } catch (err) {
    console.error("me handler error:", err);
    return res.status(500).json({ error: "Could not fetch user" });
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
