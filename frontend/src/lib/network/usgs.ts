import { Coordinates } from "../types";
import { Earthquake } from "../types";
const USGS_API = "https://earthquake.usgs.gov/fdsnws/event/1/query";

export const fetch_earthquakes = async (coords: Coordinates): Promise<Earthquake> => {
  const params = new URLSearchParams({
    format: "geojson",
    minlatitude: coords.south.toString(),
    maxlatitude: coords.north.toString(),
    minlongitude: coords.west.toString(),
    maxlongitude: coords.east.toString(),
    orderby: "time",
    limit: "100",
  });

  const url = `${USGS_API}?${params}`;

  try {
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();

      if (data.features.length > 0) {
        return data;
      }

      console.log("No earthquakes in boundary, searching for nearest...");
      return await fetch_nearest_earthquake(coords);
    } else {
      throw new Error("Failed to fetch earthquakes from USGS API");
    }
  } catch (error) {
    console.log("Failed to fetch earthquakes from USGS API.");
    throw error;
  }
};

const fetch_nearest_earthquake = async (coords: Coordinates): Promise<Earthquake> => {
  const center_lat = (coords.north + coords.south) / 2;
  const center_lng = (coords.east + coords.west) / 2;

  const params = new URLSearchParams({
    format: "geojson",
    latitude: center_lat.toString(),
    longitude: center_lng.toString(),
    maxradiuskm: "1000",
    limit: "1",
  });

  const url = `${USGS_API}?${params}`;

  try {
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      console.log(`Found ${data.features.length} nearest earthquakes within 1000km`);
      return data;
    } else {
      throw new Error("Failed to fetch nearest earthquakes");
    }
  } catch (error) {
    console.log("Failed to fetch nearest earthquakes.");
    throw error;
  }
};
