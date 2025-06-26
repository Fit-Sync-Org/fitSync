import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider} from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

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
const analytics = getAnalytics(app);
const googleProvider = new GoogleAuthProvider();

export const auth = getAuth(app);
export { googleProvider}
