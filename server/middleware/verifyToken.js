const admin = require("../firebase");

module.exports = async function verifyToken(req, res, next) {
  console.log("requireAuth hit!", req.path);
  try {
    const token =
      req.headers.authorization?.split("Bearer ")[1] || req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: "Missing Firebase token" });
    }

    req.decoded = await admin.auth().verifyIdToken(token);
    return next();
  } catch (err) {
    console.error("verifyToken failed:", err);
    return res.status(401).json({ error: "Unauthorized" });
  }
};
