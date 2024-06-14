export interface SidebarProps {
  setSelectedNodeData: (data: any) => void;
  runAllScenarios: () => void;
  runBridgeScenario: () => void;
  reset: () => void;
  setMap: (mapName: string) => void;
}
