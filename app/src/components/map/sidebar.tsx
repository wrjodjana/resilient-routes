import React, { useState } from "react";
import axios from "axios";

interface SidebarProps {
  setSelectedNodeData: (data: any) => void;
  runAllScenarios: () => void;
  reset: () => void;
}

const Sidebar = ({ setSelectedNodeData, runAllScenarios, reset }: SidebarProps) => {
  const [startPlace, setStartPlace] = useState<string>("");
  const [endPlace, setEndPlace] = useState<string>("");

  const handleRunScenario = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    try {
      const response = await axios.get(`http://localhost:5000/data/nodes?node1=${startPlace}&node2=${endPlace}`);
      setSelectedNodeData(response.data);
    } catch (err) {
      console.error("Failed to fetch data", err);
      setSelectedNodeData(null);
    }
  };

  return (
    <div className="w-1/4 p-4 shadow bg-lightBlue">
      <h2 className="text-xl font-bold mb-4 text-cyan mt-3">Graph Neural Network Visualization</h2>

      <div className="mb-4">
        <label className="block mb-2 font-bold font-figtree">Select Visualization Level</label>
        <select className="w-full px-2 py-1 border border-gray-300 rounded font-figtree">
          <option value="scenario1">Show on Edge Level</option>
          <option value="scenario2">Show on Node Level</option>
          <option value="scenario3">Flood Evaluations</option>
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

      <button onClick={runAllScenarios} className="mt-4 px-4 py-2 bg-green-500 text-white rounded font-figtree w-full">
        Run All Scenarios
      </button>

      <button onClick={reset} className="px-4 py-2 border border-gray-300 rounded font-figtree w-full">
        Reset
      </button>
    </div>
  );
};

export default Sidebar;
