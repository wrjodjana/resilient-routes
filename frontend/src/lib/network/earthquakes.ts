import { Coordinates, EarthquakeElements } from "../types";
import { fetch_earthquakes } from "./usgs";

export class RenderEarthquakes {
  private map: google.maps.Map;

  constructor(map: google.maps.Map) {
    this.map = map;
  }

  async get_earthquakes(coords: Coordinates): Promise<EarthquakeElements[]> {
    try {
      const earthquake_data = await fetch_earthquakes(coords);
      return earthquake_data.features;
    } catch (error) {
      console.error("Failed to load earthquakes.");
      throw error;
    }
  }
}
