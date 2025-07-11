import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence, onAuthStateChanged } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getAI, getGenerativeModel, VertexAIBackend } from "firebase/ai";

const firebaseConfig = {
  apiKey: "AIzaSyDgQOuu0TyRJr6s3zaYZI5g0lINAonjtBY",
  authDomain: "fitsync-bd54f.firebaseapp.com",
  projectId: "fitsync-bd54f",
  storageBucket: "fitsync-bd54f.firebasestorage.app",
  messagingSenderId: "748983872079",
  appId: "1:748983872079:web:6e370bab6cbb0ee227983a",
  measurementId: "G-B4E4F6J26B"
};

const app = initializeApp(firebaseConfig);
getAnalytics(app);

// Initialize the Vertex AI Gemini API backend service
const ai = getAI(app, { backend: new VertexAIBackend() });

// Create a `GenerativeModel` instance with a model that supports your use case
export const geminimodel = getGenerativeModel(ai, { model: "gemini-2.5-flash" });
const googleProvider = new GoogleAuthProvider();

export const auth = getAuth(app);

// Set persistence to keep users logged in for extended periods instead of Firebase' default 1 hour
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Firebase persistence set to local storage");
  })
  .catch((error) => {
    console.error("Error setting Firebase persistence:", error);
  });

let tokenRefreshInterval;
let lastActivityTime = Date.now();
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds

const updateLastActivity = () => {
  lastActivityTime = Date.now();
};

if (typeof window !== 'undefined') {
  ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
    document.addEventListener(event, updateLastActivity, true);
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      updateLastActivity();
    }
  });
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    // Clear any existing interval
    if (tokenRefreshInterval) {
      clearInterval(tokenRefreshInterval);
    }


    tokenRefreshInterval = setInterval(async () => {
      try {

        const timeSinceLastActivity = Date.now() - lastActivityTime;

        if (timeSinceLastActivity >= WEEK_IN_MS) {
          console.log("Logging out user due to week of inactivity");
          await auth.signOut();
          return;
        }


        const currentUser = auth.currentUser;
        if (currentUser) {
          await currentUser.getIdToken(true);
          console.log("Token refreshed successfully");
        }
      } catch (error) {
        console.error("Error refreshing token:", error);
      }
    }, 30 * 60 * 1000);

    console.log("User signed in, token refresh monitoring started");
  } else {
    if (tokenRefreshInterval) {
      clearInterval(tokenRefreshInterval);
      tokenRefreshInterval = null;
    }
    console.log("User signed out, token refresh monitoring stopped");
  }

});

export { googleProvider };
