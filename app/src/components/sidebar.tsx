import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

interface SidebarProps {
  setSelectedNodeData: (data: any) => void;
  runAllScenarios: () => void;
  runBridgeScenario: () => void;
  reset: () => void;
  setMap: (mapName: string) => void;
}

const Sidebar = ({ setSelectedNodeData, runAllScenarios, reset, runBridgeScenario, setMap }: SidebarProps) => {
  const [startPlace, setStartPlace] = useState<string>("");
  const [endPlace, setEndPlace] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [selectedMap, setSelectedMap] = useState<string>("connectivity_graph_small");

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

    if (parseInt(startPlace) > 102 || parseInt(startPlace) < 0 || parseInt(endPlace) > 102 || parseInt(endPlace) < 0) {
      setError("Invalid node IDs provided");
      return;
    }

    try {
      const response = await axios.get(`http://localhost:5000/data/nodes/${selectedMap}?node1=${startPlace}&node2=${endPlace}`);
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

  const handleMapChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const mapName = event.target.value;
    setSelectedMap(mapName);
    setMap(mapName);
  };

  return (
    <div className="w-1/4 p-4 shadow bg-lightBlue">
      <h2 className="text-xl font-bold mb-4 text-cyan mt-3">Graph Neural Network Visualization</h2>
      <div className="mb-4">
        <label className="block mb-2 font-bold font-figtree">Select Dataset</label>
        <select className="w-full px-2 py-1 border border-gray-300 rounded font-figtree" value={selectedMap} onChange={handleMapChange}>
          <option value="connectivity_graph_small">Small Graph</option>
          <option value="connectivity_graph_middle">Middle Graph</option>
          <option value="connectivity_graph_large">Large Graph</option>
        </select>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-bold mb-2 text-cyan font-figtree">Select Places</h3>
        <form onSubmit={handleRunScenario}>
          <div className="mb-2">
            <label className="block mb-1 font-bold font-figtree">Start Place</label>
            <input type="text" className="w-full px-2 py-1 border border-gray-300 rounded font-figtree" placeholder="Enter Start Place" value={startPlace} onChange={(e) => setStartPlace(e.target.value)} />
          </div>
          <div className="mb-2">
            <label className="block mb-1 font-bold font-figtree">End Place</label>
            <input type="text" className="w-full px-2 py-1 border border-gray-300 rounded font-figtree" placeholder="Enter End Place" value={endPlace} onChange={(e) => setEndPlace(e.target.value)} />
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

      <button onClick={handleReset} className="mt-4 px-4 py-2 border border-gray-300 rounded font-figtree w-full">
        Reset
      </button>

      <button className="mt-4 px-4 py-2 border bg-yellow-500 text-white border-gray-300 rounded font-figtree w-full">
        <Link to="/traffic-map">Go to Traffic Map</Link>
      </button>
    </div>
  );
};

export default Sidebar;
