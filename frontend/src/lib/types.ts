export interface MapProps {
  map: google.maps.Map | null;
}

export interface LegendProps {
  show: boolean;
}

export interface Coordinates {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface RoadElements {
  type: string;
  id: number;
  nodes?: number[];
  geometry?: Array<{ lat: number; lon: number }>;
  tags?: {
    highway?: string;
    name?: string;
    [key: string]: any;
  };
}

export interface Roads {
  elements: RoadElements[];
}

export interface Intersection {
  type: string;
  id: number;
  lat: number;
  lon: number;
}

export interface Bridge {
  lat: number;
  lng: number;
  location: string;
  id: string;
}

export interface EarthquakeElements {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    updated: number;
    url: string;
    detail: string;
    title: string;
  };
  geometry: {
    coordinates: [number, number, number];
  };
}

export interface Earthquake {
  features: EarthquakeElements[];
}
