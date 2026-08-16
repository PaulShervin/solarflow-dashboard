import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  ArrowDown,
  ArrowRight,
  Award,
  BadgeCheck,
  Battery,
  BatteryCharging,
  Calculator,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Cpu,
  DollarSign,
  Eye,
  Flame,
  Gift,
  Globe,
  HelpCircle,
  Home,
  Layers,
  Leaf,
  Lock,
  MessageSquare,
  MessageSquareText,
  MousePointerClick,
  Percent,
  PiggyBank,
  Play,
  Plus,
  Radio,
  RotateCcw,
  Scale,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Star,
  Sun,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  Wrench,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import heroImage from "@/assets/hero-solar-home.jpg";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SolarPeak — Save Up to 96% on Your Arizona Power Bill with Zero Down" },
      {
        name: "description",
        content:
          "Turn Arizona's 300+ days of sunshine into locked-in energy independence. Calculate your 30% Federal ITC, compare battery backup systems, and claim instant roof savings in 60 seconds.",
      },
      { property: "og:title", content: "SolarPeak — The Smarter Way to Power Your Home." },
      {
        property: "og:description",
        content:
          "Zero upfront cost, licensed Arizona installers, Tesla Powerwall 3 backup, and a 25-year production guarantee.",
      },
    ],
  }),
  component: HomePage,
});

// Neighborhood quick selectors for Arizona
const ARIZONA_CITIES = [
  { name: "Phoenix", utility: "APS / SRP", sunHours: "310 days/yr", avgBill: 320 },
  { name: "Chandler", utility: "SRP Electric", sunHours: "315 days/yr", avgBill: 340 },
  { name: "Scottsdale", utility: "APS Power", sunHours: "312 days/yr", avgBill: 380 },
  { name: "Mesa", utility: "SRP / City", sunHours: "314 days/yr", avgBill: 310 },
  { name: "Gilbert", utility: "SRP Electric", sunHours: "316 days/yr", avgBill: 350 },
];

// Interactive System Studio Packages
const PANEL_TIERS = [
  {
    id: "n-type",
    name: "Ultra-Black N-Type 430W",
    efficiency: "22.8% Peak",
    degradation: "0.25%/yr",
    badge: "Most Popular",
    desc: "Engineered specifically to maximize power during scorching 115°F+ Arizona summer afternoons.",
  },
  {
    id: "bifacial",
    name: "Maxeon 6 Premium Glass",
    efficiency: "23.4% Ultra",
    degradation: "0.20%/yr",
    badge: "Maximum Output",
    desc: "Bifacial architecture captures reflected sunlight off roof tiles for extra 8-12% daily output.",
  },
];

const BATTERY_TIERS = [
  {
    id: "none",
    name: "Grid-Tied (No Battery)",
    capacity: "0 kWh",
    backup: "Standard Net Metering",
    priceAdd: 0,
    desc: "Exports excess solar power to utility during the day and pulls grid power at night.",
  },
  {
    id: "powerwall-1",
    name: "1x Tesla Powerwall 3",
    capacity: "13.5 kWh Storage",
    backup: "Essential Home Backup (AC + Fridge)",
    priceAdd: 9800,
    desc: "Zero-flicker backup during storm outages. Powers AC through peak utility charge hours.",
  },
  {
    id: "powerwall-2",
    name: "2x Tesla Powerwall Max",
    capacity: "27.0 kWh Whole-Home",
    backup: "100% Whole-Home Independence",
    priceAdd: 18500,
    desc: "Complete energy autonomy for large homes with dual AC units and EV charging.",
  },
];

const SMART_OPTIONS = [
  {
    id: "span",
    name: "SPAN Smart AI Panel",
    benefit: "+40% Battery Duration",
    priceAdd: 3200,
    desc: "Dynamically manages household electrical circuits in real-time from your phone.",
  },
  {
    id: "ev",
    name: "Tesla Universal Level-2 EV Charger",
    benefit: "44 Miles of Range/hr",
    priceAdd: 1200,
    desc: "Direct solar-powered electric vehicle charging with universal J1772 & NACS compatibility.",
  },
];

