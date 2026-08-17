import { IMapProvider, MapInitOptions, IGeocodingProvider } from "./interfaces";
import { NormalizedLocation, NormalizedGeoJSONFeature, MapProviderType, GeocodingProviderType } from "./models";

declare global {
  interface Window {
    google: any;
  }
}

export class GoogleMapsProvider implements IMapProvider {
  private map: any = null;
  private markers: any[] = [];
  private polygons: any[] = [];
  private activeFeature: NormalizedGeoJSONFeature | null = null;
  private onEditCallback: ((updated: NormalizedGeoJSONFeature) => void) | null = null;

  async initialize(container: HTMLElement, options: MapInitOptions): Promise<void> {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
    await this.loadGoogleScript(apiKey);

    if (window.google && window.google.maps) {
      this.map = new window.google.maps.Map(container, {
        center: options.center,
        zoom: options.zoom,
        mapTypeId: "hybrid",
        disableDefaultUI: false,
        zoomControl: true,
      });
    }
  }

  private loadGoogleScript(apiKey: string): Promise<void> {
    return new Promise((resolve) => {
      if (window.google && window.google.maps) {
        return resolve();
      }
      const existingScript = document.getElementById("google-maps-js-sdk");
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve());
        return;
      }
      const script = document.createElement("script");
      script.id = "google-maps-js-sdk";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,drawing,places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        console.warn("Failed to load Google Maps SDK script");
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  destroy(): void {
    this.clearMarkers();
    this.clearPolygons();
    this.map = null;
  }

  setCenter(lat: number, lng: number, zoom?: number): void {
    if (!this.map || !window.google) return;
    this.map.setCenter({ lat, lng });
    if (zoom) this.map.setZoom(zoom);
  }

  getCenter(): { lat: number; lng: number } {
    if (!this.map) return { lat: 19.076, lng: 72.8777 };
    const center = this.map.getCenter();
    return { lat: center.lat(), lng: center.lng() };
  }

  setZoom(zoom: number): void {
    if (this.map) this.map.setZoom(zoom);
  }

  getZoom(): number {
    return this.map ? this.map.getZoom() : 18;
  }

  addMarker(lat: number, lng: number, title?: string): void {
    if (!this.map || !window.google) return;
    const marker = new window.google.maps.Marker({
      position: { lat, lng },
      map: this.map,
      title: title || "Selected Property",
      animation: window.google.maps.Animation.DROP,
    });
    this.markers.push(marker);
  }

  clearMarkers(): void {
    this.markers.forEach((m) => m.setMap(null));
    this.markers = [];
  }

  displayGeoJSON(feature: NormalizedGeoJSONFeature): void {
    this.clearPolygons();
    this.activeFeature = feature;
    if (!this.map || !window.google || !feature.geometry) return;

    const coords = feature.geometry.coordinates[0]; // Exterior ring [lng, lat]
    if (!coords) return;
    const googlePath = coords.map(([lng, lat]) => ({ lat: lat ?? 0, lng: lng ?? 0 }));

    const polygon = new window.google.maps.Polygon({
      paths: googlePath,
      strokeColor: "#0284C7",
      strokeOpacity: 0.9,
      strokeWeight: 3,
      fillColor: "#0284C7",
      fillOpacity: 0.25,
      editable: false,
      draggable: false,
    });

    polygon.setMap(this.map);
    this.polygons.push(polygon);

    // Auto-fit bounds
    const bounds = new window.google.maps.LatLngBounds();
    googlePath.forEach((p) => bounds.extend(p));
    this.map.fitBounds(bounds);
  }

  clearPolygons(): void {
    this.polygons.forEach((p) => p.setMap(null));
    this.polygons = [];
  }

  enablePolygonEditing(onUpdate: (updatedFeature: NormalizedGeoJSONFeature) => void): void {
    this.onEditCallback = onUpdate;
    if (this.polygons.length === 0 || !window.google) return;

    const polygon = this.polygons[0];
    polygon.setEditable(true);

    const path = polygon.getPath();
    const updateHandler = () => {
      const updatedCoords: number[][] = [];
      for (let i = 0; i < path.getLength(); i++) {
        const pt = path.getAt(i);
        updatedCoords.push([pt.lng(), pt.lat()]);
      }
      // Ensure ring closure
      const first = updatedCoords[0];
      const last = updatedCoords[updatedCoords.length - 1];
      if (
        first &&
        last &&
        (first[0] !== last[0] || first[1] !== last[1])
      ) {
        updatedCoords.push([first[0] ?? 0, first[1] ?? 0]);
      }

      // Calculate area if geometry library available
      let areaM2 = 0;
      if (window.google.maps.geometry?.spherical) {
        areaM2 = Math.round(window.google.maps.geometry.spherical.computeArea(path));
      }

      const updatedFeature: NormalizedGeoJSONFeature = {
        type: "Feature",
        properties: {
          ...this.activeFeature?.properties,
          source: "customer",
          areaM2: areaM2 || this.activeFeature?.properties.areaM2 || 0,
          retrievedAt: new Date().toISOString(),
        },
        geometry: {
          type: "Polygon",
          coordinates: [updatedCoords],
        },
      };

      if (this.onEditCallback) {
        this.onEditCallback(updatedFeature);
      }
    };

    path.addListener("set_at", updateHandler);
    path.addListener("insert_at", updateHandler);
    path.addListener("remove_at", updateHandler);
  }

  disablePolygonEditing(): void {
    if (this.polygons.length > 0) {
      this.polygons[0].setEditable(false);
    }
  }

  fitBounds(bounds: Array<[number, number]>): void {
    if (!this.map || !window.google) return;
    const gBounds = new window.google.maps.LatLngBounds();
    bounds.forEach(([lat, lng]) => gBounds.extend({ lat, lng }));
    this.map.fitBounds(gBounds);
  }

  onMapClick(handler: (lat: number, lng: number) => void): void {
    if (!this.map || !window.google) return;
    this.map.addListener("click", (e: any) => {
      handler(e.latLng.lat(), e.latLng.lng());
    });
  }

  getProviderName(): MapProviderType {
    return "google";
  }

  getAttribution(): string {
    return "Map data © Google Maps";
  }
}

export class GoogleGeocodingProvider implements IGeocodingProvider {
  async forwardGeocode(address: string): Promise<NormalizedLocation | null> {
    if (!window.google || !window.google.maps) return null;
    return new Promise((resolve) => {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address }, (results: any, status: any) => {
        if (status === "OK" && results?.[0]) {
          const loc = results[0].geometry.location;
          resolve({
            latitude: loc.lat(),
            longitude: loc.lng(),
            source: "address-search",
            provider: "google",
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  async reverseGeocode(lat: number, lng: number): Promise<{ address: string; location: NormalizedLocation } | null> {
    if (!window.google || !window.google.maps) return null;
    return new Promise((resolve) => {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
        if (status === "OK" && results?.[0]) {
          resolve({
            address: results[0].formatted_address,
            location: {
              latitude: lat,
              longitude: lng,
              source: "map-selection",
              provider: "google",
            },
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  getProviderName(): GeocodingProviderType {
    return "google";
  }
}
