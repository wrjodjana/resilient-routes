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
}
