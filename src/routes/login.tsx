import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Lock, ShieldCheck, Sun, User, KeyRound, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { useAuth } from "@/lib/authContext";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Enterprise Secure Login | SolarPeak" },
      { name: "description", content: "Authenticate to access SolarPeak executive dashboard and agent control." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, signup, loginWithGoogle, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "consultant">("admin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    let res;
    if (mode === "signup") {
      res = await signup(email, password, name, role);
    } else {
      res = await login(email, password);
    }
    setLoading(false);

    if (res.success) {
      navigate({ to: "/admin" });
    } else {
      setError(res.error || "Authentication failed");
    }
  }

  async function handleGoogleAuth() {
    setError(null);
    setLoading(true);
    const res = await loginWithGoogle(role);
    setLoading(false);

    if (res.success) {
      navigate({ to: "/admin" });
    } else {
      setError(res.error || "Google authentication failed");
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <SiteHeader />

      <main className="mx-auto w-full max-w-md px-4 py-12">
        <div className="surface-card p-8 shadow-card border-border rounded-2xl">
          <div className="text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-navy text-navy-foreground shadow-md">
              <Sun className="size-6 text-primary" />
            </span>
            <h1 className="mt-4 font-display text-2xl font-extrabold text-foreground">
              {mode === "signup" ? "Create Enterprise Account" : "SolarPeak Enterprise"}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {mode === "signup"
                ? "Register a new executive or consultant profile with Firebase"
                : "Sign in with your verified credentials to access operations console"}
            </p>
          </div>

          {error ? (
            <div className="mt-5 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          ) : null}

          {/* Google 1-Click Authentication */}
          <div className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full h-11 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 border-border hover:bg-secondary/70 transition-all shadow-xs"
            >
              <svg className="size-4.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Sign In with Google
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-card px-2 text-muted-foreground font-bold tracking-wider">
                  Or with email & password
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9 text-sm"
                      placeholder="e.g. Alex Morgan"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Assign Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole("admin")}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                        role === "admin"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/40 text-muted-foreground border-border"
                      }`}
                    >
                      Administrator
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("consultant")}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                        role === "consultant"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/40 text-muted-foreground border-border"
                      }`}
                    >
                      Consultant
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">Work Email</label>
              <div className="relative">
                <User className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 text-sm"
                  placeholder="name@solarpeak.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">Password</label>
              <div className="relative">
                <KeyRound className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full gap-2 py-5 font-bold rounded-xl mt-2">
              <Lock className="size-4" />
              {loading
                ? "Authenticating with Firebase..."
                : mode === "signup"
                ? "Register Enterprise Account"
                : "Sign In to Admin Dashboard"}
            </Button>
          </form>

          <div className="mt-6 border-t border-border pt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError(null);
              }}
              className="text-xs font-bold text-primary hover:underline"
            >
              {mode === "login"
                ? "Need a new admin/consultant account? Create one"
                : "Already have credentials? Sign in here"}
            </button>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
