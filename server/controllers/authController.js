const admin = require("../Firebase/firebase");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const db = new PrismaClient();

exports.firebaseLogin = async (req, res) => {
  const { idToken } = req.body;

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const email = decoded.email;

    let user = await db.user.findUnique({ where: { email } });
    if (!user) {
      user = await db.user.create({
        data: { email, password: "", createdAt: new Date() },
      });
    }
    res
      .cookie("token", idToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })
      .json({ message: "Firebase login successful" });
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: "Invalid Firebase ID token" });
  }
};

exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingEmail = await db.user.findUnique({ where: { email } });
    const existingUsername = await db.user.findUnique({ where: { username } });
    if (existingEmail || existingUsername) {
      return res.status(400).json({ error: "Email or username already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.user.create({
      data: { username, email, password: hashedPassword, createdAt: new Date() },
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
};
