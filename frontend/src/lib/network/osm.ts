import { Coordinates } from "../types";
import { RoadElements, Roads } from "../types";

const OSM_API = "https://overpass-api.de/api/interpreter";

export const roads_query = (coords: Coordinates): string => {
  const { south, west, north, east } = coords;

  const query = `
      [out:json][timeout:25];
    (
      way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|service)$"]
        (${south},${west},${north},${east});
    );
    out geom;
  `;
  return query.trim();
};

export const fetch_roads = async (coords: Coordinates): Promise<Roads> => {
  const query = roads_query(coords);

  try {
    const response = await fetch(OSM_API, {
      method: "POST",
      body: query,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      throw new Error("Failed to fetch roads from OSM API");
    }
  } catch (error) {
    console.log("Failed to fetch roads from OSM API.");
    throw error;
  }
};
