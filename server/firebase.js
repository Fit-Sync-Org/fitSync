const admin = require("firebase-admin");
const dotenv = require("dotenv");

dotenv.config();

if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not set");
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
