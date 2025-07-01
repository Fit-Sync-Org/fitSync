const admin = require("../firebase");

module.exports = async function verifyToken(req, res, next) {
  try {
    const token =
      req.headers.authorization?.split("Bearer ")[1] || req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: "Missing Firebase token" });
    }
    const decoded = await admin.auth().verifyIdToken(token);
    req.decoded = decoded;
    next();
  } catch (err) {
    console.error("verifyToken error:", err);
    return res.status(401).json({ error: "Invalid or expired Firebase token" });
  }
};
