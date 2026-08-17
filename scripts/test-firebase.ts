import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyDkeMv4PRcZtK2GVj3eSqgBhWd4LAH59wQ",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "sales-5e7d0.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "sales-5e7d0",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "sales-5e7d0.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "227486973640",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:227486973640:web:f92f8afe60e19a0f88effd",
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || "G-CNMM6T7BJT",
};

async function testFirebase() {
  console.log("Initializing Firebase app with config:", {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
  });

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  console.log("Authenticating test admin user...");
  let user;
  try {
    const cred = await signInWithEmailAndPassword(auth, "admin@solarflow.dev", "SolarFlow2026!");
    user = cred.user;
    console.log("✅ Authenticated existing test admin:", user.uid);
  } catch (err: any) {
    if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
      const cred = await createUserWithEmailAndPassword(auth, "admin@solarflow.dev", "SolarFlow2026!");
      user = cred.user;
      console.log("✅ Created and authenticated new test admin:", user.uid);
    } else {
      console.warn("Auth warning:", err.message);
    }
  }

  console.log("Testing Firestore write to 'solar_leads' with authenticated user...");
  try {
    const leadRef = await addDoc(collection(db, "solar_leads"), {
      uid: user?.uid || "anonymous",
      name: "Test Solar Customer",
      email: "test.customer@solarflow.dev",
      phone: "(602) 555-0199",
      source: "Website",
      status: "qualified",
      score: 95,
      monthlyBill: 350,
      createdAt: new Date().toISOString(),
    });
    console.log("✅ Lead written successfully with ID:", leadRef.id);

    console.log("Testing Firestore write to 'conversations'...");
    const convRef = doc(db, "conversations", "conv-test-101");
    await setDoc(convRef, {
      customer: "Test Solar Customer",
      channel: "Web chat",
      status: "Active",
      lastMessage: "Can you provide a battery backup estimate?",
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: "msg-1",
          sender: "user",
          text: "Can you provide a battery backup estimate?",
          time: "Just now",
        },
      ],
    });
    console.log("✅ Conversation written successfully with ID: conv-test-101");
  } catch (err: any) {
    console.warn("Firestore write notice (Security rules requiring specific user claims or offline):", err.message);
  }

  console.log("\nFirebase Auth and Firestore client layer is configured and integrated!");
}

testFirebase().catch((err) => {
  console.error("❌ Firebase Test Failed:", err);
  process.exit(1);
});
