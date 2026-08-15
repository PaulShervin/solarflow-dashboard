import React, { createContext, useContext, useEffect, useState } from "react";

export type UserRole = "admin" | "consultant" | "customer";

export type UserSession = {
  token: string;
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  expiresAt: string;
};

type AuthContextType = {
  session: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
};

const AUTH_STORAGE_KEY = "solarflow_session_v1";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
      console.error("Failed to load auth session", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.session) {
        setSession(data.session);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.session));
        return { success: true };
      }
      return { success: false, error: data.error || "Authentication failed" };
    } catch (err: any) {
      return { success: false, error: err.message || "Network connection error" };
    }
  }

  async function logout() {
    if (session) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: { "X-Session-Token": session.token },
      }).catch(() => {});
    }
    setSession(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated: !!session,
        isLoading,
        login,
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
