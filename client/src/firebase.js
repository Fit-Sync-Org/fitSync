// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDgQOuu0TyRJr6s3zaYZI5g0lINAonjtBY",
  authDomain: "fitsync-bd54f.firebaseapp.com",
  projectId: "fitsync-bd54f",
  storageBucket: "fitsync-bd54f.firebasestorage.app",
  messagingSenderId: "748983872079",
  appId: "1:748983872079:web:6e370bab6cbb0ee227983a",
  measurementId: "G-B4E4F6J26B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
