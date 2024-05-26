import React, { useState } from "react";
import axios from "axios";

interface SidebarProps {
  setSelectedNodeData: (data: any) => void;
  runAllScenarios: () => void;
  runBridgeScenario: () => void;
  runRoadScenario: () => void;
  reset: () => void;
  setVisualizationLevel: (level: string) => void;
  setMap: (mapName: string) => void;
}

const Sidebar = ({ setSelectedNodeData, runAllScenarios, reset, runBridgeScenario, runRoadScenario, setVisualizationLevel, setMap }: SidebarProps) => {
  const [startPlace, setStartPlace] = useState<string>("");
  const [endPlace, setEndPlace] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [visualizationLevel, setVisualizationLevelState] = useState<string>("scenario1");
  const [selectedMap, setSelectedMap] = useState<string>("map1");

  const handleRunScenario = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    if (!startPlace || !endPlace) {
      setError("Both start and end places must be filled.");
      return;
    }
    if (startPlace === endPlace) {
      setError("Start and end place cannot be the same.");
      return;
    }

    if (parseInt(startPlace) > 38 || parseInt(startPlace) < 0 || parseInt(endPlace) > 38 || parseInt(endPlace) < 0) {
      setError("Invalid node IDs provided");
      return;
    }

    try {
      const response = await axios.get(`http://localhost:5000/data/nodes?node1=${startPlace}&node2=${endPlace}`);
      if (response.data.error) {
        setError(response.data.error);
        setSelectedNodeData(null);
      } else {
        setSelectedNodeData(response.data);
        setError("");
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
      setError("Failed to fetch data. Please check your network connection.");
      setSelectedNodeData(null);
    }
  };

  const handleReset = () => {
    reset();
    setError("");
    setStartPlace("");
    setEndPlace("");
  };

  const handleVisualizationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const level = event.target.value;
    setVisualizationLevelState(level);
    setVisualizationLevel(level);
    setSelectedMap("map1");
  };

  const handleMapChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const mapName = event.target.value;
    setSelectedMap(mapName);
    setMap(mapName);
  };

  return (
    <div className="w-1/4 p-4 shadow bg-lightBlue">
      <h2 className="text-xl font-bold mb-4 text-cyan mt-3">Graph Neural Network Visualization</h2>
      <div className="mb-4">
        <label className="block mb-2 font-bold font-figtree">Select Map</label>
        <select className="w-full px-2 py-1 border border-gray-300 rounded font-figtree" value={selectedMap} onChange={handleMapChange}>
          <option value="map1">Bay Area Map 1</option>
          <option value="map2">Bay Area Map 2</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-2 font-bold font-figtree">Select Visualization Level</label>
        <select className="w-full px-2 py-1 border border-gray-300 rounded font-figtree" value={visualizationLevel} onChange={handleVisualizationChange}>
          <option value="scenario1">Show on Both Levels</option>
          <option value="scenario2">Show on Node Level</option>
          <option value="scenario3">Show on Edge Levels</option>
        </select>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-bold mb-2 text-cyan font-figtree">Select Places</h3>
        <form onSubmit={handleRunScenario}>
          <div className="mb-2">
            <label className="block mb-1 font-bold font-figtree">Start Place</label>
            <input type="text" className="w-full px-2 py-1 border border-gray-300 rounded font-figtree" value={startPlace} onChange={(e) => setStartPlace(e.target.value)} />
          </div>
          <div className="mb-2">
            <label className="block mb-1 font-bold font-figtree">End Place</label>
            <input type="text" className="w-full px-2 py-1 border border-gray-300 rounded font-figtree" value={endPlace} onChange={(e) => setEndPlace(e.target.value)} />
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded font-figtree w-full">
            Run Scenario
          </button>
        </form>
      </div>

      {error && <div className="text-red mb-2">{error}</div>}

      <button onClick={runAllScenarios} className="mt-4 px-4 py-2 bg-green-500 text-white rounded font-figtree w-full">
        Run All Scenarios
      </button>

      <button onClick={runBridgeScenario} className="mt-4 px-4 py-2 bg-orange-500 text-white rounded font-figtree w-full">
        Run Bridge Scenarios
      </button>

      <button onClick={runRoadScenario} className="mt-4 px-4 py-2 bg-purple-500 text-white rounded font-figtree w-full">
        Run Road Scenarios
      </button>

      <button onClick={handleReset} className="mt-4 px-4 py-2 border border-gray-300 rounded font-figtree w-full">
        Reset
      </button>
    </div>
  );
};

export default Sidebar;
