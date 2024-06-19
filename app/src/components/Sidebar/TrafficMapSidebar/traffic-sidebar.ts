export interface SidebarProps {
  reset: () => void;
  setMap: (mapName: string) => void;
  addNodeId: (nodeId: number) => void;
  runRatioScenarios: () => void;
  runFlowScenarios: () => void;
  runCapacityScenarios: () => void;
  setMapCenter: (center: [number, number]) => void;
  setMapZoom: (zoom: number) => void;
}
