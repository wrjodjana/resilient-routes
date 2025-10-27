import { Coordinates, EarthquakeElements } from "../types";

const PYTHON_API = "http://localhost:8000";

export class RenderEarthquakes {
  private map: google.maps.Map;

  constructor(map: google.maps.Map) {
    this.map = map;
  }

  async get_earthquakes(coords: Coordinates): Promise<EarthquakeElements[]> {
    try {
      const response = await fetch(`${PYTHON_API}/api/earthquakes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(coords),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch earthquakes from API");
      }

      const earthquake_data = await response.json();

      if (!earthquake_data) {
        console.error("Found no earthquakes.");
      }

      return earthquake_data;
    } catch (error) {
      console.error("Failed to load earthquakes:", error);
      throw error;
    }
  }
}
