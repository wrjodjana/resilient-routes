import { Coordinates } from "../types";
import { RoadElements, Roads } from "../types";

const OSM_API = "https://overpass-api.de/api/interpreter";

export const roads_query = (coords: Coordinates): string => {
  const { south, west, north, east } = coords;

  const query = `
    [out:json][timeout:25];
    (
      way["highway"~"^(motorway|motorway_link|trunk|trunk_link|primary|primary_link|secondary|secondary_link|tertiary|tertiary_link|residential|unclassified|living_street)$"]
        (${south},${west},${north},${east});
    );
    out geom;
  `;
  return query.trim();
};

export const intersections_query = (coords: Coordinates): string => {
  const { south, west, north, east } = coords;

  const query = `
    [out:json][timeout:25];
    way["highway"="motorway"]
      (${south},${west},${north},${east});
    node(w)->.nodes;
    way["highway"="motorway"](bn.nodes);
    node.nodes(if:count_tags()>0);
    out;
  `;
  return query.trim();
};

const fetch_osm_data = async (query: string): Promise<any> => {
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
      throw new Error("Failed to fetch data from OSM API");
    }
  } catch (error) {
    console.log("Failed to fetch data from OSM API.");
    throw error;
  }
};

export const fetch_roads = async (coords: Coordinates): Promise<Roads> => {
  const query = roads_query(coords);
  return fetch_osm_data(query);
};

export const fetch_intersections = async (coords: Coordinates): Promise<any> => {
  const query = intersections_query(coords);
  return fetch_osm_data(query);
};
