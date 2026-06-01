import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDYZKWvue0DWkfOhr7m5Rs4UmMLWx3LfoY",
  authDomain: "helmguard-ai.firebaseapp.com",
  projectId: "helmguard-ai",
  storageBucket: "helmguard-ai.firebasestorage.app",
  messagingSenderId: "818974277279",
  appId: "1:818974277279:web:a2e7cfa9be6cec48be2caa",
  measurementId: "G-PTSXN3FGS5"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