const CASE_STUDIES = [
  {
    name: "Marcus & Elena Vance",
    city: "Chandler, AZ (SRP Grid)",
    home: "2,850 sq ft · 4 Bed with Pool",
    system: "12.4 kW System + Tesla Powerwall 3",
    beforeBill: "$385 / mo",
    afterBill: "$18 / mo",
    savedToDate: "$14,280",
    taxCredit: "$11,240 Cash Credit",
    quote:
      "Our July SRP electric bill used to hit $420 every summer. Now our net bill is just $18! The Powerwall runs our AC all night through the peak demand window without buying single kWh of dirty grid power.",
    stars: 5,
    installDays: "24 days start-to-PTO",
  },
  {
    name: "David & Rebecca Sterling",
    city: "Scottsdale, AZ (APS Grid)",
    home: "3,900 sq ft · Dual EV Charging",
    system: "16.8 kW Array + Dual Powerwalls",
    beforeBill: "$560 / mo",
    afterBill: "$24 / mo",
    savedToDate: "$22,400",
    taxCredit: "$15,400 Cash Credit",
    quote:
      "With two electric cars and monsoon power outages in Scottsdale, SolarPeak was the best home investment we've ever made. The system paid for itself faster than promised and we never lost power once.",
    stars: 5,
    installDays: "28 days start-to-PTO",
  },
  {
    name: "Sarah & Brian Jenkins",
    city: "Mesa, AZ (SRP Grid)",
    home: "2,100 sq ft · Single Story",
    system: "8.6 kW Tier-1 Ultra-Black Panels",
    beforeBill: "$270 / mo",
    afterBill: "$14 / mo",
    savedToDate: "$9,840",
    taxCredit: "$8,100 Cash Credit",
    quote:
      "Zero aggressive salespeople. The instant AI qualification scanned our roof via satellite and gave us transparent pricing within minutes. The install crew was super professional and finished in one afternoon.",
    stars: 5,
    installDays: "21 days start-to-PTO",
  },
];

