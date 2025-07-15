const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize Firebase Admin and Gemini AI
let geminiModel;
let genAI;

try {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    console.warn("FIREBASE_SERVICE_ACCOUNT_JSON not found in environment variables");
    console.warn("Plan generation will use fallback mode");
  } else {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    }

    const FIREBASE_API_KEY = "AIzaSyDgQOuu0TyRJr6s3zaYZI5g0lINAonjtBY";

    genAI = new GoogleGenerativeAI(FIREBASE_API_KEY);
    geminiModel = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7
      }
    });

    console.log("Gemini AI initialized successfully using client-side approach");
  }
} catch (error) {
  console.error("Failed to initialize Gemini AI:", error.message);
  console.warn("Plan generation will use fallback mode");
}

module.exports = {
  geminiModel,
  isAvailable: !!geminiModel
};
