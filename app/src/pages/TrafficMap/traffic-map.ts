export interface MapNode {
  ids: number[];
  lats: number[];
  lons: number[];
}

export interface MatrixData {
  map_nodes: MapNode;
  matrix: number[][];
}

export interface TrafficData {
  ratio: { [key: string]: number };
  map_nodes: MapNode;
  flow: { [key: string]: number };
  capacity: { [key: string]: number };
}
