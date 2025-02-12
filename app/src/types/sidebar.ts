export interface BoundingBox {
  southWest: { lat: number; lng: number };
  northEast: { lat: number; lng: number };
}

export interface NetworkNode {
  id: number;
  lat: number;
  lon: number;
  tags?: {
    [key: string]: string;
  };
}

export interface NetworkWay {
  type: "way";
  id: number;
  nodes: number[];
  tags?: {
    [key: string]: string;
  };
}

export interface SidebarProps {
  boundingBox: BoundingBox | null;
  setBoundingBox: (box: BoundingBox | null) => void;
  setNetworkNodes: (nodes: NetworkNode[]) => void;
  setNetworkWays: (ways: NetworkWay[]) => void;
  visualizationFilter: "all" | "nodes" | "links";
  setVisualizationFilter: (filter: "all" | "nodes" | "links") => void;
}
