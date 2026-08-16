import { IMapProvider, IGeocodingProvider } from "./interfaces";
import { GoogleMapsProvider, GoogleGeocodingProvider } from "./GoogleMapsProvider";
import { OpenStreetMapProvider } from "./OpenStreetMapProvider";
import { NominatimGeocodingProvider } from "./NominatimGeocodingProvider";
import { MapProviderType, GeocodingProviderType } from "./models";

export class MapProviderFactory {
  public static getActiveMapProviderType(): MapProviderType {
    const envVal = import.meta.env.VITE_MAP_PROVIDER || "google";
    return envVal.toLowerCase() === "osm" ? "osm" : "google";
  }

  public static getActiveGeocodingProviderType(): GeocodingProviderType {
    const envVal = import.meta.env.VITE_GEOCODING_PROVIDER || "google";
    return envVal.toLowerCase() === "nominatim" ? "nominatim" : "google";
  }

  public static createMapProvider(overrideType?: MapProviderType): IMapProvider {
    const type = overrideType || this.getActiveMapProviderType();
    if (type === "osm") {
      return new OpenStreetMapProvider();
    }
    return new GoogleMapsProvider();
  }

  public static createGeocodingProvider(overrideType?: GeocodingProviderType): IGeocodingProvider {
    const type = overrideType || this.getActiveGeocodingProviderType();
    if (type === "nominatim") {
      return new NominatimGeocodingProvider();
    }
    return new GoogleGeocodingProvider();
  }
}
