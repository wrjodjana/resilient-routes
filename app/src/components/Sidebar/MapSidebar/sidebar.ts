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

export interface SidebarProps {
  setSelectedNodeData: (data: any) => void;
  runAllScenarios: () => void;
  runBridgeScenario: () => void;
  reset: () => void;
  setMap: (mapName: string) => void;
  runEarthquakeScenario: () => void;
  setGNNMap: (mapName: string) => void;
  setEarthquakeType: (type: string) => void;
  setTargetNode: (node: string) => void;
  setBoundingBox: (box: BoundingBox | null) => void;
  setNetworkNodes: (nodes: NetworkNode[]) => void;
}
