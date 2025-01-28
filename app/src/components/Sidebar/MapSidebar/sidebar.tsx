import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { SidebarProps } from "./sidebar";

import { API_URL } from "../../../config.ts";

export const Sidebar = ({ setSelectedNodeData, runAllScenarios, reset, runBridgeScenario, setMap, runEarthquakeScenario, setGNNMap, setEarthquakeType, setTargetNode }: SidebarProps) => {
  // const [startPlace, setStartPlace] = useState<string>("");
  // const [endPlace, setEndPlace] = useState<string>("");
  // const [error, setError] = useState<string>("");
  // const [selectedMap, setSelectedMap] = useState<string>("connectivity_graph_small");
  // const [currentSection, setCurrentSection] = useState<string>("preInputted");

  // Earthquake Scenario
  // const [selectedGNNMap, setSelectedGNNMap] = useState<string>("connectivity_gnn_small");
  // const [selectedTargetNode, setSelectedTargetNode] = useState<string>("");
  // const [selectedEarthquakeType, setSelectedEarthquakeType] = useState<string>("major");

  // const handleRunScenario = async (event: { preventDefault: () => void }) => {
  //   event.preventDefault();
  //   if (!startPlace || !endPlace) {
  //     setError("Both start and end places must be filled.");
  //     return;
  //   }
  //   if (startPlace === endPlace) {
  //     setError("Start and end place cannot be the same.");
  //     return;
  //   }

  //   const maxNodeId =
  //     {
  //       connectivity_graph_small: 38,
  //       connectivity_graph_middle: 83,
  //       connectivity_graph_large: 102,
  //     }[selectedMap] || 0;

  //   if (parseInt(startPlace) > maxNodeId || parseInt(startPlace) < 0 || parseInt(endPlace) > maxNodeId || parseInt(endPlace) < 0) {
  //     setError(`Invalid node IDs provided. For the selected map, node IDs should be between 0 and ${maxNodeId}.`);
  //     return;
  //   }

  //   try {
  //     const response = await axios.get(`${API_URL}/data/nodes/${selectedMap}?node1=${startPlace}&node2=${endPlace}`);
  //     if (response.data.error) {
  //       setError(response.data.error);
  //       setSelectedNodeData(null);
  //     } else {
  //       setSelectedNodeData(response.data);
  //       setError("");
  //     }
  //   } catch (err) {
  //     console.error("Failed to fetch data", err);
  //     setError("Failed to fetch data. Please check your network connection.");
  //     setSelectedNodeData(null);
  //   }
  // };

  // const handleReset = () => {
  //   reset();
  //   setError("");
  //   setStartPlace("");
  //   setEndPlace("");
  //   // setSelectedTargetNode("");
  // };
  // const handleMapChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
  //   const mapName = event.target.value;
  //   setSelectedMap(mapName);
  //   setMap(mapName);
  // };

  // const handleGNNMapChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
  //   const mapName = event.target.value;
  //   setSelectedGNNMap(mapName);
  //   setGNNMap(mapName);
  // };

  // const handleEarthquakeTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
  //   const newType = event.target.value;
  //   setSelectedEarthquakeType(newType);
  //   setEarthquakeType(newType);
  // };

  // const handleTargetNodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const newTargetNode = event.target.value;
  //   setSelectedTargetNode(newTargetNode);

  //   const maxNodeId =
  //     {
  //       connectivity_gnn_small: 38,
  //       connectivity_gnn_middle: 83,
  //       connectivity_gnn_large: 102,
  //     }[selectedGNNMap] || -1;

  //   if (!newTargetNode || (newTargetNode !== "" && (parseInt(newTargetNode) < 0 || parseInt(newTargetNode) > maxNodeId))) {
  //     setError(`Invalid target node. For the selected map, node IDs should be between 0 and ${maxNodeId}.`);
  //   } else {
  //     setError("");
  //   }

  //   setTargetNode(newTargetNode);
  // };
  return (
    <div className="w-1/4 p-4 shadow bg-white">
      <h2 className="text-xl font-bold mb-4 text-cyan mt-3">Bridge and Nodes Visualization</h2>
      <div className="mb-4">
        <h3 className="text-lg font-bold mb-2 text-cyan font-figtree">Select Menu </h3>
        <select className="w-full px-2 py-1 border border-gray-300 rounded font-figtree">
          <option>Connectivity</option>
          <option>Static Trafic Assignment</option>
        </select>
      </div>
      <div className="mb-4">
        <h3 className="text-lg font-bold mb-2 text-cyan font-figtree">Build Bounding Box </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-bold font-figtree">Min Latitude</label>
            <input type="number" className="w-full px-2 py-1 border border-gray-300 rounded font-figtree" />
          </div>
          <div>
            <label className="block mb-1 font-bold font-figtree">Max Latitude</label>
            <input type="number" className="w-full px-2 py-1 border border-gray-300 rounded font-figtree" />
          </div>
          <div>
            <label className="block mb-1 font-bold font-figtree">Min Longitude</label>
            <input type="number" className="w-full px-2 py-1 border border-gray-300 rounded font-figtree" />
          </div>
          <div>
            <label className="block mb-1 font-bold font-figtree">Max Longitude</label>
            <input type="number" className="w-full px-2 py-1 border border-gray-300 rounded font-figtree" />
          </div>
        </div>
        <div className="mt-8">
          <button className="w-48 py-3 bg-[#4B7BF5] text-white text-lg font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed">
            Fetch Network
          </button>
        </div>
      </div>
      {/* <div className="mb-4">
        <label className="block mb-1 font-bold font-figtree">Toggle Section</label>
        <input type="range" min="0" max="1" value={currentSection === "preInputted" ? 0 : 1} onChange={(e) => setCurrentSection(e.target.value === "0" ? "preInputted" : "userScenarios")} />
      </div> */}
      {/* <div className="mb-4">
        {/* <h3 className="text-lg font-bold mb-2 text-cyan font-figtree">Pre-Inputted Scenarios</h3> */}
      {/* <div className="mb-4">
          <h3 className="text-lg font-bold mb-2 text-cyan font-figtree">Select Graph Length</h3>
          <select className="w-full px-2 py-1 border border-gray-300 rounded font-figtree" value={selectedMap} onChange={handleMapChange}>
            <option value="connectivity_graph_small">Bay Area — Small</option>
            <option value="connectivity_graph_middle">Bay Area — Middle</option>
            <option value="connectivity_graph_large">Bay Area — Large</option>
          </select>
        </div> */}
      {/* <form onSubmit={handleRunScenario}>
          <div className="mb-4">
            <label className="block mb-1 font-bold font-figtree">Start Node</label>
            <input type="text" className="w-full px-2 py-1 border border-gray-300 rounded font-figtree" placeholder="Enter Start Place" value={startPlace} onChange={(e) => setStartPlace(e.target.value)} />
          </div>
          <div className="mb-2">
            <label className="block mb-1 font-bold font-figtree">End Node</label>
            <input type="text" className="w-full px-2 py-1 border border-gray-300 rounded font-figtree" placeholder="Enter End Place" value={endPlace} onChange={(e) => setEndPlace(e.target.value)} />
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded font-figtree w-full">
            Shortest Path Algorithm
          </button>
        </form>
      </div> */}{" "}
      {/*       
      //   <div className="mb-4">
      //     <h3 className="text-lg font-bold mb-2 text-cyan font-figtree">User Scenarios</h3>
      //     <div className="mb-4">
      //       <h3 className="text-lg font-bold mb-2 text-cyan font-figtree">Select Dataset</h3>
      //       <select className="w-full px-2 py-1 border border-gray-300 rounded font-figtree" value={selectedGNNMap} onChange={handleGNNMapChange}>
      //         <option value="connectivity_gnn_small">Small Graph</option>
      //         <option value="connectivity_gnn_middle">Middle Graph</option>
      //         <option value="connectivity_gnn_large">Large Graph</option>
      //       </select>
      //     </div>
      //     <div className="mb-4">
      //       <label className="block mb-2 font-bold font-figtree">Enter Target Node</label>
      //       <input className="w-full px-2 py-1 border border-gray-300 rounded font-figtree" placeholder="Enter Target Node" value={selectedTargetNode} onChange={handleTargetNodeChange} />
      //     </div>
      //     <label className="block mb-2 font-bold font-figtree">Select Earthquake Type</label>
      //     <select className="w-full px-2 py-1 border border-gray-300 rounded font-figtree" value={selectedEarthquakeType} onChange={handleEarthquakeTypeChange}>
      //       <option value="major">Major Earthquake</option>
      //       <option value="moderate">Moderate Earthquake</option>
      //       <option value="minor">Minor Earthquake</option>
      //     </select>
      //     <button className="mt-4 px-4 py-2 bg-green-500 text-white rounded font-figtree w-full" onClick={runEarthquakeScenario}>
      //       Run Scenarios
      //     </button>
      //   </div> */}
      {/* {error && <div className="text-red mb-2">{error}</div>} */}
      {/* {currentSection === "preInputted" && (
        <>
          <h3 className="text-lg font-bold mb-2 text-cyan font-figtree">Select Scenarios</h3>

          <button onClick={runAllScenarios} className="mt-4 px-4 py-2 bg-green-500 text-white rounded font-figtree w-full">
            Run All Scenarios
          </button>

          <button onClick={runBridgeScenario} className="mt-4 px-4 py-2 bg-orange-500 text-white rounded font-figtree w-full">
            Run Bridge Scenarios
          </button>
        </>
      )} */}
      {/* <button onClick={handleReset} className="mt-4 px-4 py-2 border border-gray-500 bg-gray-300 rounded font-figtree w-full">
        Reset
      </button> */}
      {/* 
      <button className="mt-4 px-4 py-2 border bg-yellow-500 text-white border-gray-300 rounded font-figtree w-full">
        <Link to="/traffic-map">Go to Traffic Map</Link>
      </button> */}
    </div>
  );
};
