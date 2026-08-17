import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

function getEnv(key: string, fallback: string): string {
  try {
    if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
  } catch {
    // Ignore in non-meta environments
  }
  try {
    if (typeof process !== "undefined" && process.env && process.env[key]) {
      return process.env[key] as string;
    }
  } catch {
    // Ignore in non-process environments
  }
  return fallback;
}

/**
 * SolarFlow Firebase Configuration
 * Credentials for project: sales-5e7d0
 */
export const firebaseConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY", "AIzaSyDkeMv4PRcZtK2GVj3eSqgBhWd4LAH59wQ"),
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN", "sales-5e7d0.firebaseapp.com"),
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID", "sales-5e7d0"),
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET", "sales-5e7d0.firebasestorage.app"),
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID", "227486973640"),
  appId: getEnv("VITE_FIREBASE_APP_ID", "1:227486973640:web:f92f8afe60e19a0f88effd"),
  measurementId: getEnv("VITE_FIREBASE_MEASUREMENT_ID", "G-CNMM6T7BJT"),
};

// Initialize or reuse existing Firebase App instance (handles SSR & HMR safely)
export const app: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Firebase Core Services
export const auth: Auth = getAuth(app);
export const firestore: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

// SSR-safe Firebase Analytics initialization
export let analytics: Analytics | null = null;
if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      // Analytics not supported in this runtime environment
    });
}

export default app;
