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
import { formatINR } from "@/lib/formatCurrency";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SolarFlow — Save Up to 90% on Your Electricity Bill with Zero Down" },
      {
        name: "description",
        content:
          "Harness India's 300+ days of abundant sunshine. Calculate your PM Surya Ghar central subsidy, compare solar storage, and claim instant rooftop savings in 60 seconds.",
      },
      { property: "og:title", content: "SolarFlow — The Smarter Way to Power Your Home." },
      {
        property: "og:description",
        content:
          "Zero upfront cost, certified installers, Lithium battery backup, and a 25-year production guarantee.",
      },
    ],
  }),
  component: HomePage,
});

// Neighborhood quick selectors for India
const INDIAN_CITIES = [
  { name: "New Delhi", utility: "Tata Power / BSES", sunHours: "310 days/yr", avgBill: 4500 },
  { name: "Mumbai", utility: "Adani / MSEDCL", sunHours: "315 days/yr", avgBill: 5200 },
  { name: "Bengaluru", utility: "BESCOM Electric", sunHours: "312 days/yr", avgBill: 4200 },
  { name: "Hyderabad", utility: "TSSPDCL Power", sunHours: "314 days/yr", avgBill: 4800 },
  { name: "Chennai", utility: "TANGEDCO Grid", sunHours: "316 days/yr", avgBill: 4600 },
];

// Interactive System Studio Packages
const PANEL_TIERS = [
  {
    id: "n-type",
    name: "Ultra-Black N-Type 430W",
    efficiency: "22.8% Peak",
    degradation: "0.25%/yr",
    badge: "Most Popular",
    desc: "Engineered specifically to maximize power during high-temperature 45°C+ summer afternoons.",
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
    desc: "Exports excess solar power to grid via bidirectional net meter and pulls power at night.",
  },
  {
    id: "powerwall-1",
    name: "1x Lithium LFP 10 kWh Unit",
    capacity: "10.0 kWh Storage",
    backup: "Essential Home Backup (AC + Lights + Refrigerator)",
    priceAdd: 180000,
    desc: "Zero-flicker power during grid load shedding. Seamlessly powers heavy loads through night.",
  },
  {
    id: "powerwall-2",
    name: "2x Lithium LFP 20 kWh Max",
    capacity: "20.0 kWh Whole-Home",
    backup: "100% Whole-Home Independence",
    priceAdd: 340000,
    desc: "Complete energy autonomy for large villas with multiple ACs and EV fast charging.",
  },
];

const SMART_OPTIONS = [
  {
    id: "span",
    name: "Smart AI Distribution Panel",
    benefit: "+40% Battery Duration",
    priceAdd: 45000,
    desc: "Dynamically manages household electrical circuits in real-time from your smartphone.",
  },
  {
    id: "ev",
    name: "Universal Level-2 Fast EV Charger",
    benefit: "45 km Range / hr",
    priceAdd: 35000,
    desc: "Direct solar-powered electric vehicle charging with universal Type 2 compatibility.",
  },
];

const CASE_STUDIES = [
  {
    name: "Rajesh & Priya Sharma",
    city: "Mumbai (MSEDCL Grid)",
    home: "2,400 sq ft · 3 BHK Villa",
    system: "5.2 kW System + 10 kWh Battery",
    beforeBill: "₹8,500 / mo",
    afterBill: "₹450 / mo",
    savedToDate: "₹3,20,000",
    taxCredit: "₹78,000 Subsidy Received",
    quote:
      "Our monthly electricity bill used to hit ₹9,000 every summer. Now our net bill is just ₹450! The battery runs our AC through night power cuts without buying grid units.",
    stars: 5,
    installDays: "18 days start-to-grid",
  },
  {
    name: "Vikram & Ananya Patel",
    city: "Bengaluru (BESCOM Grid)",
    home: "3,200 sq ft · Dual EV Charging",
    system: "8.4 kW Array + 20 kWh Storage",
    beforeBill: "₹12,400 / mo",
    afterBill: "₹650 / mo",
    savedToDate: "₹4,80,000",
    taxCredit: "₹78,000 Subsidy Received",
    quote:
      "With two electric cars and heavy home usage, SolarFlow was the best investment we've ever made. The system paid for itself faster than promised and we never lost power once.",
    stars: 5,
    installDays: "21 days start-to-grid",
  },
  {
    name: "Suresh & Meena Iyer",
    city: "Chennai (TANGEDCO Grid)",
    home: "1,900 sq ft · Independent House",
    system: "4.2 kW Tier-1 Mono Perc",
    beforeBill: "₹6,200 / mo",
    afterBill: "₹320 / mo",
    savedToDate: "₹2,40,000",
    taxCredit: "₹78,000 Subsidy Received",
    quote:
      "Zero aggressive salespeople. The instant AI qualification scanned our roof via satellite and gave us transparent pricing within minutes. The install crew was super professional.",
    stars: 5,
    installDays: "15 days start-to-grid",
  },
];

