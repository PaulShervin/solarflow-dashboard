import React, { useEffect, useRef, useState } from "react";
import {
  MapPin,
  Navigation,
  Search,
  CheckCircle2,
  Edit3,
  RotateCcw,
  Sparkles,
  Layers,
  Info,
  Globe,
  Compass,
  Maximize2,
  Crosshair,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapProviderFactory } from "@/lib/map-engine/MapProviderFactory";
import { IMapProvider, IGeocodingProvider } from "@/lib/map-engine/interfaces";
import {
  NormalizedLocation,
  NormalizedGeoJSONFeature,
  MapProviderType,
} from "@/lib/map-engine/models";
import { NominatimGeocodingProvider } from "@/lib/map-engine/NominatimGeocodingProvider";
import { toast } from "sonner";

interface UnifiedPropertyMapProps {
  initialCenter?: { lat: number; lng: number };
  onPropertyConfirmed?: (data: {
    location: NormalizedLocation;
    buildingFootprint: NormalizedGeoJSONFeature;
    address?: string;
  }) => void;
}

export function UnifiedPropertyMap({
  initialCenter = { lat: 19.076, lng: 72.8777 }, // Default Mumbai
  onPropertyConfirmed,
}: UnifiedPropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapProviderRef = useRef<IMapProvider | null>(null);
  const geocodingProviderRef = useRef<IGeocodingProvider | null>(null);

  const [activeProviderType, setActiveProviderType] = useState<MapProviderType>("osm");
  const [addressSearch, setAddressSearch] = useState("");
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<NormalizedLocation>({
    latitude: initialCenter.lat,
    longitude: initialCenter.lng,
    source: "map-selection",
  });

  const [selectedFootprint, setSelectedFootprint] = useState<NormalizedGeoJSONFeature | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Initialize Map Provider
  useEffect(() => {
    const mapProvider = MapProviderFactory.createMapProvider();
    const geocodingProvider = MapProviderFactory.createGeocodingProvider();

    mapProviderRef.current = mapProvider;
    geocodingProviderRef.current = geocodingProvider;
    setActiveProviderType(mapProvider.getProviderName());

    if (containerRef.current) {
      mapProvider
        .initialize(containerRef.current, {
          center: initialCenter,
          zoom: 18,
        })
        .then(() => {
          mapProvider.onMapClick((lat, lng) => {
            handleMapLocationSelected(lat, lng, "map-selection");
          });

          // Instruct user to click on the map
          toast.info("Please navigate and tap on your building on the map.");
        });
    }

    return () => {
      mapProvider.destroy();
    };
  }, []);

  // Fetch building footprint geometry & auto-activate vertex editing
  async function fetchAndDisplayBuildingFootprint(lat: number, lng: number) {
    let footprintFeature: NormalizedGeoJSONFeature | null = null;

    const providerName = geocodingProviderRef.current?.getProviderName();
    const mapProviderName = mapProviderRef.current?.getProviderName();

    if (mapProviderName === "osm" || providerName === "nominatim") {
      toast.loading("Detecting building outline…", { id: "overpass-loading" });
      const nominatim = new NominatimGeocodingProvider();
      footprintFeature = await nominatim.fetchBuildingFootprint(lat, lng);
      toast.dismiss("overpass-loading");

      if (footprintFeature?.properties?.sourceId === "fallback_estimated") {
        toast.info("No OSM building outline found. Showing editable estimate — drag handle markers to fit roof.", { duration: 5000 });
      } else {
        toast.success(`Rooftop detected (${footprintFeature?.properties?.areaM2 ?? "?"} m²) — drag green handles to refine outline.`, { duration: 4000 });
      }
    } else {
      const deltaLat = 0.00007;
      const deltaLng = 0.00008;
      footprintFeature = {
        type: "Feature",
        properties: {
          source: "google",
          confidence: 0.85,
          areaM2: 60,
          retrievedAt: new Date().toISOString(),
        },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [lng - deltaLng, lat - deltaLat],
            [lng + deltaLng, lat - deltaLat],
            [lng + deltaLng, lat + deltaLat],
            [lng - deltaLng, lat + deltaLat],
            [lng - deltaLng, lat - deltaLat],
          ]],
        },
      };
    }

    if (footprintFeature && mapProviderRef.current) {
      setSelectedFootprint(footprintFeature);
      mapProviderRef.current.displayGeoJSON(footprintFeature);
      mapProviderRef.current.enablePolygonEditing((updatedFeature) => {
        setSelectedFootprint(updatedFeature);
      });
      setIsEditing(true);
    }
  }

  // Location Selection Handler
  async function handleMapLocationSelected(
    lat: number,
    lng: number,
    source: NormalizedLocation["source"]
  ) {
    setIsEditing(false);
    setConfirmed(false);
    setSelectedFootprint(null);

    const newLoc: NormalizedLocation = {
      latitude: lat,
      longitude: lng,
      source,
      provider: activeProviderType,
    };
    setCurrentLocation(newLoc);

    if (mapProviderRef.current) {
      // Completely clear previous building polygons, edit handles, and markers
      mapProviderRef.current.clearPolygons();
      mapProviderRef.current.clearMarkers();
      mapProviderRef.current.addMarker(lat, lng, "Property Location");
      mapProviderRef.current.setCenter(lat, lng);
    }

    await fetchAndDisplayBuildingFootprint(lat, lng);

    if (geocodingProviderRef.current) {
      geocodingProviderRef.current.reverseGeocode(lat, lng).then((res) => {
        if (res) setAddressSearch(res.address);
      });
    }
  }

  // Browser Geolocation ("Use My Current Location")
  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setIsGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGeolocating(false);
        const { latitude, longitude } = pos.coords;
        if (mapProviderRef.current) {
          mapProviderRef.current.setCenter(latitude, longitude);
        }
        toast.success("Navigated to your location!");
        toast.info("Now please tap on your building on the map to select it.");
      },
      (err) => {
        setIsGeolocating(false);
        toast.error(`GPS Error: ${err.message || "Failed to get current location"}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // Address Search Handler
  async function handleAddressSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!addressSearch.trim() || !geocodingProviderRef.current) return;

    const loc = await geocodingProviderRef.current.forwardGeocode(addressSearch);
    if (loc) {
      if (mapProviderRef.current) {
        mapProviderRef.current.setCenter(loc.latitude, loc.longitude);
      }
      toast.success("Address found!");
      toast.info("Now please tap on your building on the map to select it.");
    } else {
      toast.error("Address not found. Please try a more specific search term.");
    }
  }

  // Toggle Polygon Vertex Editing Mode
  function handleToggleEditOutline() {
    if (!mapProviderRef.current || !selectedFootprint) return;

    if (isEditing) {
      mapProviderRef.current.disablePolygonEditing();
      setIsEditing(false);
      toast.info("Outline editing locked");
    } else {
      mapProviderRef.current.enablePolygonEditing((updatedFeature) => {
        setSelectedFootprint(updatedFeature);
      });
      setIsEditing(true);
      toast.info("Drag the green handle points to trace the rooftop perimeter.");
    }
  }

  // Confirm Property Selection
  async function handleConfirmProperty() {
    if (!selectedFootprint) return;
    setConfirmed(true);

    const confirmedFootprint: NormalizedGeoJSONFeature = {
      ...selectedFootprint,
      properties: {
        ...selectedFootprint.properties,
        confirmedByCustomer: true,
        source: isEditing ? "customer" : selectedFootprint.properties.source,
      },
    };

    try {
      await fetch("/api/property/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: currentLocation,
          buildingFootprint: confirmedFootprint,
          address: addressSearch,
        }),
      });
    } catch {
      // offline silent fallback
    }

    if (onPropertyConfirmed) {
      onPropertyConfirmed({
        location: currentLocation,
        buildingFootprint: confirmedFootprint,
        address: addressSearch,
      });
    }

    toast.success("Rooftop geometry confirmed for pre-design sizing!");
  }

  return (
    <div className="bg-card border border-border/80 rounded-2xl shadow-md overflow-hidden transition-all duration-300">
      
      {/* Top Glass Search & Action Header */}
      <div className="p-3.5 bg-background/80 backdrop-blur-md border-b border-border/70 flex flex-wrap items-center justify-between gap-3">
        {/* Search Bar Form */}
        <form onSubmit={handleAddressSearchSubmit} className="flex-1 min-w-[260px] flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={addressSearch}
              onChange={(e) => setAddressSearch(e.target.value)}
              placeholder="Search rooftop address, landmark, or coordinates..."
              className="pl-9 pr-3 h-9 text-xs bg-secondary/40 focus:bg-background border-border/60 rounded-xl transition-all shadow-inner"
            />
          </div>
          <Button type="submit" size="sm" className="h-9 px-4 text-xs font-medium rounded-xl gap-1.5 shadow-sm">
            <Search className="h-3.5 w-3.5" />
            Search
          </Button>
        </form>

        {/* GPS Quick Pin & Provider Indicator */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUseMyLocation}
            disabled={isGeolocating}
            className="h-9 px-3 text-xs font-medium rounded-xl gap-1.5 border-border/70 bg-background hover:bg-secondary/60 shadow-xs"
          >
            <Navigation className={`h-3.5 w-3.5 text-emerald-600 ${isGeolocating ? "animate-spin" : ""}`} />
            {isGeolocating ? "Locating..." : "Locate Me"}
          </Button>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[11px] font-semibold">
            <Globe className="h-3.5 w-3.5 text-primary" />
            <span>{activeProviderType === "osm" ? "OpenStreetMap Satellite Engine" : "Google Maps Engine"}</span>
          </div>
        </div>
      </div>

      {/* Expanded Interactive Map View Container */}
      <div className="relative group">
        <div ref={containerRef} className="w-full h-[420px] bg-slate-950 z-10" />

        {/* Floating Quick Action Overlay (Top Right of Map) */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              if (mapProviderRef.current && currentLocation) {
                mapProviderRef.current.setCenter(currentLocation.latitude, currentLocation.longitude, 18);
              }
            }}
            title="Recenter Map Pin"
            className="h-9 w-9 bg-background/90 hover:bg-background backdrop-blur-md border border-border/70 shadow-md rounded-xl flex items-center justify-center text-foreground transition-all hover:scale-105"
          >
            <Crosshair className="h-4 w-4 text-primary" />
          </button>
        </div>

        {/* Subtle Clean Legal Attribution Badge (No raw HTML strings) */}
        <div className="absolute bottom-2 right-2 z-20 px-2 py-0.5 rounded-lg bg-background/70 backdrop-blur border border-border/40 text-[10px] text-muted-foreground font-mono">
          © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="hover:underline text-foreground font-medium">OpenStreetMap</a> contributors
        </div>
      </div>

      {/* Bottom Rooftop Sizing & Geometry Bar */}
      {selectedFootprint && (
        <div className="p-4 bg-secondary/30 backdrop-blur-sm border-t border-border/70 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            
            {/* Left: Building Specs & Status Badge */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-foreground text-xs">Rooftop Boundary Area:</span>
                <span className="font-extrabold text-primary text-base tracking-tight">
                  {selectedFootprint.properties.areaM2 || 60} m²
                </span>
                <span className="text-muted-foreground text-xs font-medium">
                  ({Math.round((selectedFootprint.properties.areaM2 || 60) * 10.764)} sq.ft)
                </span>

                {selectedFootprint.properties.sourceId === "fallback_estimated" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/30">
                    ESTIMATED FOOTPRINT
                  </span>
                )}
                {selectedFootprint.properties.source === "osm" && selectedFootprint.properties.sourceId !== "fallback_estimated" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                    OSM DETECTED
                  </span>
                )}
                {selectedFootprint.properties.source === "customer" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 border border-indigo-500/30">
                    CUSTOMER REFINED
                  </span>
                )}
              </div>

              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
                <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                {isEditing
                  ? "Drag the green ● handles to trace your rooftop perimeter."
                  : `Location Pin: ${currentLocation.latitude.toFixed(5)}, ${currentLocation.longitude.toFixed(5)}`
                }
              </div>
            </div>

            {/* Right: Interactive Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={isEditing ? "default" : "outline"}
                size="sm"
                onClick={handleToggleEditOutline}
                className={`gap-1.5 text-xs h-9 px-3.5 rounded-xl font-medium shadow-xs transition-all ${
                  isEditing ? "bg-green-700 hover:bg-green-800 text-white border-transparent" : "border-border/70"
                }`}
              >
                <Edit3 className="h-3.5 w-3.5" />
                {isEditing ? "Done Editing" : "Edit Outline"}
              </Button>

              <Button
                type="button"
                variant={confirmed ? "secondary" : "default"}
                size="sm"
                onClick={handleConfirmProperty}
                disabled={confirmed}
                className="gap-1.5 text-xs h-9 px-4 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {confirmed ? "Confirmed!" : "Confirm Property"}
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
