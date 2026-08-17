import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { IMapProvider, MapInitOptions } from "./interfaces";
import { NormalizedLocation, NormalizedGeoJSONFeature, MapProviderType } from "./models";

export class OpenStreetMapProvider implements IMapProvider {
  private map: L.Map | null = null;
  private tileLayer: L.TileLayer | null = null;
  private markers: L.Marker[] = [];
  private geojsonLayers: L.GeoJSON[] = [];
  private activeFeature: NormalizedGeoJSONFeature | null = null;
  private onEditCallback: ((updated: NormalizedGeoJSONFeature) => void) | null = null;

  // Vertex editing state — kept separately so handles survive polygon redraws
  private vertexHandles: L.Marker[] = [];
  private editPolygonLayer: L.Polygon | null = null;
  private isEditingActive = false;

  async initialize(container: HTMLElement, options: MapInitOptions): Promise<void> {
    if (this.map) {
      this.destroy();
    }

    const tileUrl =
      import.meta.env.VITE_OSM_TILE_URL || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    const attribution =
      import.meta.env.VITE_OSM_ATTRIBUTION ||
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    this.map = L.map(container, {
      center: [options.center.lat, options.center.lng],
      zoom: options.zoom,
      zoomControl: true,
    });

    this.tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution,
    }).addTo(this.map);
  }

  destroy(): void {
    this.clearEditingLayers();
    this.clearMarkers();
    this.clearPolygons();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  setCenter(lat: number, lng: number, zoom?: number): void {
    if (!this.map) return;
    this.map.setView([lat, lng], zoom || this.map.getZoom());
  }

  getCenter(): { lat: number; lng: number } {
    if (!this.map) return { lat: 19.076, lng: 72.8777 };
    const center = this.map.getCenter();
    return { lat: center.lat, lng: center.lng };
  }

  setZoom(zoom: number): void {
    if (this.map) this.map.setZoom(zoom);
  }

  getZoom(): number {
    return this.map ? this.map.getZoom() : 18;
  }

  addMarker(lat: number, lng: number, title?: string): void {
    if (!this.map) return;
    const defaultIcon = L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });

    const marker = L.marker([lat, lng], { icon: defaultIcon, title: title || "Location" }).addTo(this.map);
    this.markers.push(marker);
  }

  clearMarkers(): void {
    if (this.map) {
      this.markers.forEach((m) => this.map?.removeLayer(m));
    }
    this.markers = [];
  }

  displayGeoJSON(feature: NormalizedGeoJSONFeature): void {
    this.clearPolygons();
    this.activeFeature = feature;
    if (!this.map || !feature.geometry) return;

    const layer = L.geoJSON(feature as any, {
      style: {
        color: "#0284C7",
        weight: 3,
        opacity: 0.9,
        fillColor: "#0284C7",
        fillOpacity: 0.2,
      },
    }).addTo(this.map);

    this.geojsonLayers.push(layer);

    // Auto-fit bounds
    try {
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 19 });
      }
    } catch {
      // ignore empty bounds
    }
  }

  clearPolygons(): void {
    this.clearEditingLayers();
    if (this.map) {
      this.geojsonLayers.forEach((l) => this.map?.removeLayer(l));
    }
    this.geojsonLayers = [];
    this.activeFeature = null;
  }

  /**
   * Enable interactive vertex editing.
   */
  enablePolygonEditing(onUpdate: (updatedFeature: NormalizedGeoJSONFeature) => void): void {
    this.onEditCallback = onUpdate;
    if (!this.map || !this.activeFeature) return;
    const currentFeature = this.activeFeature;

    this.clearEditingLayers();
    if (this.map) {
      this.geojsonLayers.forEach((l) => this.map?.removeLayer(l));
    }
    this.geojsonLayers = [];
    this.activeFeature = currentFeature;
    this.isEditingActive = true;

    const coords = currentFeature.geometry.coordinates[0]; // [[lng, lat], ...]
    if (!coords || coords.length === 0) return;
    const map = this.map;

    // Create an editable Leaflet Polygon (visual only, not draggable itself)
    const latLngs: L.LatLng[] = coords
      .slice(0, -1) // skip closure duplicate
      .filter((pt): pt is [number, number] => Boolean(pt && typeof pt[0] === "number" && typeof pt[1] === "number"))
      .map((pt) => L.latLng(pt[1], pt[0]));

    this.editPolygonLayer = L.polygon(latLngs, {
      color: "#16A34A",
      weight: 3,
      opacity: 1,
      fillColor: "#16A34A",
      fillOpacity: 0.15,
      dashArray: "6 4",
    }).addTo(map);

    // Build vertex handles
    this.buildVertexHandles(latLngs, map);
  }

  private buildVertexHandles(latLngs: L.LatLng[], map: L.Map): void {
    // Clear previous handles
    this.clearVertexHandles();

    const handleIcon = L.divIcon({
      className: "leaflet-vertex-handle",
      html: '<div style="width:14px;height:14px;background:#16A34A;border:2px solid #ffffff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.35);cursor:grab;transition:transform 0.1s;"></div>',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    const midpointIcon = L.divIcon({
      className: "leaflet-midpoint-handle",
      html: '<div style="width:10px;height:10px;background:rgba(22,163,74,0.5);border:2px solid #ffffff;border-radius:50%;cursor:pointer;transition:all 0.15s;"></div>',
      iconSize: [10, 10],
      iconAnchor: [5, 5],
    });

    // Add draggable vertex handles
    latLngs.forEach((ll, idx) => {
      const handle = L.marker(ll, { icon: handleIcon, draggable: true }).addTo(map);
      handle.on("drag", () => this.onVertexDrag());
      handle.on("dragend", () => this.onVertexDragEnd());
      (handle as any)._vertexIndex = idx;
      (handle as any)._isMidpoint = false;
      this.vertexHandles.push(handle);
    });

    // Add midpoint ghost handles between each pair of vertices
    for (let i = 0; i < latLngs.length; i++) {
      const next = (i + 1) % latLngs.length;
      const curPt = latLngs[i];
      const nextPt = latLngs[next];
      if (!curPt || !nextPt) continue;
      const midLat = (curPt.lat + nextPt.lat) / 2;
      const midLng = (curPt.lng + nextPt.lng) / 2;

      const midHandle = L.marker([midLat, midLng], {
        icon: midpointIcon,
        draggable: true,
        opacity: 0.7,
      }).addTo(map);

      (midHandle as any)._isMidpoint = true;
      (midHandle as any)._insertAfter = i;

      midHandle.on("dragstart", () => {
        // Promote to full vertex on first drag
        (midHandle as any).setIcon(handleIcon);
        (midHandle as any).setOpacity(1);
      });

      midHandle.on("dragend", () => {
        // Insert as a new vertex
        const pos = midHandle.getLatLng();
        const insertIdx = (midHandle as any)._insertAfter + 1;

        const currentLatLngs = this.getCurrentLatLngsFromHandles();
        currentLatLngs.splice(insertIdx, 0, pos);

        // Rebuild entire handle set with the new vertex
        this.rebuildEditPolygon(currentLatLngs);
      });

      this.vertexHandles.push(midHandle);
    }
  }

  /** Called during vertex drag — live-update the polygon outline */
  private onVertexDrag(): void {
    if (!this.editPolygonLayer) return;
    const latLngs = this.getCurrentLatLngsFromHandles();
    this.editPolygonLayer.setLatLngs(latLngs);
  }

  /** Called after vertex drag ends — compute area and emit update */
  private onVertexDragEnd(): void {
    if (!this.editPolygonLayer) return;
    const latLngs = this.getCurrentLatLngsFromHandles();
    this.editPolygonLayer.setLatLngs(latLngs);
    this.emitUpdatedFeature(latLngs);

    // Rebuild midpoint handles to account for new positions
    if (this.map) {
      this.rebuildEditPolygon(latLngs);
    }
  }

  /** Extract current vertex positions from the primary (non-midpoint) handles */
  private getCurrentLatLngsFromHandles(): L.LatLng[] {
    return this.vertexHandles
      .filter((h) => !(h as any)._isMidpoint)
      .sort((a, b) => (a as any)._vertexIndex - (b as any)._vertexIndex)
      .map((h) => h.getLatLng());
  }

  /** Rebuild the edit polygon + handles from a new set of LatLngs */
  private rebuildEditPolygon(latLngs: L.LatLng[]): void {
    if (!this.map) return;
    const map = this.map;

    // Remove old edit polygon
    if (this.editPolygonLayer) {
      map.removeLayer(this.editPolygonLayer);
    }

    // Create new polygon
    this.editPolygonLayer = L.polygon(latLngs, {
      color: "#16A34A",
      weight: 3,
      opacity: 1,
      fillColor: "#16A34A",
      fillOpacity: 0.15,
      dashArray: "6 4",
    }).addTo(map);

    // Rebuild all handles
    this.buildVertexHandles(latLngs, map);

    // Emit the update
    this.emitUpdatedFeature(latLngs);
  }

  /** Build the updated GeoJSON feature and fire the callback */
  private emitUpdatedFeature(latLngs: L.LatLng[]): void {
    // Convert to GeoJSON [lng, lat] ring
    const updatedLngLats: number[][] = latLngs.map((ll) => [ll.lng, ll.lat]);

    // Ensure closed ring
    const first = updatedLngLats[0];
    const last = updatedLngLats[updatedLngLats.length - 1];
    if (
      first &&
      last &&
      (first[0] !== last[0] || first[1] !== last[1])
    ) {
      updatedLngLats.push([first[0] ?? 0, first[1] ?? 0]);
    }

    const areaM2 = this.computeSphericalPolygonArea(updatedLngLats);

    const updatedFeature: NormalizedGeoJSONFeature = {
      type: "Feature",
      properties: {
        ...this.activeFeature?.properties,
        source: "customer",
        areaM2: Math.round(areaM2),
        retrievedAt: new Date().toISOString(),
      },
      geometry: {
        type: "Polygon",
        coordinates: [updatedLngLats],
      },
    };

    this.activeFeature = updatedFeature;
    if (this.onEditCallback) {
      this.onEditCallback(updatedFeature);
    }
  }

  private clearVertexHandles(): void {
    if (this.map) {
      this.vertexHandles.forEach((h) => this.map?.removeLayer(h));
    }
    this.vertexHandles = [];
  }

  private clearEditingLayers(): void {
    this.clearVertexHandles();
    if (this.editPolygonLayer && this.map) {
      this.map.removeLayer(this.editPolygonLayer);
      this.editPolygonLayer = null;
    }
    this.isEditingActive = false;
    this.onEditCallback = null;
  }

  disablePolygonEditing(): void {
    this.clearEditingLayers();

    // Re-display the static polygon from the current active feature
    if (this.activeFeature) {
      this.displayGeoJSON(this.activeFeature);
    }
  }

  fitBounds(bounds: Array<[number, number]>): void {
    if (!this.map) return;
    this.map.fitBounds(bounds as L.LatLngBoundsExpression);
  }

  onMapClick(handler: (lat: number, lng: number) => void): void {
    if (!this.map) return;
    this.map.on("click", (e: L.LeafletMouseEvent) => {
      handler(e.latlng.lat, e.latlng.lng);
    });
  }

  getProviderName(): MapProviderType {
    return "osm";
  }

  getAttribution(): string {
    return 'Map data &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';
  }

  // Calculate area in square meters for GeoJSON [lng, lat] coordinates
  private computeSphericalPolygonArea(coords: number[][]): number {
    if (coords.length < 3) return 0;
    const radius = 6378137; // Earth's mean radius in meters
    let area = 0;

    for (let i = 0; i < coords.length - 1; i++) {
      const p1 = coords[i];
      const p2 = coords[i + 1];
      if (!p1 || !p2 || typeof p1[0] !== "number" || typeof p2[0] !== "number" || typeof p1[1] !== "number" || typeof p2[1] !== "number") continue;
      const rad1Lat = (p1[1] * Math.PI) / 180;
      const rad1Lng = (p1[0] * Math.PI) / 180;
      const rad2Lat = (p2[1] * Math.PI) / 180;
      const rad2Lng = (p2[0] * Math.PI) / 180;

      area += (rad2Lng - rad1Lng) * (2 + Math.sin(rad1Lat) + Math.sin(rad2Lat));
    }
    area = (Math.abs(area) * radius * radius) / 2;
    return area;
  }
}
