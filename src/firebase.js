// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCLdFXeJpN1BaUbOhYhpnk6bqPMUcAF8AE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "digital-twin-planner.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "digital-twin-planner",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "digital-twin-planner.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "766778230630",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:766778230630:web:6e56143d8a0c72240f6aa7"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Configure Firebase Auth to persist sessions
setPersistence(auth, browserLocalPersistence);
