import {
  NormalizedLocation,
  NormalizedGeoJSONFeature,
  MapProviderType,
  GeocodingProviderType,
} from "./models";

export interface MapInitOptions {
  center: { lat: number; lng: number };
  zoom: number;
  interactive?: boolean;
}

export interface IMapProvider {
  initialize(container: HTMLElement, options: MapInitOptions): Promise<void>;
  destroy(): void;
  setCenter(lat: number, lng: number, zoom?: number): void;
  getCenter(): { lat: number; lng: number };
  setZoom(zoom: number): void;
  getZoom(): number;
  addMarker(lat: number, lng: number, title?: string): void;
  clearMarkers(): void;
  displayGeoJSON(feature: NormalizedGeoJSONFeature): void;
  clearPolygons(): void;
  enablePolygonEditing(onUpdate: (updatedFeature: NormalizedGeoJSONFeature) => void): void;
  disablePolygonEditing(): void;
  fitBounds(bounds: Array<[number, number]>): void;
  onMapClick(handler: (lat: number, lng: number) => void): void;
  getProviderName(): MapProviderType;
  getAttribution(): string;
}

export interface IGeocodingProvider {
  forwardGeocode(address: string): Promise<NormalizedLocation | null>;
  reverseGeocode(lat: number, lng: number): Promise<{ address: string; location: NormalizedLocation } | null>;
  getProviderName(): GeocodingProviderType;
}
