# Provider-Agnostic Map & Geolocation Architecture

This document describes the provider-agnostic map and geolocation system implemented for `solarflow-dashboard`. The architecture enables seamless switching between **Google Maps** and **OpenStreetMap (Leaflet + Nominatim + Overpass)** using environment variables without modifying core application code or downstream solar analysis pipelines.

---

## 1. Core Architectural Principle

The application uses an abstract factory & adapter pattern (`IMapProvider` and `IGeocodingProvider`). UI components and solar engines consume normalized interfaces and standardized **GeoJSON** features rather than provider-specific SDK objects.

```
                    APPLICATION / UI COMPONENT
                                 │
                                 ▼
                     UnifiedPropertyMap Component
                                 │
                        MapProviderFactory
                                 │
             ┌───────────────────┴───────────────────┐
             ▼                                       ▼
    GoogleMapsProvider                      OpenStreetMapProvider
             │                                       │
             ▼                                       ▼
      Google Maps JS API                      Leaflet Map Engine
                                                     │
                                             ┌───────┴───────┐
                                             ▼               ▼
                                        Overpass API    Nominatim API
                                             │               │
                                             └───────┬───────┘
                                                     ▼
                                              NORMALIZED DATA
                                                     │
                                                     ▼
                                              GeoJSON Feature
                                                     │
                                                     ▼
                                           Solar Analysis Engine
```

---

## 2. Environment Configuration

Provider selection is governed by environment variables in `.env`:

### Mode A: Google Maps (Default)
```env
MAP_PROVIDER=google
VITE_MAP_PROVIDER=google

GEOCODING_PROVIDER=google
VITE_GEOCODING_PROVIDER=google

GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE
VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE
```

### Mode B: OpenStreetMap + Leaflet + Nominatim
```env
MAP_PROVIDER=osm
VITE_MAP_PROVIDER=osm

GEOCODING_PROVIDER=nominatim
VITE_GEOCODING_PROVIDER=nominatim

NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org
VITE_NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org

NOMINATIM_USER_AGENT=SolarFlowDashboard/1.0 (contact@solarflow.example)
VITE_NOMINATIM_USER_AGENT=SolarFlowDashboard/1.0 (contact@solarflow.example)

OSM_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
VITE_OSM_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

---

## 3. Data Model Normalization

### Location Model (`NormalizedLocation`)
```typescript
interface NormalizedLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  source: "browser-gps" | "map-selection" | "address-search";
  provider?: "google" | "osm";
}
```

### Building Geometry Model (`NormalizedGeoJSONFeature`)
```typescript
interface NormalizedGeoJSONFeature {
  type: "Feature";
  properties: {
    source: "google" | "osm" | "customer";
    sourceId?: string;
    address?: string;
    confidence?: number | null;
    areaM2?: number;
    confirmedByCustomer?: boolean;
    retrievedAt?: string;
  };
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][]; // [longitude, latitude]
  };
}
```

---

## 4. Key Components

- **`IMapProvider`** ([src/lib/map-engine/interfaces.ts](file:///Users/aman/Desktop/solarflow-dashboard/src/lib/map-engine/interfaces.ts)): Contract for map initialization, marker lifecycle, GeoJSON rendering, polygon editing, and map click handlers.
- **`GoogleMapsProvider`** ([src/lib/map-engine/GoogleMapsProvider.ts](file:///Users/aman/Desktop/solarflow-dashboard/src/lib/map-engine/GoogleMapsProvider.ts)): Google Maps SDK adapter.
- **`OpenStreetMapProvider`** ([src/lib/map-engine/OpenStreetMapProvider.ts](file:///Users/aman/Desktop/solarflow-dashboard/src/lib/map-engine/OpenStreetMapProvider.ts)): Leaflet map renderer with OSM tile layers, draggable vertex handles, and spherical area calculation.
- **`NominatimGeocodingProvider`** ([src/lib/map-engine/NominatimGeocodingProvider.ts](file:///Users/aman/Desktop/solarflow-dashboard/src/lib/map-engine/NominatimGeocodingProvider.ts)): Nominatim forward/reverse geocode provider with rate limiting (max 1 req/sec) and in-memory cache. Also executes Overpass API building footprint discovery.
- **`UnifiedPropertyMap`** ([src/components/common/UnifiedPropertyMap.tsx](file:///Users/aman/Desktop/solarflow-dashboard/src/components/common/UnifiedPropertyMap.tsx)): Universal React map component for location pinning, rooftop footprint selection, polygon vertex editing, and GeoJSON confirmation.

---

## 5. Nominatim Guidelines & Compliance

- **Rate Limiting**: Requests to Nominatim are throttled to 1 request per second via `enforceRateLimit()`.
- **User Agent**: Every request sends a custom identifying User-Agent (`VITE_NOMINATIM_USER_AGENT`).
- **No Keystroke Autocomplete**: Public Nominatim API is never queried on individual input keystrokes; search is triggered only on form submission.
- **Caching**: Geocoding results are cached in-memory to minimize redundant calls.

---

## 6. How to Switch Map Providers

1. Open `.env`.
2. Change `VITE_MAP_PROVIDER=google` to `VITE_MAP_PROVIDER=osm`.
3. Restart the development server (`npm run dev`).
4. Navigate to `/admin/pre-design` -> Click "Satellite Map". The map will render via Leaflet + OpenStreetMap tiles with complete functionality.
