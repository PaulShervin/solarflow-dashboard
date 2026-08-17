import React, { useState } from "react";
import { MapPin, Sliders, Battery, IndianRupee } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "@tanstack/react-router";

// Dynamically import UnifiedPropertyMap to prevent SSR leaflet errors
const UnifiedPropertyMap = React.lazy(() => 
  import("@/components/common/UnifiedPropertyMap").then((mod) => ({ default: mod.UnifiedPropertyMap }))
);

interface CustomerRooftopParamsProps {
  onClose?: () => void;
}

export function CustomerRooftopParams({ onClose }: CustomerRooftopParamsProps) {
  const navigate = useNavigate();

  // State
  const [customerName, setCustomerName] = useState("");
  const [regionId, setRegionId] = useState("MH");
  
  // Rooftop mode
  const [roofMode, setRoofMode] = useState<"dimensions" | "area" | "map">("map");
  const [lengthM, setLengthM] = useState(10);
  const [widthM, setWidthM] = useState(6);
  const [roofAreaM2, setRoofAreaM2] = useState(60);
  
  // Bill mode
  const [billMode, setBillMode] = useState<"bill" | "units">("bill");
  const [monthlyBill, setMonthlyBill] = useState(4500);
  const [monthlyUnits, setMonthlyUnits] = useState(450);

  // Hardware
  const [panelId, setPanelId] = useState("PN01");
  const [costTier, setCostTier] = useState<"low" | "default" | "high">("default");
  const [addBattery, setAddBattery] = useState(false);
  const [batteryId, setBatteryId] = useState("BT02");
  const [batteryCapacity, setBatteryCapacity] = useState(5);

  const handleViewAnalysis = () => {
    // Collect all data
    const payload = {
      customerName,
      regionId,
      roofMode,
      lengthM,
      widthM,
      roofAreaM2,
      billMode,
      monthlyBill,
      monthlyUnits,
      panelId,
      costTier,
      addBattery,
      batteryId,
      batteryCapacity
    };

    // Save to sessionStorage to pass to the next page
    sessionStorage.setItem("customerAnalysisParams", JSON.stringify(payload));
    
    if (onClose) onClose();
    
    navigate({ to: "/view-analysis" });
  };

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-5 h-full max-h-[85vh] overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <h2 className="font-semibold text-foreground flex items-center gap-2 text-base">
          <Sliders className="h-4 w-4 text-primary" />
          Rooftop & Energy Parameters
        </h2>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          CSV Config Synced
        </span>
      </div>

      {/* Location Details */}
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground">State / Region Tariff</label>
          <select
            value={regionId}
            onChange={(e) => setRegionId(e.target.value)}
            className="mt-1 flex h-9 w-full rounded-xl border border-border/70 bg-secondary/30 px-3 py-1 text-xs font-medium shadow-xs focus-visible:outline-none focus:bg-background"
          >
            <option value="MH">Maharashtra (₹9.5/unit)</option>
            <option value="KA">Karnataka (₹8.8/unit)</option>
            <option value="DL">Delhi (₹8.0/unit)</option>
            <option value="IN_DEF">National Average (₹8.5/unit)</option>
          </select>
        </div>
      </div>

      {/* Rooftop Capture Mode Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground flex justify-between">
          <span>Rooftop Capture Mode</span>
        </label>
        <div className="grid grid-cols-3 gap-1.5 bg-secondary/50 p-1.5 rounded-xl border border-border/50">
          <button
            type="button"
            onClick={() => setRoofMode("dimensions")}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              roofMode === "dimensions"
                ? "bg-background text-foreground shadow-sm border border-border/40"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Length × Width
          </button>
          <button
            type="button"
            onClick={() => setRoofMode("area")}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              roofMode === "area"
                ? "bg-background text-foreground shadow-sm border border-border/40"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Total Area (m²)
          </button>
          <button
            type="button"
            onClick={() => setRoofMode("map")}
            className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              roofMode === "map"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Satellite Map</span>
            <span className="sm:hidden">Map</span>
          </button>
        </div>
      </div>

      {/* Dynamic Roof Inputs */}
      {roofMode === "dimensions" && (
        <div className="grid grid-cols-2 gap-3 bg-secondary/20 p-3.5 rounded-xl border border-border/50">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Roof Length (Meters)</label>
            <Input
              type="number"
              value={lengthM}
              onChange={(e) => setLengthM(Number(e.target.value))}
              className="mt-1 h-9 text-xs rounded-lg"
              min={1}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Roof Width (Meters)</label>
            <Input
              type="number"
              value={widthM}
              onChange={(e) => setWidthM(Number(e.target.value))}
              className="mt-1 h-9 text-xs rounded-lg"
              min={1}
            />
          </div>
          <div className="col-span-2 text-right text-[11px] text-muted-foreground font-medium">
            Total Footprint: <span className="font-bold text-foreground">{lengthM * widthM} m²</span> ({Math.round(lengthM * widthM * 10.764)} sq.ft)
          </div>
        </div>
      )}

      {roofMode === "area" && (
        <div className="bg-secondary/20 p-3.5 rounded-xl border border-border/50">
          <label className="text-xs font-medium text-muted-foreground">Usable Roof Area (m²)</label>
          <Input
            type="number"
            value={roofAreaM2}
            onChange={(e) => setRoofAreaM2(Number(e.target.value))}
            className="mt-1 h-9 text-xs rounded-lg"
            min={5}
          />
          <div className="mt-1 text-right text-[11px] text-muted-foreground font-medium">
            Equivalent to <span className="font-bold text-foreground">{Math.round(roofAreaM2 * 10.764)} sq.ft</span>
          </div>
        </div>
      )}

      {/* Enhanced Satellite Map Window */}
      {roofMode === "map" && (
        <div className="space-y-2">
          <React.Suspense fallback={<div className="h-[300px] flex items-center justify-center bg-slate-900 text-muted-foreground rounded-lg">Loading Map Engine...</div>}>
            <UnifiedPropertyMap
              initialCenter={{ lat: 19.076, lng: 72.8777 }}
              onPropertyConfirmed={(data) => {
                const area = data.buildingFootprint.properties.areaM2 || 68.5;
                setRoofAreaM2(area);
              }}
            />
          </React.Suspense>
        </div>
      )}

      {/* Bill & Consumption Input */}
      <div className="space-y-2 pt-2 border-t border-border/60">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-muted-foreground">Electricity Bill Input</label>
          <div className="flex gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setBillMode("bill")}
              className={`px-2.5 py-0.5 rounded-lg font-medium text-xs transition-all ${
                billMode === "bill" ? "bg-primary text-primary-foreground font-semibold shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly ₹
            </button>
            <button
              type="button"
              onClick={() => setBillMode("units")}
              className={`px-2.5 py-0.5 rounded-lg font-medium text-xs transition-all ${
                billMode === "units" ? "bg-primary text-primary-foreground font-semibold shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Units (kWh)
            </button>
          </div>
        </div>

        {billMode === "bill" ? (
          <div>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                value={monthlyBill}
                onChange={(e) => setMonthlyBill(Number(e.target.value))}
                className="pl-9 h-9 text-xs rounded-xl bg-secondary/30 focus:bg-background border-border/70"
                step={500}
              />
            </div>
          </div>
        ) : (
          <div>
            <Input
              type="number"
              value={monthlyUnits}
              onChange={(e) => setMonthlyUnits(Number(e.target.value))}
              className="h-9 text-xs rounded-xl bg-secondary/30 focus:bg-background border-border/70"
              placeholder="e.g. 450 kWh"
            />
          </div>
        )}
      </div>

      {/* Hardware & Pricing Options */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Solar Panel Model</label>
          <select
            value={panelId}
            onChange={(e) => setPanelId(e.target.value)}
            className="mt-1 flex h-9 w-full rounded-xl border border-border/70 bg-secondary/30 px-3 py-1 text-xs font-medium shadow-xs focus-visible:outline-none focus:bg-background"
          >
            <option value="PN01">Standard 400W Mono</option>
            <option value="PN02">High-Efficiency 540W TOPCon</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground">Installer Cost Tier</label>
          <select
            value={costTier}
            onChange={(e) => setCostTier(e.target.value as any)}
            className="mt-1 flex h-9 w-full rounded-xl border border-border/70 bg-secondary/30 px-3 py-1 text-xs font-medium shadow-xs focus-visible:outline-none focus:bg-background"
          >
            <option value="low">Budget (₹55k/kW)</option>
            <option value="default">Standard Turnkey (₹65k/kW)</option>
            <option value="high">Premium Tier (₹85k/kW)</option>
          </select>
        </div>
      </div>

      {/* Optional Battery Storage Setup */}
      <div className="p-3.5 bg-secondary/30 rounded-xl border border-border/60 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={addBattery}
              onChange={(e) => setAddBattery(e.target.checked)}
              className="rounded border-input text-primary focus:ring-primary h-4 w-4"
            />
            <Battery className="h-4 w-4 text-emerald-600" />
            <span className="hidden sm:inline">Add Battery Outage Backup Option?</span>
            <span className="sm:hidden">Add Battery Backup?</span>
          </label>
          <span className="text-[10px] text-muted-foreground font-mono bg-background px-2 py-0.5 rounded border border-border/50">Non-Subsidized</span>
        </div>

        {addBattery && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Battery Type</label>
              <select
                value={batteryId}
                onChange={(e) => setBatteryId(e.target.value)}
                className="mt-1 flex h-8 w-full rounded-lg border border-border/70 bg-background px-2 py-1 text-[11px] font-medium"
              >
                <option value="BT02">LFP Lithium (20k/kWh)</option>
                <option value="BT01">Lead-Acid (12k/kWh)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Capacity (kWh)</label>
              <Input
                type="number"
                value={batteryCapacity}
                onChange={(e) => setBatteryCapacity(Number(e.target.value))}
                className="mt-1 h-8 text-[11px] rounded-lg"
                min={1}
                max={30}
              />
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 pb-2">
        <button
          onClick={handleViewAnalysis}
          className="w-full py-3 px-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-md hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
        >
          View Analysis & Pricing
        </button>
      </div>
    </div>
  );
}
