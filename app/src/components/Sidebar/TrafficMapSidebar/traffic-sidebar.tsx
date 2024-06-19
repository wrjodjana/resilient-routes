import React, { useState } from "react";
import { Link } from "react-router-dom";
import { SidebarProps } from "./traffic-sidebar";

export const TrafficSidebar = ({ reset, setMap, addNodeId, runRatioScenarios, runFlowScenarios, runCapacityScenarios, setMapCenter, setMapZoom }: SidebarProps) => {
  const [error, setError] = useState<string>("");
  const [selectedMap, setSelectedMap] = useState<string>("sta_siouxfalls");
  const [nodeId, setNodeId] = useState<number | "">("");

  const handleReset = () => {
    reset();
    setError("");
    setNodeId("");
  };

  const handleMapChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const mapName = event.target.value;
    setSelectedMap(mapName);
    setMap(mapName);

    switch (mapName) {
      case "sta_siouxfalls":
        console.log("Setting center to Sioux Falls");
        setMapCenter([43.546, -96.7313]);
        setMapZoom(12);
        break;
      case "sta_EMA":
        console.log("Setting center to Eastern Massachusetts");
        setMapCenter([42.3601, -71.0589]);
        setMapZoom(10);
        break;
      case "sta_anaheim":
        console.log("Setting center to Anaheim");
        setMapCenter([33.8366, -117.9143]);
        setMapZoom(11);
        break;
      default:
        console.log("Setting default center");
        setMapCenter([43.546, -96.7313]);
        setMapZoom(12);
    }
  };

  const handleAddNodeId = () => {
    if (nodeId !== "") {
      const nodeIdNumber = Number(nodeId);
      let isValid = false;

      switch (selectedMap) {
        case "sta_siouxfalls":
          isValid = nodeIdNumber >= 1 && nodeIdNumber <= 24;
          break;
        case "sta_EMA":
          isValid = nodeIdNumber >= 1 && nodeIdNumber <= 74;
          break;
        case "sta_anaheim":
          isValid = nodeIdNumber >= 1 && nodeIdNumber <= 416;
          break;
        default:
          isValid = false;
      }

      if (isValid) {
        addNodeId(nodeIdNumber);
        setError("");
      } else {
        setError(`Invalid Node IDs provided`);
      }
    } else {
      setError("Node ID cannot be empty");
    }
  };

  return (
    <div className="w-1/4 p-4 shadow bg-lightBlue">
      <h2 className="text-xl font-bold mb-4 text-cyan mt-3">Traffic Visualization</h2>
      <div className="mb-4">
        <label className="block mb-2 font-bold font-figtree">Select Dataset</label>
        <select className="w-full px-2 py-1 border border-gray-300 rounded font-figtree" value={selectedMap} onChange={handleMapChange}>
          <option value="sta_siouxfalls">Sioux Falls</option>
          <option value="sta_EMA">Eastern Massachussets Network</option>
          <option value="sta_anaheim">Anaheim</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-2 font-bold font-figtree">Enter Node ID</label>
        <input value={nodeId} onChange={(e) => setNodeId(Number(e.target.value))} className="w-full px-2 py-1 border border-gray-300 rounded font-figtree" placeholder="Enter Node ID" />
        <button onClick={handleAddNodeId} className="mt-2 px-4 py-2 border bg-blue-500 text-white border-gray-300 rounded font-figtree w-full">
          Run Origin-Destination Demand Scenarios
        </button>
      </div>
      {error && <div className="text-red mb-2">{error}</div>}
      <button onClick={runRatioScenarios} className="mt-4 px-4 py-2 border bg-green-500 text-white border-gray-300 rounded font-figtree w-full">
        Run Ratio Scenarios
      </button>

      <button onClick={runFlowScenarios} className="mt-4 px-4 py-2 border bg-orange-500 text-white border-gray-300 rounded font-figtree w-full">
        Run Flow Scenarios
      </button>

      <button onClick={runCapacityScenarios} className="mt-4 px-4 py-2 border bg-purple-500 text-white border-gray-300 rounded font-figtree w-full">
        Run Capacity Scenarios
      </button>

      <button onClick={handleReset} className="mt-4 px-4 py-2 border border-gray-300 rounded font-figtree w-full">
        Reset
      </button>
      <button className="mt-4 px-4 py-2 border bg-yellow-500 text-white border-gray-300 rounded font-figtree w-full">
        <Link to="/">Go to Bridges Map</Link>
      </button>
    </div>
  );
};

export default TrafficSidebar;
