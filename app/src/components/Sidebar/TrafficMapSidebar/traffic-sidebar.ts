export interface SidebarProps {
  reset: () => void;

  // regular map stuff
  setMap: (mapName: string) => void;
  addNodeId: (nodeId: number) => void;
  runRatioScenarios: () => void;
  runFlowScenarios: () => void;
  runCapacityScenarios: () => void;
  setMapCenter: (center: [number, number]) => void;
  setMapZoom: (zoom: number) => void;

  // gnn stuff
  setGNNMap: (mapName: string) => void;
  setEarthquakeType: (type: string) => void;
  runGNNRatioScenarios: () => void;
  runGNNFlowScenarios: () => void;
}
