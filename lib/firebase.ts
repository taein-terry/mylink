import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCX8udrNpeUQ9rXT2sGCZjL9b14D0xXrvY",
  authDomain: "taeinlink-e8e3e.firebaseapp.com",
  projectId: "taeinlink-e8e3e",
  storageBucket: "taeinlink-e8e3e.firebasestorage.app",
  messagingSenderId: "190762116200",
  appId: "1:190762116200:web:473803875e539dce5547dd"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
