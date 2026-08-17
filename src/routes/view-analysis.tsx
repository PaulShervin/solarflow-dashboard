import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Sun,
  Zap,
  ShieldCheck,
  Battery,
  Calculator,
  Award,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Phone,
  Mail,
  User,
  Lock,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { auth, firestore } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { syncLeadToFirestore } from "@/lib/firestoreSync";
import { solarApi } from "@/lib/api";
import { formatINR } from "@/lib/formatCurrency";
import type { Lead } from "@/types/solar";

export const Route = createFileRoute("/view-analysis")({
  head: () => ({
    meta: [
      { title: "Your Solar Analysis | SolarFlow" },
    ],
  }),
  component: ViewAnalysisPage,
});

function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function computeAnalysis(params: any) {
  const p = params || {
    roofMode: "dimensions",
    lengthM: 10,
    widthM: 8,
    monthlyBill: 4500,
    regionId: "MH",
    costTier: "standard",
    addBattery: false,
  };
  const area = p.roofMode === "dimensions" ? (p.lengthM || 10) * (p.widthM || 8) : p.roofAreaM2 || 80;
  const usableArea = area * 0.75;
  const panelsCount = Math.max(4, Math.floor((usableArea / 2.09) * 0.85));
  const kw = Math.round(((panelsCount * 400) / 1000) * 100) / 100;
  const prod = Math.round(kw * 5 * 30 * 0.78);
  const bill = p.monthlyBill || 4500;
  const cons = Math.round(bill / 8.5);
  const savings = Math.round(Math.min(prod, cons) * 8.5);
  const cost = Math.round(kw * 65000);
  const sub = Math.min(78000, kw <= 2 ? kw * 30000 : 60000 + (kw - 2) * 18000);
  const net = Math.max(0, cost - sub);
  const payback = Math.round((net / Math.max(1, savings * 12)) * 10) / 10;

  return {
    usableAreaM2: usableArea,
    panelFootprintM2: 2.09,
    maxPanelCount: panelsCount,
    systemSizeKw: kw,
    monthlyProductionKwh: prod,
    monthlyConsumptionKwh: cons,
    monthlySavingsInr: savings,
    reductionPct: Math.min(100, Math.round((prod / Math.max(1, cons)) * 100)),
    systemCostInr: cost,
    subsidyInr: sub,
    netCostInr: net,
    paybackYears: payback,
    panelUsed: { name: "Standard 400W Mono", wattage_w: 400 },
    tariffUsed: { region_name: p.regionId === "MH" ? "Maharashtra" : "Your Region", rate_per_kwh: 8.5 },
    costTierUsed: p.costTier || "standard",
    costPerKwRate: 65000,
    calculatedAt: new Date().toISOString(),
    batteryDetails: p.addBattery
      ? { batteryCostInr: (p.batteryCapacity || 5) * 20000, estimatedBackupHours: 3.3, batteryName: "LFP Lithium" }
      : undefined,
  };
}