function HomePage() {
  // Quick Simulator state
  const [selectedCity, setSelectedCity] = useState(ARIZONA_CITIES[1]!);
  const [monthlyBill, setMonthlyBill] = useState(340);
  const [includeBatteryInCalc, setIncludeBatteryInCalc] = useState(true);
  const [comparisonMode, setComparisonMode] = useState<"after" | "before">("after");

  // System Customizer Studio State
  const [selectedPanel, setSelectedPanel] = useState<string>("n-type");
  const [selectedBattery, setSelectedBattery] = useState<string>("powerwall-1");
  const [activeSmartAddons, setActiveSmartAddons] = useState<string[]>(["span"]);

  // Calculate synchronized financial metrics for the Live Calculator section
  const systemSizeKw = Math.max(4.4, Number((monthlyBill / 28.5).toFixed(1)));
  const panelCount = Math.ceil((systemSizeKw * 1000) / 430);
  const grossCostInCalc = Math.round(systemSizeKw * 2750 + (includeBatteryInCalc ? 9800 : 0));
  const federalTaxCreditInCalc = Math.round(grossCostInCalc * 0.30);
  const estimatedSolarPayment = Math.round(systemSizeKw * 16.2 + (includeBatteryInCalc ? 38 : 0));
  const estimatedMonthlySavings = Math.max(35, monthlyBill - estimatedSolarPayment);
  const lifetime25YrSavings = Math.round(estimatedMonthlySavings * 12 * 25 * 1.32);
  const utility25YrCumulativeExpense = Math.round(monthlyBill * 12 * 25 * 1.62);

  // Custom Studio Calculations
  const batteryObj = BATTERY_TIERS.find((b) => b.id === selectedBattery) || BATTERY_TIERS[1]!;
  const batteryCost = batteryObj.priceAdd;
  const smartAddonCost = activeSmartAddons.reduce((acc, id) => {
    const item = SMART_OPTIONS.find((s) => s.id === id);
    return acc + (item ? item.priceAdd : 0);
  }, 0);
  const studioGrossCost = Math.round(systemSizeKw * 2750 + batteryCost + smartAddonCost);
  const studioFederalTaxCredit = Math.round(studioGrossCost * 0.30);
  const studioNetCost = studioGrossCost - studioFederalTaxCredit - 1000;
  const studioMonthlyPayment = Math.round(systemSizeKw * 16.2 + (batteryObj.priceAdd > 0 ? 38 : 0));

  function toggleSmartAddon(id: string) {
    setActiveSmartAddons((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 pb-16 selection:bg-emerald-500/20 selection:text-emerald-800">
      <SiteHeader />

      {/* ========================================================================= */}
      {/* 1. HERO SECTION (Clean White Background + Solar Home Image Right)         */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-4 pb-12 sm:pt-6 sm:pb-16 lg:pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Top Incentive Floating Pill Banner */}
          <div className="flex justify-center">
            <Link
              to="/qualify"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-5 py-2 text-xs sm:text-sm font-medium shadow-xs transition-all hover:shadow-md hover:border-emerald-300"
            >
              <span className="flex items-center gap-1.5 font-bold text-emerald-600">
                <Gift className="size-4 text-emerald-600" />
                ARIZONA SOLAR INCENTIVE ACTIVE:
              </span>
              <span className="text-slate-800 font-semibold">
                Claim 30% Federal ITC + $1,000 State Rebate
              </span>
              <span className="ml-1 grid size-5 place-items-center rounded-full bg-slate-100 text-slate-700">
                <ArrowRight className="size-3" />
              </span>
            </Link>
          </div>

          {/* Main Hero Grid */}
          <div className="mt-8 grid items-center gap-10 lg:grid-cols-12 lg:gap-8">
            {/* Left Content Column */}
            <div className="space-y-6 lg:col-span-6 xl:col-span-6">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-4 py-1.5 text-xs font-semibold text-emerald-800 shadow-xs">
                <ShieldCheck className="size-4 text-emerald-600" />
                $0 Down • Fixed Monthly Payment • 25-Year Guarantee
              </div>

              {/* Main Headline */}
              <h1 className="font-display text-4xl leading-[1.06] font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Power Your <br />
                Entire Home <br />
                With <span className="text-emerald-600">The Sun.</span>
              </h1>

              {/* Subtext */}
              <p className="max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Cut your energy bills, increase your home value, and take control of your energy future with premium solar solutions.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3.5 pt-1 sm:flex-row sm:items-center">
                <Button
                  asChild
                  size="lg"
                  className="h-13 px-8 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.01] active:scale-[0.98]"
                >
                  <Link to="/qualify">
                    Get Your Free Estimate
                    <ArrowRight className="ml-2 size-5" />
                  </Link>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-13 px-7 text-base font-semibold border-slate-200 bg-white hover:bg-slate-50 text-slate-800 rounded-2xl shadow-xs"
                >
                  <a href="#calculator">
                    <Play className="mr-2 size-4 fill-slate-700 text-slate-700" />
                    See How It Works
                  </a>
                </Button>
              </div>
            </div>

            {/* Right Visual Column (Modern Home with Solar Panels) */}
            <div className="relative lg:col-span-6 xl:col-span-6">
              <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-100 shadow-xl lg:rounded-[2.5rem]">
                <img
                  src={heroImage}
                  alt="Modern luxury home with high efficiency rooftop solar panels"
                  width={1600}
                  height={1104}
                  className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-[1.02]"
                />

                {/* Subtle bottom gradient to blend */}
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
            </div>
          </div>

          {/* 4-Pillar Feature Card (Floating below the hero) */}
          <div className="mt-12 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-md sm:p-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {/* Pillar 1 */}
              <div className="flex items-start gap-4">
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <DollarSign className="size-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Save More</h4>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    Reduce or eliminate your electricity bills instantly.
                  </p>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="flex items-start gap-4">
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <Leaf className="size-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Go Green</h4>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    Clean, renewable energy for a sustainable future.
                  </p>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="flex items-start gap-4">
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="size-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">25-Year Warranty</h4>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    Industry-leading warranty for complete peace of mind.
                  </p>
                </div>
              </div>

              {/* Pillar 4 */}
              <div className="flex items-start gap-4">
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <TrendingUp className="size-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Increase Home Value</h4>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    Boost your property value with solar installation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Proof & Trust Bar */}
          <div className="mt-4 rounded-3xl border border-slate-200/70 bg-emerald-50/40 p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-6 px-2">
              {/* Homeowner avatars */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2.5 overflow-hidden">
                  <div className="inline-block size-9 rounded-full ring-2 ring-white bg-slate-300 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face" alt="Homeowner" className="size-full object-cover" />
                  </div>
                  <div className="inline-block size-9 rounded-full ring-2 ring-white bg-slate-300 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" alt="Homeowner" className="size-full object-cover" />
                  </div>
                  <div className="inline-block size-9 rounded-full ring-2 ring-white bg-slate-300 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face" alt="Homeowner" className="size-full object-cover" />
                  </div>
                  <div className="inline-block size-9 rounded-full ring-2 ring-white bg-slate-300 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face" alt="Homeowner" className="size-full object-cover" />
                  </div>
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900">Trusted by 10,000+ homeowners</p>
                  <p className="text-[11px] font-semibold text-emerald-700">Across Arizona</p>
                </div>
              </div>

              {/* Google Reviews */}
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-display font-black text-slate-900 text-sm">4.9/5</span>
                    <div className="flex text-emerald-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="size-3.5 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">Google Reviews</p>
                </div>
              </div>

              {/* BBB Rating */}
              <div className="flex items-center gap-2">
                <div className="grid size-8 place-items-center rounded-lg bg-slate-900 text-white font-bold text-xs">
                  BBB
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900">A+ Rating</p>
                  <p className="text-[11px] text-slate-500 font-medium">BBB Accredited</p>
                </div>
              </div>

              {/* Experience */}
              <div className="flex items-center gap-2">
                <div className="grid size-8 place-items-center rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs">
                  <Award className="size-4" />
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900">25+ Years</p>
                  <p className="text-[11px] text-slate-500 font-medium">Industry Experience</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. DEDICATED FULL-WIDTH SOLAR SAVINGS CALCULATOR                          */}
      {/* ========================================================================= */}
      <section id="calculator" className="section-y bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-700">
              ⚡ Real-Time Financial Simulator
            </span>
            <h2 className="font-display text-3xl font-black sm:text-4xl text-slate-900">
              Calculate Your Exact Solar Savings & Tax Credit
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Select your city and slide your monthly electric bill to calculate recommended panel sizing, tax credits, and 25-year cumulative savings.
            </p>
          </div>

          <div className="mt-12 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/60 p-6 shadow-lg sm:p-10 lg:grid lg:grid-cols-[1.2fr_1fr] lg:gap-12 lg:items-center">
            {/* Left Column of Calculator: Interactive Inputs */}
            <div className="space-y-7">
              {/* City Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Select Your Arizona City / Grid:
                </label>
                <div className="flex flex-wrap gap-2">
                  {ARIZONA_CITIES.map((city) => (
                    <button
                      key={city.name}
                      onClick={() => {
                        setSelectedCity(city);
                        setMonthlyBill(city.avgBill);
                      }}
                      className={cn(
                        "rounded-xl px-4 py-2 text-xs font-bold transition-all",
                        selectedCity.name === city.name
                          ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30"
                          : "bg-white text-slate-700 border border-slate-200 hover:text-slate-900 hover:bg-slate-100"
                      )}
                    >
                      {city.name} ({city.utility})
                    </button>
                  ))}
                </div>
              </div>

              {/* Monthly Bill Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-bold text-slate-900 block">
                      Current Monthly Electric Bill:
                    </label>
                    <span className="text-xs text-slate-500">Average monthly utility bill in {selectedCity.name}</span>
                  </div>
                  <span className="font-display text-3xl font-black text-emerald-600">
                    ${monthlyBill}
                    <span className="text-xs font-normal text-slate-500">/mo</span>
                  </span>
                </div>
                <Slider
                  value={[monthlyBill]}
                  min={100}
                  max={750}
                  step={10}
                  onValueChange={(val) => {
                    if (typeof val[0] === "number") setMonthlyBill(val[0]);
                  }}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-slate-500 font-medium">
                  <span>$100/mo (Small Home)</span>
                  <span>$340/mo (Avg AZ Home)</span>
                  <span>$750/mo (High AC / Pool)</span>
                </div>
              </div>

              {/* Battery Storage Toggle */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 transition-all shadow-xs">
                <div className="flex items-center gap-3.5">
                  <div className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <BatteryCharging className="size-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Include Tesla Powerwall 3 Battery</p>
                    <p className="text-xs text-slate-500">13.5 kWh backup · Runs AC during peak 4–7 PM rate windows</p>
                  </div>
                </div>
                <Switch
                  checked={includeBatteryInCalc}
                  onCheckedChange={setIncludeBatteryInCalc}
                  aria-label="Toggle battery backup"
                />
              </div>

              {/* Calculated System Specs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500">Recommended System</span>
                  <p className="mt-1 font-display text-2xl font-black text-slate-900">{systemSizeKw} kW</p>
                  <span className="text-xs text-slate-500">{panelCount} Tier-1 430W Panels</span>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500">30% Federal Tax Credit</span>
                  <p className="mt-1 font-display text-2xl font-black text-emerald-600">${federalTaxCreditInCalc.toLocaleString()}</p>
                  <span className="text-xs text-emerald-600 font-semibold">+ $1,000 AZ State Credit</span>
                </div>
              </div>
            </div>

            {/* Right Column of Calculator: High-Impact Financial Card */}
            <div className="mt-8 rounded-3xl border border-slate-900 bg-[#0B131E] p-6 sm:p-8 text-white shadow-2xl lg:mt-0">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
                  Projected Financial ROI
                </span>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                  Rate-Hike Protected
                </span>
              </div>

              <div className="mt-6 space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">New Fixed Solar Payment:</span>
                  <span className="font-display font-bold text-white text-base">
                    ${estimatedSolarPayment}/mo
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Immediate Monthly Savings:</span>
                  <span className="font-display font-extrabold text-emerald-400 text-base">
                    +${estimatedMonthlySavings}/mo
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">25-Yr Utility Renter Expense:</span>
                  <span className="font-mono text-rose-400 text-sm font-bold">
                    ${utility25YrCumulativeExpense.toLocaleString()}
                  </span>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <span className="text-xs font-semibold text-slate-400">
                    25-Year Cumulative Net Clean Energy Savings:
                  </span>
                  <p className="mt-1 font-display text-4xl font-black text-emerald-400">
                    ${lifetime25YrSavings.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Backed by 25-year equipment, labor, and production guarantee
                  </p>
                </div>
              </div>

              <Button asChild size="lg" className="mt-6 w-full h-12 text-sm font-bold shadow-lift bg-emerald-500 hover:bg-emerald-400 text-slate-950">
                <Link to="/qualify">
                  Lock In This Savings Estimate
                  <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE "BEFORE VS AFTER" SWITCHER                                 */}
      {/* ========================================================================= */}
      <section className="section-y border-b border-slate-200 bg-slate-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-700">
              The Math is Simple
            </span>
            <h2 className="font-display text-3xl font-black sm:text-4xl text-slate-900">
              See What Happens When You Switch to Solar
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Toggle between staying with the utility monopoly vs owning your clean power asset.
            </p>

            {/* Interactive Toggle Button */}
            <div className="inline-flex rounded-full border border-slate-200 bg-white p-1.5 shadow-sm mt-4">
              <button
                onClick={() => setComparisonMode("after")}
                className={cn(
                  "flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold transition-all",
                  comparisonMode === "after"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Sparkles className="size-4" /> With SolarPeak (After)
              </button>
              <button
                onClick={() => setComparisonMode("before")}
                className={cn(
                  "flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold transition-all",
                  comparisonMode === "before"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <TrendingUp className="size-4" /> Paying Utility Monopoly (Before)
              </button>
            </div>
          </div>

          {/* Dynamic Comparison Cards */}
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {comparisonMode === "after" ? (
              <>
                <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm">
                  <span className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <DollarSign className="size-5" />
                  </span>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-4">Monthly Electric Bill</p>
                  <p className="font-display text-3xl font-black text-emerald-600 mt-1">$14 to $18</p>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Fixed utility net meter connection fee only. All household power is supplied by your rooftop panels.
                  </p>
                </div>

                <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm">
                  <span className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <BatteryCharging className="size-5" />
                  </span>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-4">Power Outage Defense</p>
                  <p className="font-display text-3xl font-black text-emerald-600 mt-1">24/7 Autonomy</p>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Tesla Powerwall 3 seamlessly powers air conditioning, refrigeration, and medical devices through summer monsoons.
                  </p>
                </div>

                <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm">
                  <span className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <BadgeCheck className="size-5" />
                  </span>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-4">Cash Tax Credits</p>
                  <p className="font-display text-3xl font-black text-emerald-600 mt-1">${federalTaxCreditInCalc.toLocaleString()}</p>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Direct dollar-for-dollar reduction in your federal tax liability + $1,000 Arizona State credit.
                  </p>
                </div>

                <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm">
                  <span className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <Home className="size-5" />
                  </span>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-4">Home Appraisal Value</p>
                  <p className="font-display text-3xl font-black text-emerald-600 mt-1">+$42,000</p>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Owned solar systems appraise significantly higher and sell faster than non-solar comparable homes.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
                  <span className="grid size-11 place-items-center rounded-2xl bg-rose-50 text-rose-600">
                    <TrendingUp className="size-5" />
                  </span>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-4">Monthly Electric Bill</p>
                  <p className="font-display text-3xl font-black text-rose-600 mt-1">${monthlyBill}/mo</p>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Compounding 5.2% annually. In 10 years, a $340 bill becomes over $560/month for the exact same electricity.
                  </p>
                </div>

                <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
                  <span className="grid size-11 place-items-center rounded-2xl bg-rose-50 text-rose-600">
                    <AlertCircle className="size-5" />
                  </span>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-4">Grid Reliability</p>
                  <p className="font-display text-3xl font-black text-rose-600 mt-1">100% Vulnerable</p>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Summer grid brownouts and peak-demand throttling leave your home hot and powerless when you need it most.
                  </p>
                </div>

                <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
                  <span className="grid size-11 place-items-center rounded-2xl bg-rose-50 text-rose-600">
                    <Percent className="size-5" />
                  </span>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-4">Federal Incentives</p>
                  <p className="font-display text-3xl font-black text-rose-600 mt-1">$0 Kept</p>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    You receive zero tax deductions and pay 100% retail rates with utility peak-demand surcharges.
                  </p>
                </div>

                <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
                  <span className="grid size-11 place-items-center rounded-2xl bg-rose-50 text-rose-600">
                    <Flame className="size-5" />
                  </span>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-4">25-Year Wealth Lost</p>
                  <p className="font-display text-3xl font-black text-rose-600 mt-1">${utility25YrCumulativeExpense.toLocaleString()}</p>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Total non-recoverable expense sent to utility shareholders with zero equity or ownership return.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. "BUILD YOUR CUSTOM SYSTEM" STUDIO                                      */}
      {/* ========================================================================= */}
      <section className="section-y border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-700">
              Custom System Builder
            </span>
            <h2 className="font-display text-3xl font-black sm:text-4xl text-slate-900">
              Build Your Custom Solar & Storage System
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Customize your hardware configuration and see your live investment, monthly payment, and federal tax credit in real-time.
            </p>
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-[1.3fr_0.9fr] items-start">
            {/* Left: Configuration Steps */}
            <div className="space-y-8">
              {/* Step 1: Panels */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wider text-emerald-700 uppercase flex items-center gap-1.5">
                    <Sun className="size-4" /> Step 1: Select Solar Panel Package
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {PANEL_TIERS.map((tier) => (
                    <div
                      key={tier.id}
                      onClick={() => setSelectedPanel(tier.id)}
                      className={cn(
                        "cursor-pointer rounded-2xl border p-4 transition-all duration-200 bg-white",
                        selectedPanel === tier.id
                          ? "border-emerald-600 ring-2 ring-emerald-600/20 shadow-md bg-emerald-50/20"
                          : "border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{tier.name}</span>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          {tier.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">{tier.desc}</p>
                      <div className="mt-3 flex justify-between border-t border-slate-100 pt-2 text-[11px]">
                        <span className="text-slate-500">Efficiency:</span>
                        <span className="font-semibold text-slate-900">{tier.efficiency}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 2: Battery */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wider text-emerald-700 uppercase flex items-center gap-1.5">
                    <BatteryCharging className="size-4" /> Step 2: Choose Energy Storage & Backup
                  </span>
                </div>
                <div className="space-y-2.5">
                  {BATTERY_TIERS.map((tier) => (
                    <div
                      key={tier.id}
                      onClick={() => setSelectedBattery(tier.id)}
                      className={cn(
                        "cursor-pointer rounded-2xl border p-4 transition-all duration-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white",
                        selectedBattery === tier.id
                          ? "border-emerald-600 ring-2 ring-emerald-600/20 shadow-md bg-emerald-50/20"
                          : "border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{tier.name}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            {tier.capacity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{tier.desc}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-display text-sm font-bold text-slate-900 block">
                          {tier.priceAdd === 0 ? "Included" : `+$${tier.priceAdd.toLocaleString()}`}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold">{tier.backup}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 3: Smart Add-ons */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wider text-emerald-700 uppercase flex items-center gap-1.5">
                    <Cpu className="size-4" /> Step 3: Optional Smart Grid Add-ons
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {SMART_OPTIONS.map((opt) => {
                    const isActive = activeSmartAddons.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        onClick={() => toggleSmartAddon(opt.id)}
                        className={cn(
                          "cursor-pointer rounded-2xl border p-4 transition-all duration-200 bg-white",
                          isActive
                            ? "border-emerald-600 ring-2 ring-emerald-600/20 shadow-md bg-emerald-50/20"
                            : "border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-900">{opt.name}</span>
                          <span className="font-mono text-xs font-bold text-emerald-700">+${opt.priceAdd}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5">{opt.desc}</p>
                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                          <span className="text-emerald-700 font-semibold">{opt.benefit}</span>
                          <span className={cn("text-xs font-bold", isActive ? "text-emerald-700" : "text-slate-400")}>
                            {isActive ? "✓ Added" : "+ Add"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Live Financial Summary Box */}
            <div className="rounded-3xl border border-slate-900 bg-[#0B131E] p-6 sm:p-8 text-white shadow-2xl sticky top-24">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
                  Custom System Estimate
                </span>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                  Tier-1 Hardware Guaranteed
                </span>
              </div>

              <div className="mt-6 space-y-4 text-xs">
                <div className="flex justify-between pb-2 border-b border-white/10">
                  <span className="text-slate-300">System Capacity:</span>
                  <span className="font-bold text-white text-sm">{systemSizeKw} kW ({panelCount} Panels)</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-white/10">
                  <span className="text-slate-300">Battery Storage:</span>
                  <span className="font-bold text-white text-sm">{batteryObj.name}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-white/10">
                  <span className="text-slate-300">Gross Equipment & Labor:</span>
                  <span className="font-mono text-white text-sm">${studioGrossCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-white/10">
                  <span className="text-emerald-400 font-semibold">30% Federal ITC Tax Credit:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">-${studioFederalTaxCredit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-white/10">
                  <span className="text-emerald-400 font-semibold">Arizona State Solar Credit:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">-$1,000</span>
                </div>
                <div className="flex justify-between pb-3 border-b border-white/15">
                  <span className="font-bold text-white text-sm">Net System Investment:</span>
                  <span className="font-display font-black text-white text-base">${studioNetCost.toLocaleString()}</span>
                </div>

                <div className="rounded-2xl bg-emerald-500/15 border border-emerald-500/30 p-4 space-y-1 text-center">
                  <span className="text-[11px] text-slate-300 font-medium">Estimated Monthly Solar Payment:</span>
                  <p className="font-display text-3xl font-black text-emerald-400">${studioMonthlyPayment}/mo</p>
                  <p className="text-[10px] text-teal-300 font-semibold">Saves you ~${estimatedMonthlySavings}/month from day one</p>
                </div>
              </div>

              <Button asChild size="lg" className="mt-6 w-full h-12 text-sm font-bold shadow-lift bg-emerald-500 hover:bg-emerald-400 text-slate-950">
                <Link to="/qualify">
                  Lock In This Custom Build Quote
                  <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. VERIFIED CUSTOMER PROOF & CASE STUDIES                                 */}
      {/* ========================================================================= */}
      <section className="section-y border-b border-slate-200 bg-slate-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-700">
                Real Arizona Homeowners
              </span>
              <h2 className="mt-3 font-display text-3xl font-black sm:text-4xl text-slate-900">
                Verified Before & After Transformations
              </h2>
            </div>
            <div className="flex items-center gap-1.5 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-5 fill-current" />
              ))}
              <span className="text-sm font-bold text-slate-900 ml-2">4.9 / 5 (1,240+ Verified Reviews)</span>
            </div>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {CASE_STUDIES.map((c) => (
              <div key={c.name} className="rounded-3xl border border-slate-200 bg-white p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-bold text-base text-slate-900">{c.name}</h4>
                      <p className="text-xs text-slate-500">{c.city}</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      Verified Install
                    </span>
                  </div>

                  {/* Before / After Metrics Row */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3">
                      <span className="text-[10px] text-slate-500 block">Previous Utility Bill:</span>
                      <p className="font-display font-black text-rose-700 text-lg">{c.beforeBill}</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                      <span className="text-[10px] text-slate-500 block">New Solar Bill:</span>
                      <p className="font-display font-black text-emerald-700 text-lg">{c.afterBill}</p>
                    </div>
                  </div>

                  <blockquote className="text-xs leading-relaxed text-slate-700 italic bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    “{c.quote}”
                  </blockquote>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-3 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">{c.system}</span>
                  <span className="font-bold text-emerald-700">{c.taxCredit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. 3-STEP SIMPLE INSTALLATION PATH                                        */}
      {/* ========================================================================= */}
      <section className="section-y border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-700">
              Fast & Transparent Process
            </span>
            <h2 className="font-display text-3xl font-black sm:text-4xl text-slate-900">
              Three Simple Steps to Power Independence
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              No pushy door-to-door salesmen. Sized accurately via satellite and installed in 30 days.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                icon: MessageSquareText,
                title: "60-Second Instant AI Estimate",
                desc: "Answer 5 fast questions on your home and bill. Our AI scans satellite roof irradiance to size your optimal solar array in under a minute.",
              },
              {
                step: "02",
                icon: ClipboardList,
                title: "Custom Engineering Pre-Design",
                desc: "Our structural and electrical engineers prepare custom CAD blueprints, single-line schematics, and handle 100% of municipal city permitting.",
              },
              {
                step: "03",
                icon: Wrench,
                title: "1-Day Installation & PTO Switch-On",
                desc: "Licensed in-house Arizona crews mount Tier-1 panels, commission your Tesla Powerwall, pass city inspection, and activate utility net metering.",
              },
            ].map((s) => (
              <div key={s.step} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6 sm:p-8 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xl font-black text-emerald-600">{s.step}</span>
                  <span className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <s.icon className="size-6" />
                  </span>
                </div>
                <h3 className="font-bold text-lg text-slate-900">{s.title}</h3>
                <p className="text-xs leading-relaxed text-slate-600">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button asChild size="lg" className="h-12 px-8 font-bold shadow-md bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl">
              <Link to="/qualify">
                Start Step 1: Instant 60s Estimate
                <ArrowRight className="ml-1.5 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FREQUENTLY ASKED QUESTIONS                                            */}
      {/* ========================================================================= */}
      <section className="section-y border-b border-slate-200 bg-slate-50/50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-700">
              Arizona Solar FAQs
            </span>
            <h2 className="font-display text-3xl font-black sm:text-4xl text-slate-900">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-600 text-sm">
              Everything you need to know about Arizona solar rights, incentives, warranties, and installation.
            </p>
          </div>

          <div className="mt-10">
            <Accordion type="single" collapsible className="w-full space-y-3">
              <AccordionItem value="itc" className="rounded-2xl border border-slate-200 bg-white px-5 shadow-xs">
                <AccordionTrigger className="text-sm font-bold text-slate-900 hover:no-underline">
                  How does the 30% Federal Solar Tax Credit work?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-slate-600 leading-relaxed pt-1">
                  Under the Federal Inflation Reduction Act (Section 25D), homeowners who purchase solar or battery storage qualify for a 30% tax credit applied directly against their federal income tax liability. Plus, Arizona provides an additional $1,000 State Solar Tax Credit.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="hoa" className="rounded-2xl border border-slate-200 bg-white px-5 shadow-xs">
                <AccordionTrigger className="text-sm font-bold text-slate-900 hover:no-underline">
                  Can my Arizona HOA legally stop me from installing solar?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-slate-600 leading-relaxed pt-1">
                  No. Under Arizona Revised Statutes (A.R.S. § 33-1816), Homeowners Associations cannot effectively restrict or prohibit homeowners from installing solar energy devices on their property.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="battery" className="rounded-2xl border border-slate-200 bg-white px-5 shadow-xs">
                <AccordionTrigger className="text-sm font-bold text-slate-900 hover:no-underline">
                  Why is Tesla Powerwall 3 recommended for APS & SRP customers?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-slate-600 leading-relaxed pt-1">
                  Arizona utilities enforce expensive Time-of-Use peak charges during late afternoon and evening hours (4 PM–7 PM). A battery stores daytime solar power to run your AC at night, completely shielding you from high on-peak rates and summer monsoon outages.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="warranty" className="rounded-2xl border border-slate-200 bg-white px-5 shadow-xs">
                <AccordionTrigger className="text-sm font-bold text-slate-900 hover:no-underline">
                  What is included in the 25-Year Production & Roof Warranty?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-slate-600 leading-relaxed pt-1">
                  Our comprehensive warranty covers solar panel power output (guaranteed at &ge;92% capacity after 25 years), microinverter replacement, roof penetration watertight seal integrity, and live 24/7 mobile app performance monitoring.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. HIGH-CONVERTING CLOSING HERO BANNER                                    */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 pt-16 pb-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-slate-900 bg-[#0B131E] px-6 py-14 text-center text-white shadow-2xl sm:px-12">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-400">
            <Zap className="size-6" />
          </div>
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-black text-white sm:text-4xl">
            See Exactly What Your Roof Can Generate
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-300">
            Answer 5 fast questions with our 24/7 AI Solar Assistant. Get a custom satellite roof pre-design quote with 30% Federal ITC calculations in under 60 seconds.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-13 px-8 text-sm font-bold shadow-lift bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl">
              <Link to="/qualify">
                Launch Instant AI Roof Estimate
                <ArrowRight className="ml-1.5 size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-13 border-white/20 bg-slate-900/60 px-8 text-sm text-white hover:bg-slate-800 font-semibold rounded-2xl"
            >
              <Link to="/portal">
                <CalendarCheck className="mr-1.5 size-4" />
                Track Existing Installation
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
