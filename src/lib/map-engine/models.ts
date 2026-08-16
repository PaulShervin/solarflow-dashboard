export type LocationSource = "browser-gps" | "map-selection" | "address-search";
export type MapProviderType = "google" | "osm";
export type GeocodingProviderType = "google" | "nominatim";

export interface NormalizedLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  source: LocationSource;
  provider?: MapProviderType;
}

export interface GeoJSONPolygonGeometry {
  type: "Polygon";
  coordinates: number[][][]; // array of rings, each ring is array of [lng, lat]
}

export interface GeoJSONMultiPolygonGeometry {
  type: "MultiPolygon";
  coordinates: number[][][][];
}

export type GeoJSONGeometry = GeoJSONPolygonGeometry | GeoJSONMultiPolygonGeometry;

export interface FeatureProperties {
  source: "google" | "osm" | "customer";
  sourceId?: string;
  address?: string;
  confidence?: number | null;
  areaM2?: number;
  confirmedByCustomer?: boolean;
  retrievedAt?: string;
}

export interface NormalizedGeoJSONFeature {
  type: "Feature";
  properties: FeatureProperties;
  geometry: GeoJSONGeometry;
}

export interface RoofAssessment {
  status: "pending" | "assessed";
  roofSegments: Array<{
    id: string;
    areaM2: number;
    azimuthDegrees: number;
    tiltDegrees: number;
  }>;
  usableAreaM2: number | null;
  orientationDegrees: number | null;
  tiltDegrees: number | null;
  shadingLossPct: number | null;
}

export interface PropertyGeometryRecord {
  id?: string;
  location: NormalizedLocation;
  buildingFootprint: NormalizedGeoJSONFeature;
  customerConfirmedGeometry?: NormalizedGeoJSONFeature;
  roofAssessment?: RoofAssessment;
  createdAt?: string;
  updatedAt?: string;
}
