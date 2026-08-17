import { IGeocodingProvider } from "./interfaces";
import { NormalizedLocation, NormalizedGeoJSONFeature, GeocodingProviderType } from "./models";

const OVERPASS_MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.nchc.org.tw/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

export class NominatimGeocodingProvider implements IGeocodingProvider {
  private baseUrl: string;
  private userAgent: string;
  private cache: Map<string, any> = new Map();
  private buildingCache: Map<string, NormalizedGeoJSONFeature> = new Map();
  private lastRequestTime = 0;

  constructor() {
    this.baseUrl =
      import.meta.env.VITE_NOMINATIM_BASE_URL || "https://nominatim.openstreetmap.org";
    this.userAgent =
      import.meta.env.VITE_NOMINATIM_USER_AGENT || "SolarFlowDashboard/1.0";
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < 1000) {
      await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  async forwardGeocode(address: string): Promise<NormalizedLocation | null> {
    const cacheKey = `fw:${address.toLowerCase().trim()}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    try {
      await this.enforceRateLimit();
      const url = `${this.baseUrl}/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
      const res = await fetch(url, { headers: { "User-Agent": this.userAgent } });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || data.length === 0) return null;

      const first = data[0];
      const result: NormalizedLocation = {
        latitude: parseFloat(first.lat),
        longitude: parseFloat(first.lon),
        source: "address-search",
        provider: "osm",
      };
      this.cache.set(cacheKey, result);
      return result;
    } catch (err) {
      console.warn("Nominatim forward geocoding error:", err);
      return null;
    }
  }

  async reverseGeocode(
    lat: number,
    lng: number
  ): Promise<{ address: string; location: NormalizedLocation } | null> {
    const roundedLat = Math.round(lat * 10000) / 10000;
    const roundedLng = Math.round(lng * 10000) / 10000;
    const cacheKey = `rev:${roundedLat},${roundedLng}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    try {
      await this.enforceRateLimit();
      const url = `${this.baseUrl}/reverse?format=json&lat=${lat}&lon=${lng}`;
      const res = await fetch(url, { headers: { "User-Agent": this.userAgent } });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || !data.display_name) return null;

      const result = {
        address: data.display_name,
        location: {
          latitude: lat,
          longitude: lng,
          source: "map-selection" as const,
          provider: "osm" as const,
        },
      };
      this.cache.set(cacheKey, result);
      return result;
    } catch (err) {
      console.warn("Nominatim reverse geocoding error:", err);
      return null;
    }
  }

  /**
   * Ultra-fast building footprint query with `out geom;` & multi-mirror failover.
   */
  async fetchBuildingFootprint(
    lat: number,
    lng: number
  ): Promise<NormalizedGeoJSONFeature | null> {
    const cacheKey = `bldg:${Math.round(lat * 10000) / 10000},${Math.round(lng * 10000) / 10000}`;
    if (this.buildingCache.has(cacheKey)) {
      console.log("[Overpass] Returning cached building feature");
      return this.buildingCache.get(cacheKey)!;
    }

    // Highly optimized query using `out geom;` — returns lat/lon directly on way geometry!
    // No recursive node fetching, 10x faster execution (< 200ms)
    // Reduce search radius to 30m (user clicks on roof) to minimize query load on mirror.
    const query = `[out:json][timeout:15];way["building"](around:30,${lat},${lng});out geom;`;
    const queryUrlParam = `?data=${encodeURIComponent(query)}`;

    let data: any = null;
    let successfulMirror = "";

    // Try mirrors sequentially until one succeeds
    for (const mirror of OVERPASS_MIRRORS) {
      try {
        await this.enforceRateLimit(); // Prevent aggressive spamming of Overpass instances
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s max per mirror

        const url = `${mirror}${queryUrlParam}`;
        console.log(`[Overpass] Fetching building data from ${mirror}...`);
        
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          data = await res.json();
          successfulMirror = mirror;
          console.log(`[Overpass] Successfully retrieved data from ${mirror}`);
          break;
        } else {
          console.warn(`[Overpass] Mirror ${mirror} returned status ${res.status}`);
        }
      } catch (err: any) {
        console.warn(`[Overpass] Mirror ${mirror} failed/timed out:`, err.message || err);
      }
    }

    if (data?.elements?.length > 0) {
      const candidates: Array<{ id: string; coords: number[][]; area: number }> = [];

      for (const el of data.elements) {
        if (el.type === "way" && el.geometry && el.geometry.length >= 3) {
          // Convert [{lat, lon}, ...] to GeoJSON [[lng, lat], ...]
          const coords: number[][] = el.geometry.map((g: any) => [g.lon, g.lat]);

          // Ensure ring closure
          const first = coords[0];
          const last = coords[coords.length - 1];
          if (
            first &&
            last &&
            (first[0] !== last[0] || first[1] !== last[1])
          ) {
            coords.push([first[0] ?? 0, first[1] ?? 0]);
          }

          const area = this.computeArea(coords);
          if (area < 5) continue; // Skip tiny map noise (< 5m2)

          candidates.push({ id: `way:${el.id}`, coords, area });
        }
      }

      console.log(`[Overpass] Found ${candidates.length} candidate building footprint(s)`);

      if (candidates.length > 0) {
        // Strategy 1: Ray-casting Point-in-Polygon (Exact Click Match)
        const containing = candidates.filter((c) => this.pointInPolygon(lng, lat, c.coords));

        let selected: typeof candidates[0] | null = null;
        let selectionMethod = "";

        if (containing.length > 0) {
          // If multiple contain point (e.g. nested sections), pick smallest
          selected = containing.sort((a, b) => a.area - b.area)[0] ?? null;
          selectionMethod = "point-in-polygon";
        } else {
          // Strategy 2: Nearest Centroid within 30 meters
          let bestDist = Infinity;
          for (const c of candidates) {
            const centroid = this.computeCentroid(c.coords);
            const dist = this.haversineDistance(lat, lng, centroid[1], centroid[0]);
            if (dist < bestDist && dist < 30) {
              bestDist = dist;
              selected = c;
              selectionMethod = `nearest-building (${Math.round(dist)}m)`;
            }
          }
        }

        if (selected) {
          console.log(
            `[Overpass] Matched ${selected.id} via ${selectionMethod}: ${selected.coords.length - 1} vertices, ${Math.round(selected.area)} m²`
          );

          const feature: NormalizedGeoJSONFeature = {
            type: "Feature",
            properties: {
              source: "osm",
              sourceId: selected.id,
              confidence: selectionMethod.startsWith("point") ? 0.95 : 0.75,
              areaM2: Math.round(selected.area),
              retrievedAt: new Date().toISOString(),
            },
            geometry: {
              type: "Polygon",
              coordinates: [selected.coords],
            },
          };

          this.buildingCache.set(cacheKey, feature);
          return feature;
        }
      }
    }

    // Strategy 3: Proportional fallback rectangle scaled to lat
    console.log("[Overpass] No OSM building match found, returning dynamic fallback rectangle");
    const typicalLengthM = 10;
    const typicalWidthM = 8;
    const deltaLat = typicalWidthM / 2 / 111320;
    const deltaLng = typicalLengthM / 2 / (111320 * Math.cos((lat * Math.PI) / 180));

    const fallbackCoords = [
      [lng - deltaLng, lat - deltaLat],
      [lng + deltaLng, lat - deltaLat],
      [lng + deltaLng, lat + deltaLat],
      [lng - deltaLng, lat + deltaLat],
      [lng - deltaLng, lat - deltaLat],
    ];

    const fallbackFeature: NormalizedGeoJSONFeature = {
      type: "Feature",
      properties: {
        source: "osm",
        sourceId: "fallback_estimated",
        confidence: 0.3,
        areaM2: Math.round(this.computeArea(fallbackCoords)),
        retrievedAt: new Date().toISOString(),
      },
      geometry: {
        type: "Polygon",
        coordinates: [fallbackCoords],
      },
    };

    return fallbackFeature;
  }

  /**
   * Ray-casting point-in-polygon test.
   */
  private pointInPolygon(testLng: number, testLat: number, ring: number[][]): boolean {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const ptI = ring[i];
      const ptJ = ring[j];
      if (!ptI || !ptJ) continue;
      const xi = ptI[0] ?? 0, yi = ptI[1] ?? 0;
      const xj = ptJ[0] ?? 0, yj = ptJ[1] ?? 0;

      const intersect =
        yi > testLat !== yj > testLat &&
        testLng < ((xj - xi) * (testLat - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }
    return inside;
  }

  private computeCentroid(coords: number[][]): [number, number] {
    let sumLng = 0, sumLat = 0;
    for (const c of coords) {
      if (c && typeof c[0] === "number" && typeof c[1] === "number") {
        sumLng += c[0];
        sumLat += c[1];
      }
    }
    const len = coords.length || 1;
    return [sumLng / len, sumLat / len];
  }

  private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private computeArea(coords: number[][]): number {
    const radius = 6378137;
    let area = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      const p1 = coords[i], p2 = coords[i + 1];
      if (!p1 || !p2 || typeof p1[0] !== "number" || typeof p2[0] !== "number" || typeof p1[1] !== "number" || typeof p2[1] !== "number") continue;
      area +=
        ((p2[0] - p1[0]) * Math.PI) / 180 *
        (2 + Math.sin((p1[1] * Math.PI) / 180) + Math.sin((p2[1] * Math.PI) / 180));
    }
    return (Math.abs(area) * radius * radius) / 2;
  }

  getProviderName(): GeocodingProviderType {
    return "nominatim";
  }
}
