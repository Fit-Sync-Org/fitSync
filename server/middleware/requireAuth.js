const admin = require("../firebase");
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

module.exports = async function requireAuth(req, res, next) {
  console.log("requireAuth hit!", req.path);
  try {
    let idToken = req.cookies.token;

    if (!idToken) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        idToken = authHeader.substring(7);
      }
    }

    if (!idToken) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decoded = await admin.auth().verifyIdToken(idToken);
    const { uid } = decoded;

    let user;
    try {
      user = await db.user.findUnique({
        where: { firebaseUid: uid },
        include: { goals: true }
      });
    } catch (dbError) {
      console.error("Database connection error:", dbError);
      // Return a more specific error for database issues
      return res.status(503).json({ 
        error: "Database temporarily unavailable", 
        details: "Please try again in a few moments" 
      });
    }
    
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
