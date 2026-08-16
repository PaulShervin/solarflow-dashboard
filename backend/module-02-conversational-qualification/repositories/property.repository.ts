import { v4 as uuidv4 } from "uuid";

export interface PropertyRecord {
  id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  source: string;
  provider: string;
  address?: string;
  buildingFootprint: any; // GeoJSON Feature
  customerConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
}

export class PropertyRepository {
  private static propertiesStore: PropertyRecord[] = [];

  public static saveConfirmedProperty(data: {
    location: { latitude: number; longitude: number; accuracy?: number; source?: string; provider?: string };
    buildingFootprint: any;
    address?: string;
  }): PropertyRecord {
    const record: PropertyRecord = {
      id: `PRP-${uuidv4().substring(0, 8)}`,
      latitude: data.location.latitude,
      longitude: data.location.longitude,
      accuracy: data.location.accuracy,
      source: data.location.source || "map-selection",
      provider: data.location.provider || "google",
      address: data.address,
      buildingFootprint: data.buildingFootprint,
      customerConfirmed: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.propertiesStore.push(record);
    return record;
  }

  public static getPropertyById(id: string): PropertyRecord | null {
    return this.propertiesStore.find((p) => p.id === id) || null;
  }
}
