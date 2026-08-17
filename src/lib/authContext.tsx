import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, firestore } from "./firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export type UserRole = "admin" | "consultant" | "customer";

export type UserSession = {
  token: string;
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  expiresAt: string;
  photoUrl?: string | undefined;
};

type AuthContextType = {
  session: UserSession | null;
  currentUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isConsultant: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (defaultRole?: UserRole) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, pass: string, name: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
};

const AUTH_STORAGE_KEY = "solarflow_session_v1";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to fetch or create user role in Firestore
  async function resolveUserSession(fbUser: FirebaseUser, overrideRole?: UserRole): Promise<UserSession> {
    let role: UserRole = overrideRole || "customer";
    let name: string = fbUser.displayName || fbUser.email?.split("@")[0] || "User";

    // Standard admin/consultant email patterns or Firestore user record
    if (fbUser.email?.includes("admin@") || fbUser.email?.includes("admin")) {
      role = "admin";
    } else if (fbUser.email?.includes("dana@") || fbUser.email?.includes("consultant")) {
      role = "consultant";
    }

    try {
      const userRef = doc(firestore, "users", fbUser.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data();
        if (data.role) role = data.role as UserRole;
        if (data.name) name = data.name;
      } else {
        // Create initial Firestore user document
        await setDoc(userRef, {
          uid: fbUser.uid,
          email: fbUser.email || "",
          name: name,
          role: role,
          createdAt: serverTimestamp(),
        }, { merge: true });
      }
    } catch (err) {
      console.warn("Could not sync user profile with Firestore (offline/security rules fallback)", err);
    }

    const userSession: UserSession = {
      token: fbUser.uid,
      userId: fbUser.uid,
      email: fbUser.email || "",
      name: name,
      role: role,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      photoUrl: fbUser.photoURL || undefined,
    };

    return userSession;
  }

  useEffect(() => {
    // Restore cached session while checking Firebase
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed: UserSession = JSON.parse(stored);
        if (new Date(parsed.expiresAt).getTime() > Date.now()) {
          setSession(parsed);
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    } catch (err) {
      console.error("Failed to load cached auth session", err);
    }

    // Subscribe to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setCurrentUser(fbUser);
        const resolved = await resolveUserSession(fbUser);
        setSession(resolved);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(resolved));
      } else {
        setCurrentUser(null);
        setSession(null);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const user = userCred.user;
      setCurrentUser(user);
      const resolved = await resolveUserSession(user);
      setSession(resolved);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(resolved));
      return { success: true };
    } catch (err: any) {
      console.error("Firebase email login error", err);
      let msg = err.message || "Failed to authenticate";
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        msg = "Invalid email or password. Please verify credentials.";
      } else if (err.code === "auth/too-many-requests") {
        msg = "Access temporarily disabled due to many failed login attempts. Try again later.";
      }
      return { success: false, error: msg };
    }
  }

  async function loginWithGoogle(defaultRole: UserRole = "admin"): Promise<{ success: boolean; error?: string }> {
    try {
      const provider = new GoogleAuthProvider();
      const userCred = await signInWithPopup(auth, provider);
      const user = userCred.user;
      setCurrentUser(user);
      const resolved = await resolveUserSession(user, defaultRole);
      setSession(resolved);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(resolved));
      return { success: true };
    } catch (err: any) {
      console.error("Firebase Google login error", err);
      return { success: false, error: err.message || "Google sign-in failed." };
    }
  }

  async function signup(email: string, pass: string, name: string, role: UserRole = "admin"): Promise<{ success: boolean; error?: string }> {
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, pass);
      const user = userCred.user;
      
      if (name) {
        await updateProfile(user, { displayName: name });
      }

      const userRef = doc(firestore, "users", user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email || "",
        name: name || user.email?.split("@")[0] || "Admin User",
        role: role,
        createdAt: serverTimestamp(),
      });

      setCurrentUser(user);
      const resolved = await resolveUserSession(user, role);
      setSession(resolved);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(resolved));
      return { success: true };
    } catch (err: any) {
      console.error("Firebase signup error", err);
      let msg = err.message || "Failed to create account";
      if (err.code === "auth/email-already-in-use") {
        msg = "An account with this email already exists. Please log in.";
      } else if (err.code === "auth/weak-password") {
        msg = "Password should be at least 6 characters.";
      }
      return { success: false, error: msg };
    }
  }

  async function logout() {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.warn("Sign out error", err);
    }
    setSession(null);
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  const isAdmin = session?.role === "admin";
  const isConsultant = session?.role === "consultant" || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        session,
        currentUser,
        isAuthenticated: !!session,
        isAdmin,
        isConsultant,
        isLoading,
        login,
        loginWithGoogle,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