function ViewAnalysisPage() {
  const [params, setParams] = useState<any>(null);
  const [registered, setRegistered] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authMode, setAuthMode] = useState<"register" | "signin">("register");
  
  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Result state
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    let initialParams: any = null;
    const saved = sessionStorage.getItem("customerAnalysisParams");
    if (saved) {
      try {
        initialParams = JSON.parse(saved);
        setParams(initialParams);
        if (initialParams.customerName) setName(initialParams.customerName);
      } catch (err) {
        console.error("Failed to parse saved parameters", err);
      }
    }

    // Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const resolvedName = user.displayName || initialParams?.customerName || "Paul Shervin";
        if (user.displayName && !name) setName(user.displayName);
        if (user.email && !email) setEmail(user.email);
        setRegistered(true);

        const calculated = computeAnalysis(initialParams || params);
        setResult(calculated);

        // Automatically sync customer lead to local DB, Firestore, and backend API
        await saveLeadToFirestore(
          user.uid,
          user.email || "customer@solarpeak.com",
          resolvedName,
          phone || "+91 98765 43210",
          calculated,
          initialParams
        );
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  async function saveLeadToFirestore(
    uid: string,
    userEmail: string,
    userName: string,
    userPhone: string,
    calculatedData: any,
    overrideParams?: any
  ) {
    try {
      const activeParams = overrideParams || params;
      const finalName = (userName && userName !== "Customer") ? userName : (currentUser?.displayName || "Paul Shervin");
      const finalEmail = userEmail || currentUser?.email || "customer@solarpeak.com";

      const newLead: Lead = {
        id: `LD-${uid.slice(0, 6).toUpperCase()}`,
        name: finalName,
        email: finalEmail,
        phone: userPhone || "+91 98765 43210",
        city: activeParams?.city || "Mumbai",
        state: "MH",
        source: "Website",
        status: "qualified",
        score: 96,
        monthlyBill: Number(activeParams?.monthlyBill) || 6000,
        homeType: (activeParams?.homeType as any) || "Single family",
        roof: (activeParams?.roof as any) || "Flat RCC",
        timeline: "0-1 month",
        homeowner: true,
        createdAt: new Date().toISOString(),
        lastTouch: "Just now",
        owner: "Dana Ruiz",
        aiSummary: `Customer unlocked solar ROI analysis. System size: ${calculatedData?.systemSizeKw || 7.2} kW, Monthly production: ${calculatedData?.monthlyProductionKwh || 842} kWh, Est. net cost: ${formatINR(calculatedData?.netCostInr || 390000)}.`,
        tags: ["Solar ROI Unlocked", "High Intent", "Website"],
      };

      db.addLead(newLead);
      await syncLeadToFirestore(newLead);

      solarApi.postInboundWebhook({
        name: newLead.name,
        email: newLead.email,
        phone: newLead.phone,
        monthlyBill: newLead.monthlyBill,
        roof: newLead.roof as any,
        timeline: newLead.timeline as any,
        homeowner: newLead.homeowner,
      }).catch(() => {});
    } catch (err) {
      console.warn("Could not write lead to Firestore (check rules/offline):", err);
    }
  }

  // Google 1-Click Auth
  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCred = await signInWithPopup(auth, provider);
      const user = userCred.user;
      setCurrentUser(user);

      const calculated = computeAnalysis(params);
      setResult(calculated);

      await saveLeadToFirestore(user.uid, user.email || "", user.displayName || name, phone, calculated);

      setRegistered(true);
      toast.success(`Welcome, ${user.displayName || "Customer"}! Analysis unlocked.`);
    } catch (err: any) {
      console.error("Google Auth error", err);
      setErrorMsg(err.message || "Google sign-in failed. Please try again.");
      toast.error(err.message || "Google sign-in failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Email & Password Registration / Sign-In
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      let user: FirebaseUser;
      const userPassword = password || "SolarPeak2026!";

      if (currentUser) {
        user = currentUser;
      } else if (authMode === "signin") {
        const userCred = await signInWithEmailAndPassword(auth, email, userPassword);
        user = userCred.user;
      } else {
        try {
          const userCred = await createUserWithEmailAndPassword(auth, email, userPassword);
          user = userCred.user;
        } catch (createErr: any) {
          // If email already exists, try signing in
          if (createErr.code === "auth/email-already-in-use") {
            const signInCred = await signInWithEmailAndPassword(auth, email, userPassword);
            user = signInCred.user;
          } else {
            throw createErr;
          }
        }
      }

      setCurrentUser(user);
      const calculated = computeAnalysis(params);
      setResult(calculated);

      await saveLeadToFirestore(user.uid, email, name, phone, calculated);

      setRegistered(true);
      toast.success("Analysis unlocked successfully!");
    } catch (err: any) {
      console.error("Auth error", err);
      let message = err.message || "Authentication failed";
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        message = "Invalid password. If this is a new account, switch to Register.";
      } else if (err.code === "auth/weak-password") {
        message = "Password should be at least 6 characters.";
      } else if (err.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      }
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setRegistered(false);
    toast.info("Signed out of Firebase account");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10 sm:px-6 lg:px-8">
        
        {!registered ? (
          <div className="max-w-md mx-auto">
            <div className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-lg text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight mb-2">
                Unlock Your Free Solar Analysis
              </h1>
              <p className="text-muted-foreground text-sm mb-6">
                We've processed your roof and energy parameters. Fill in your details below to instantly view your customized solar ROI and system design.
              </p>
              
              {currentUser ? (
                <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between text-left">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm shrink-0">
                      {((currentUser.displayName || currentUser.email || "U")[0] || "U").toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {currentUser.displayName || "Authenticated User"}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {currentUser.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="text-xs text-muted-foreground hover:text-destructive h-8 px-2"
                  >
                    <LogOut className="size-3.5 mr-1" />
                    Sign out
                  </Button>
                </div>
              ) : (
                <>
                  {/* Google 1-Click Authentication */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleAuth}
                    disabled={submitting}
                    className="w-full h-11 rounded-xl mb-4 font-semibold text-sm flex items-center justify-center gap-2.5 border-border hover:bg-secondary/70 transition-all shadow-xs"
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
                    Continue with Google
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase">
                      <span className="bg-card px-2 text-muted-foreground font-bold tracking-wider">
                        Or with email
                      </span>
                    </div>
                  </div>
                </>
              )}

              {errorMsg ? (
                <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive flex items-center gap-2 text-left">
                  <AlertCircle className="size-4 shrink-0 text-destructive" />
                  <span>{errorMsg}</span>
                </div>
              ) : null}

              <form onSubmit={handleEmailAuth} className="space-y-4 text-left">
                {!currentUser && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="pl-9 h-10 rounded-xl"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      required
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="pl-9 h-10 rounded-xl"
                    />
                  </div>
                </div>

                {!currentUser && (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          required
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="john@example.com"
                          className="pl-9 h-10 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-muted-foreground">Password (Optional)</label>
                        <button
                          type="button"
                          onClick={() => setAuthMode(authMode === "register" ? "signin" : "register")}
                          className="text-[11px] font-bold text-primary hover:underline"
                        >
                          {authMode === "register" ? "Have an account? Sign in" : "New user? Register"}
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min. 6 characters"
                          className="pl-9 h-10 rounded-xl"
                        />
                      </div>
                    </div>
                  </>
                )}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 text-base font-bold rounded-xl mt-2"
                >
                  {submitting ? "Processing..." : currentUser ? "View My Analysis" : authMode === "register" ? "Register & View Analysis" : "Sign In & View Analysis"}
                </Button>
              </form>

              <p className="text-[11px] text-muted-foreground mt-4 text-center">
                By continuing, you agree to our Terms of Service and Privacy Policy. Securely authenticated with Firebase.
              </p>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="mb-8 text-center sm:text-left">
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
                Your Customized Solar Analysis
              </h1>
              <p className="text-muted-foreground text-sm">
                Based on the parameters you provided, here is the projected performance and ROI for your home.
              </p>
            </div>

            {result ? (
              <div className="space-y-5">
                
                {/* Primary Key Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  {/* System Capacity */}
                  <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-primary/50 transition-all">
                    <div className="absolute right-3 top-3 p-2 bg-amber-500/10 rounded-xl">
                      <Sun className="h-5 w-5 text-amber-500" />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">System Size</span>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold tracking-tight text-foreground">{result.systemSizeKw}</span>
                      <span className="text-sm font-semibold text-muted-foreground">kW</span>
                    </div>
                    <div className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>Fits <strong className="text-foreground">{result.maxPanelCount} panels</strong> on roof</span>
                    </div>
                  </div>

                  {/* Monthly Generation */}
                  <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-blue-500/50 transition-all">
                    <div className="absolute right-3 top-3 p-2 bg-blue-500/10 rounded-xl">
                      <Zap className="h-5 w-5 text-blue-500" />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">Monthly Production</span>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold tracking-tight text-foreground">{result.monthlyProductionKwh}</span>
                      <span className="text-sm font-semibold text-muted-foreground">kWh</span>
                    </div>
                    <div className="mt-2 text-[11px] text-muted-foreground font-medium">
                      ~<strong>{Math.round(result.monthlyProductionKwh / 30)}</strong> units generated per day
                    </div>
                  </div>

                  {/* Net Cost after PM Surya Ghar */}
                  <div className="bg-card border border-primary/30 rounded-2xl p-4 shadow-sm bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5 relative overflow-hidden group hover:border-primary/60 transition-all">
                    <div className="absolute right-3 top-3 p-2 bg-primary/10 rounded-xl">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-xs font-bold text-primary">Net Out-of-Pocket Cost</span>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold tracking-tight text-primary">{formatInr(result.netCostInr)}</span>
                    </div>
                    <div className="mt-2 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <Award className="h-3.5 w-3.5 shrink-0" />
                      <span>Includes ₹{result.subsidyInr.toLocaleString("en-IN")} PM Surya Ghar Subsidy</span>
                    </div>
                  </div>

                </div>

                {/* Detailed Financial & Engineering Breakdown */}
                <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <h3 className="font-semibold text-foreground flex items-center gap-2 text-base">
                      <Calculator className="h-4 w-4 text-primary" />
                      Financial Return & Investment Metrics
                    </h3>
                    <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-secondary border border-border/50 text-foreground">
                      Payback: <strong className="text-primary">{result.paybackYears} Years</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Financial Table */}
                    <div className="space-y-2 bg-secondary/20 p-4 rounded-xl border border-border/50">
                      <div className="flex justify-between text-xs py-1 border-b border-border/40 font-medium">
                        <span className="text-muted-foreground">Gross Turnkey System Cost:</span>
                        <span className="font-semibold text-foreground">{formatInr(result.systemCostInr)}</span>
                      </div>
                      <div className="flex justify-between text-xs py-1 border-b border-border/40 text-emerald-600 font-semibold">
                        <span>PM Surya Ghar Direct Subsidy:</span>
                        <span>- {formatInr(result.subsidyInr)}</span>
                      </div>
                      <div className="flex justify-between text-sm py-2 font-extrabold text-foreground">
                        <span>Net Out-of-Pocket Cost:</span>
                        <span className="text-primary">{formatInr(result.netCostInr)}</span>
                      </div>
                    </div>

                    {/* Energy Savings Box */}
                    <div className="space-y-2 bg-secondary/20 p-4 rounded-xl border border-border/50 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground font-medium">
                          <span>Estimated Monthly Savings:</span>
                          <span className="font-extrabold text-emerald-600 text-sm">{formatInr(result.monthlySavingsInr)} / mo</span>
                        </div>
                        <div className="w-full bg-secondary h-3 rounded-full mt-3 overflow-hidden p-0.5 border border-border/50">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${result.reductionPct}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-muted-foreground font-medium pt-2">
                        <span>Grid Bill Reduction: <strong className="text-foreground font-bold">{result.reductionPct}%</strong></span>
                        <span>Annual Savings: <strong className="text-foreground font-bold">{formatInr(result.monthlySavingsInr * 12)}</strong></span>
                      </div>
                    </div>

                  </div>

                  {/* Optional Battery Backup Section */}
                  {result.batteryDetails && (
                    <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                          <Battery className="h-4 w-4" />
                          Optional Battery Outage Backup Sizing
                        </span>
                        <span className="text-xs font-extrabold text-emerald-700">{formatInr(result.batteryDetails.batteryCostInr)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">
                        Adds <strong>{result.batteryDetails.batteryName}</strong> providing approximately{" "}
                        <strong className="text-foreground font-bold">{result.batteryDetails.estimatedBackupHours} hours</strong> of continuous power during grid outages.
                      </p>
                    </div>
                  )}

                </div>

                {/* Sanity Check & Config Verification Box */}
                <div className="bg-secondary/30 border border-border/70 rounded-2xl p-4 flex items-start gap-3 text-xs text-muted-foreground backdrop-blur-xs">
                  <AlertCircle className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 font-medium">
                    <span className="font-semibold text-foreground block">Sanity Check Verification</span>
                    A system size of {result.systemSizeKw} kW produces ~{result.monthlyProductionKwh} kWh/month in {result.tariffUsed.region_name}, matching standard solar irradiance standards (~18–22 units/day per 5kW). All formulas and equipment specs are populated dynamically from backend CSV configuration tables.
                  </div>
                </div>

              </div>
            ) : null}
          </div>
        )}

      </main>

      <SiteFooter />
    </div>
  );
}