function HomePage() {
  // Quick Simulator state
  const [selectedCity, setSelectedCity] = useState(INDIAN_CITIES[1]!);
  const [monthlyBill, setMonthlyBill] = useState(5200);
  const [includeBatteryInCalc, setIncludeBatteryInCalc] = useState(true);
  const [comparisonMode, setComparisonMode] = useState<"after" | "before">("after");

  // System Customizer Studio State
  const [selectedPanel, setSelectedPanel] = useState<string>("n-type");
  const [selectedBattery, setSelectedBattery] = useState<string>("powerwall-1");
  const [activeSmartAddons, setActiveSmartAddons] = useState<string[]>(["span"]);

  // Calculate synchronized financial metrics for the Live Calculator section
  const systemSizeKw = Math.max(3.0, Number((monthlyBill / 950).toFixed(1)));
  const panelCount = Math.ceil((systemSizeKw * 1000) / 430);
  const grossCostInCalc = Math.round(systemSizeKw * 55000 + (includeBatteryInCalc ? 180000 : 0));
  const subsidyInCalc = Math.round(Math.min(78000, grossCostInCalc * 0.30));
  const estimatedSolarPayment = Math.round(systemSizeKw * 450 + (includeBatteryInCalc ? 900 : 0));
  const estimatedMonthlySavings = Math.max(500, monthlyBill - estimatedSolarPayment);
  const lifetime25YrSavings = Math.round(estimatedMonthlySavings * 12 * 25 * 1.32);
  const utility25YrCumulativeExpense = Math.round(monthlyBill * 12 * 25 * 1.62);

  // Custom Studio Calculations
  const batteryObj = BATTERY_TIERS.find((b) => b.id === selectedBattery) || BATTERY_TIERS[1]!;
  const batteryCost = batteryObj.priceAdd;
  const smartAddonCost = activeSmartAddons.reduce((acc, id) => {
    const item = SMART_OPTIONS.find((s) => s.id === id);
    return acc + (item ? item.priceAdd : 0);
  }, 0);
  const studioGrossCost = Math.round(systemSizeKw * 55000 + batteryCost + smartAddonCost);
  const studioSubsidy = Math.round(Math.min(78000, studioGrossCost * 0.30));
  const studioNetCost = studioGrossCost - studioSubsidy;
  const studioMonthlyPayment = Math.round(systemSizeKw * 450 + (batteryObj.priceAdd > 0 ? 900 : 0));

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
                CENTRAL SOLAR SUBSIDY ACTIVE:
              </span>
              <span className="text-slate-800 font-semibold">
                Claim PM Surya Ghar Subsidy (up to ₹78,000 Direct Benefit)
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
                ₹0 Down • Fixed Monthly EMI • 25-Year Guarantee
              </div>

              {/* Main Headline */}
              <h1 className="font-display text-4xl leading-[1.06] font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Power Your <br />
                Entire Home <br />
                With <span className="text-emerald-600">The Sun.</span>
              </h1>

              {/* Subtext */}
              <p className="max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Cut your electricity bills, increase your property value, and take control of your energy future with rooftop solar solutions.
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
                  <p className="text-[11px] font-semibold text-emerald-700">Across India</p>
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

              {/* Experience */}
              <div className="flex items-center gap-2">
                <div className="grid size-8 place-items-center rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs">
                  <Award className="size-4" />
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900">MNRE Approved</p>
                  <p className="text-[11px] text-slate-500 font-medium">National Portal Registered</p>
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
              ⚡ Real-Time Financial Simulator (INR)
            </span>
            <h2 className="font-display text-3xl font-black sm:text-4xl text-slate-900">
              Calculate Your Solar Savings & PM Surya Ghar Subsidy
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Select your city and slide your monthly electric bill to calculate recommended system size, direct central government subsidy, and 25-year cumulative savings.
            </p>
          </div>

          <div className="mt-12 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/60 p-6 shadow-lg sm:p-10 lg:grid lg:grid-cols-[1.2fr_1fr] lg:gap-12 lg:items-center">
            {/* Left Column of Calculator: Interactive Inputs */}
            <div className="space-y-7">
              {/* City Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Select Your City / DISCOM Grid:
                </label>
                <div className="flex flex-wrap gap-2">
                  {INDIAN_CITIES.map((city) => (
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
                    {formatINR(monthlyBill)}
                    <span className="text-xs font-normal text-slate-500">/mo</span>
                  </span>
                </div>
                <Slider
                  value={[monthlyBill]}
                  min={1000}
                  max={25000}
                  step={250}
                  onValueChange={(val) => {
                    if (typeof val[0] === "number") setMonthlyBill(val[0]);
                  }}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-slate-500 font-medium">
                  <span>₹1,000/mo (Small Flat)</span>
                  <span>₹5,200/mo (Avg Home)</span>
                  <span>₹25,000/mo (Villa / ACs)</span>
                </div>
              </div>

              {/* Battery Storage Toggle */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 transition-all shadow-xs">
                <div className="flex items-center gap-3.5">
                  <div className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <BatteryCharging className="size-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Include Lithium LFP Battery Backup</p>
                    <p className="text-xs text-slate-500">10 kWh storage · Uninterrupted power during DISCOM outages</p>
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
                  <span className="text-xs text-slate-500">{panelCount} Tier-1 Mono Perc Panels</span>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500">PM Surya Ghar Subsidy</span>
                  <p className="mt-1 font-display text-2xl font-black text-emerald-600">{formatINR(subsidyInCalc)}</p>
                  <span className="text-xs text-emerald-600 font-semibold">Direct DBT to Bank Account</span>
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
                  Tariff-Hike Protected
                </span>
              </div>

              <div className="mt-6 space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">New Fixed Solar EMI:</span>
                  <span className="font-display font-bold text-white text-base">
                    {formatINR(estimatedSolarPayment)}/mo
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Immediate Monthly Savings:</span>
                  <span className="font-display font-extrabold text-emerald-400 text-base">
                    +{formatINR(estimatedMonthlySavings)}/mo
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">25-Yr DISCOM Grid Expense:</span>
                  <span className="font-mono text-rose-400 text-sm font-bold">
                    {formatINR(utility25YrCumulativeExpense)}
                  </span>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <span className="text-xs font-semibold text-slate-400">
                    25-Year Cumulative Net Clean Energy Savings:
                  </span>
                  <p className="mt-1 font-display text-4xl font-black text-emerald-400">
                    {formatINR(lifetime25YrSavings)}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Backed by 25-year equipment, inverter, and generation guarantee
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
                  <p className="font-display text-3xl font-black text-emerald-600 mt-1">₹350 to ₹650</p>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Fixed DISCOM net meter connection charges only. All household daytime & nighttime power supplied by your rooftop panels.
                  </p>
                </div>

                <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm">
                  <span className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <BatteryCharging className="size-5" />
                  </span>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-4">Power Cut Defense</p>
                  <p className="font-display text-3xl font-black text-emerald-600 mt-1">24/7 Autonomy</p>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Lithium LFP Battery seamlessly powers heavy loads (ACs, lights, refrigerator) during load shedding and summer storms.
                  </p>
                </div>

                <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm">
                  <span className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <BadgeCheck className="size-5" />
                  </span>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-4">Government Subsidy</p>
                  <p className="font-display text-3xl font-black text-emerald-600 mt-1">{formatINR(subsidyInCalc)}</p>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    PM Surya Ghar Muft Bijli Yojana direct subsidy deposited into your linked bank account.
                  </p>
                </div>

                <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm">
                  <span className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <Home className="size-5" />
                  </span>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-4">Property Value Added</p>
                  <p className="font-display text-3xl font-black text-emerald-600 mt-1">+₹3,50,000</p>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Homes with registered rooftop solar assets appraise higher and offer zero electricity liability for future buyers.
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
                  <p className="font-display text-3xl font-black text-rose-600 mt-1">{formatINR(monthlyBill)}/mo</p>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Compounding 6.5% annually. In 10 years, a ₹5,000 bill becomes over ₹9,500/month for the exact same power.
                  </p>
                </div>

                <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
                  <span className="grid size-11 place-items-center rounded-2xl bg-rose-50 text-rose-600">
                    <AlertCircle className="size-5" />
                  </span>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-4">Grid Reliability</p>
                  <p className="font-display text-3xl font-black text-rose-600 mt-1">100% Vulnerable</p>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Summer grid brownouts and peak load shedding leave your home hot and powerless when you need it most.
                  </p>
                </div>

                <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
                  <span className="grid size-11 place-items-center rounded-2xl bg-rose-50 text-rose-600">
                    <Percent className="size-5" />
                  </span>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-4">Government Subsidy</p>
                  <p className="font-display text-3xl font-black text-rose-600 mt-1">₹0 Claimed</p>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    You miss out on ₹78,000 national clean energy subsidies and pay 100% DISCOM peak tariff surcharges.
                  </p>
                </div>

                <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
                  <span className="grid size-11 place-items-center rounded-2xl bg-rose-50 text-rose-600">
                    <Flame className="size-5" />
                  </span>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-4">25-Year Wealth Lost</p>
                  <p className="font-display text-3xl font-black text-rose-600 mt-1">{formatINR(utility25YrCumulativeExpense)}</p>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Total non-recoverable expense sent to utility power companies with zero equity or ownership return.
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
              Custom System Builder (INR)
            </span>
            <h2 className="font-display text-3xl font-black sm:text-4xl text-slate-900">
              Build Your Custom Solar & Storage System
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Customize your hardware configuration and see your live investment, monthly EMI, and PM Surya Ghar subsidy in real-time.
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
                          {tier.priceAdd === 0 ? "Included" : `+${formatINR(tier.priceAdd)}`}
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
                          <span className="font-mono text-xs font-bold text-emerald-700">+{formatINR(opt.priceAdd)}</span>
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
                  <span className="font-mono text-white text-sm">{formatINR(studioGrossCost)}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-white/10">
                  <span className="text-emerald-400 font-semibold">PM Surya Ghar Subsidy:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">-{formatINR(studioSubsidy)}</span>
                </div>
                <div className="flex justify-between pb-3 border-b border-white/15">
                  <span className="font-bold text-white text-sm">Net System Investment:</span>
                  <span className="font-display font-black text-white text-base">{formatINR(studioNetCost)}</span>
                </div>

                <div className="rounded-2xl bg-emerald-500/15 border border-emerald-500/30 p-4 space-y-1 text-center">
                  <span className="text-[11px] text-slate-300 font-medium">Estimated Monthly Solar EMI:</span>
                  <p className="font-display text-3xl font-black text-emerald-400">{formatINR(studioMonthlyPayment)}/mo</p>
                  <p className="text-[10px] text-teal-300 font-semibold">Saves you ~{formatINR(estimatedMonthlySavings)}/month from day one</p>
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
              India Solar FAQs
            </span>
            <h2 className="font-display text-3xl font-black sm:text-4xl text-slate-900">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-600 text-sm">
              Everything you need to know about PM Surya Ghar subsidies, DISCOM net metering, warranties, and rooftop installation.
            </p>
          </div>

          <div className="mt-10">
            <Accordion type="single" collapsible className="w-full space-y-3">
              <AccordionItem value="itc" className="rounded-2xl border border-slate-200 bg-white px-5 shadow-xs">
                <AccordionTrigger className="text-sm font-bold text-slate-900 hover:no-underline">
                  How does the PM Surya Ghar: Muft Bijli Yojana subsidy work?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-slate-600 leading-relaxed pt-1">
                  Under the Central Government PM Surya Ghar scheme, residential consumers receive direct DBT subsidies into their bank account: ₹30,000 for 1 kW, ₹60,000 for 2 kW, and up to ₹78,000 for 3 kW and higher systems. We handle 100% of the National Portal documentation and DISCOM approvals for you.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="hoa" className="rounded-2xl border border-slate-200 bg-white px-5 shadow-xs">
                <AccordionTrigger className="text-sm font-bold text-slate-900 hover:no-underline">
                  How does bidirectional net metering work with my DISCOM?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-slate-600 leading-relaxed pt-1">
                  A bi-directional net meter installed by your local electricity board (e.g., Tata Power, BESCOM, MSEDCL, TSSPDCL) measures power sent to the grid during the day and consumed at night. Surplus units generated roll over to offset your monthly bill.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="battery" className="rounded-2xl border border-slate-200 bg-white px-5 shadow-xs">
                <AccordionTrigger className="text-sm font-bold text-slate-900 hover:no-underline">
                  Why is Lithium LFP battery storage recommended?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-slate-600 leading-relaxed pt-1">
                  A dedicated Lithium battery stores surplus solar energy during sunny daytime hours to run heavy home appliances (like air conditioners, fans, and refrigeration) during grid outages and peak night hours, providing 24/7 power independence.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="warranty" className="rounded-2xl border border-slate-200 bg-white px-5 shadow-xs">
                <AccordionTrigger className="text-sm font-bold text-slate-900 hover:no-underline">
                  What is included in the 25-Year Production & Performance Warranty?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-slate-600 leading-relaxed pt-1">
                  Our comprehensive warranty covers Tier-1 solar panel linear power output (guaranteed &ge;92% generation after 25 years), on-grid inverter replacement, waterproof rooftop mounting integrity, and real-time mobile app IoT performance monitoring.
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
            Answer 5 fast questions with our 24/7 AI Solar Assistant. Get a custom satellite rooftop pre-design quote with PM Surya Ghar subsidy calculations in under 60 seconds.
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
