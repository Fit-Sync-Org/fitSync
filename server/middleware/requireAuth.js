const admin = require("../firebase");
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

module.exports = async function requireAuth(req, res, next) {
  try {
    const idToken = req.cookies.token;
    if (!idToken) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decoded = await admin.auth().verifyIdToken(idToken);
    const { uid } = decoded;

    const user = await db.user.findUnique({
      where: { firebaseUid: uid },
    });
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(401).json({ error: "Unauthorized" });
  }
};
