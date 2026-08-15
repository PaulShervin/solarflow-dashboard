import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Lock, ShieldCheck, Sun, User, KeyRound, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { StatusPill } from "@/components/common/StatusPill";
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
  const { login, session } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@solarpeak.com");
  const [password, setPassword] = useState("SolarPeak2026!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      navigate({ to: "/admin" });
    } else {
      setError(res.error || "Invalid credentials");
    }
  }

  function handleDemoSelect(demoEmail: string) {
    setEmail(demoEmail);
    setPassword("SolarPeak2026!");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <SiteHeader />

      <main className="mx-auto w-full max-w-md px-4 py-12">
        <div className="surface-card p-8 shadow-card border-border">
          <div className="text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-navy text-navy-foreground shadow-md">
              <Sun className="size-6 text-primary" />
            </span>
            <h1 className="mt-4 font-display text-2xl font-extrabold text-foreground">
              SolarPeak Enterprise
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Sign in to your enterprise account to manage agentic workflows
            </p>
          </div>

          {error ? (
            <div className="mt-5 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full gap-2 py-5 font-bold">
              <Lock className="size-4" />
              {loading ? "Authenticating..." : "Sign In to Dashboard"}
            </Button>
          </form>

          <div className="mt-8 border-t border-border pt-5">
            <p className="text-[11px] font-bold text-muted-foreground uppercase text-center mb-3">
              Pre-configured Demo Accounts
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleDemoSelect("admin@solarpeak.com")}
                className="w-full rounded-lg border border-border bg-secondary/50 p-2.5 text-left text-xs hover:border-primary transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="font-bold block text-foreground">admin@solarpeak.com</span>
                  <span className="text-[10px] text-muted-foreground">Full Platform Admin</span>
                </div>
                <StatusPill tone="brand">Admin</StatusPill>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect("dana@solarpeak.com")}
                className="w-full rounded-lg border border-border bg-secondary/50 p-2.5 text-left text-xs hover:border-primary transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="font-bold block text-foreground">dana@solarpeak.com</span>
                  <span className="text-[10px] text-muted-foreground">Senior Solar Consultant</span>
                </div>
                <StatusPill tone="success">Consultant</StatusPill>
              </button>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
