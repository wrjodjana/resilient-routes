export interface MapNode {
  ids: number[];
  lats: number[];
  lons: number[];
}

export interface Data {
  map_nodes: MapNode;
  edge_list: number[][];
  node_res: number[];
  edge_feat: number[][];
}

export interface NodeData {
  node1: {
    latitude: number;
    longitude: number;
    node_id: string;
  };
  node2: {
    latitude: number;
    longitude: number;
    node_id: string;
  };
  path?: number[];
}

export interface BridgeInfo {
  latitude: number;
  longitude: number;
  bridge_id: string;
  total_length: number;
  year_built: number;
}

export interface BridgeData {
  bridges: BridgeInfo[];
}
