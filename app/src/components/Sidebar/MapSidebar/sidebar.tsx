import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API_URL } from "../../../config.ts";
import L from "leaflet";

export interface BoundingBox {
  northEast: { lat: number; lng: number };
  southWest: { lat: number; lng: number };
}

interface NetworkNode {
  id: number;
  lat: number;
  lon: number;
  tags?: {
    [key: string]: string;
  };
}

interface NetworkWay {
  type: "way";
  id: number;
  nodes: number[];
  tags?: {
    [key: string]: string;
  };
}

interface SidebarProps {
  boundingBox: BoundingBox | null;
  setBoundingBox: (box: BoundingBox | null) => void;
  setNetworkNodes: (nodes: NetworkNode[]) => void;
  setNetworkWays: (ways: NetworkWay[]) => void;
  setSelectedNodeData: (data: any) => void;
  runAllScenarios: () => void;
  reset: () => void;
  runBridgeScenario: () => void;
  setMap: (map: string) => void;
  runEarthquakeScenario: () => void;
  setGNNMap: (map: string) => void;
  setEarthquakeType: (type: string) => void;
  setTargetNode: (node: string) => void;
  visualizationFilter: "all" | "nodes" | "links";
  setVisualizationFilter: (filter: "all" | "nodes" | "links") => void;
}

export const Sidebar = ({
  boundingBox,
  setBoundingBox,
  setNetworkNodes,
  setNetworkWays,
  setSelectedNodeData,
  runAllScenarios,
  reset,
  runBridgeScenario,
  setMap,
  runEarthquakeScenario,
  setGNNMap,
  setEarthquakeType,
  setTargetNode,
  visualizationFilter,
  setVisualizationFilter,
}: SidebarProps) => {
  // const [startPlace, setStartPlace] = useState<string>("");
  // const [endPlace, setEndPlace] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  // const [selectedMap, setSelectedMap] = useState<string>("connectivity_graph_small");
  // const [currentSection, setCurrentSection] = useState<string>("preInputted");

  // Earthquake Scenario
  // const [selectedGNNMap, setSelectedGNNMap] = useState<string>("connectivity_gnn_small");
  // const [selectedTargetNode, setSelectedTargetNode] = useState<string>("");
  // const [selectedEarthquakeType, setSelectedEarthquakeType] = useState<string>("major");

  const [minLat, setMinLat] = useState<number | "">("");
  const [maxLat, setMaxLat] = useState<number | "">("");
  const [minLng, setMinLng] = useState<number | "">("");
  const [maxLng, setMaxLng] = useState<number | "">("");

  const validateCoordinates = (): boolean => {
    if (!minLat || !maxLat || !minLng || !maxLng) {
      setError("All coordinates are required");
      return false;
    }

    if (minLat < -90 || minLat > 90 || maxLat < -90 || maxLat > 90) {
      setError("Latitude must be between -90 and 90 degrees");
      return false;
    }

    if (minLng < -180 || minLng > 180 || maxLng < -180 || maxLng > 180) {
      setError("Longitude must be between -180 and 180 degrees");
      return false;
    }

    if (minLat > maxLat) {
      setError("Minimum latitude cannot be greater than maximum latitude");
      return false;
    }

    if (minLng > maxLng) {
      setError("Minimum longitude cannot be greater than maximum longitude");
      return false;
    }

    setError(null);
    return true;
  };

  const handleFetchNetwork = async () => {
    if (!validateCoordinates()) {
      return;
    }

    const query = `
      [out:json][timeout:25];
      (
        // Get all major road types
        way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|unclassified)$"]
          (${minLat},${minLng},${maxLat},${maxLng});
      );
      out body;
      >;  // Get all nodes that are part of these ways
      out skel qt;
    `;

    try {
      const response = await axios.get("https://overpass-api.de/api/interpreter", {
        params: { data: query },
      });

      setBoundingBox({
        southWest: { lat: Number(minLat), lng: Number(minLng) },
        northEast: { lat: Number(maxLat), lng: Number(maxLng) },
      });

      if (response.data && response.data.elements) {
        const allNodes = response.data.elements.filter((elem: any) => elem.type === "node");
        const ways = response.data.elements.filter((elem: any) => elem.type === "way");

        const nodeRoadCount = new Map<number, Set<string>>();
        ways.forEach((way: any) => {
          const roadName = way.tags?.name || way.tags?.highway || way.id;
          way.nodes.forEach((nodeId: number) => {
            if (!nodeRoadCount.has(nodeId)) {
              nodeRoadCount.set(nodeId, new Set());
            }
            nodeRoadCount.get(nodeId)?.add(roadName);
          });
        });

        const isDeadEnd = (nodeId: number): boolean => {
          return ways.some((way: any) => {
            const nodes = way.nodes;
            return nodeId === nodes[0] || nodeId === nodes[nodes.length - 1];
          });
        };

        const intersectionNodes = allNodes.filter((node: any) => {
          const uniqueRoads = nodeRoadCount.get(node.id);
          if (!uniqueRoads) return false;

          return uniqueRoads.size > 1 || isDeadEnd(node.id);
        });

        setNetworkNodes(intersectionNodes);
        setNetworkWays(ways);
      }
    } catch (error) {
      console.error("Failed to fetch network data:", error);
    }
  };

  const handleReset = () => {
    setMinLat("");
    setMaxLat("");
    setMinLng("");
    setMaxLng("");

    setNetworkNodes([]);
    setNetworkWays([]);
    setBoundingBox(null);
  };

  useEffect(() => {
    if (boundingBox) {
      setMinLat(boundingBox.southWest.lat);
      setMaxLat(boundingBox.northEast.lat);
      setMinLng(boundingBox.southWest.lng);
      setMaxLng(boundingBox.northEast.lng);
    }
  }, [boundingBox]);

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

  const handleDrawRectangle = () => {
    const drawControl = (window as any).drawControl;
    const map = (window as any).leafletMap;

    if (drawControl && map) {
      const drawnItems = (window as any).drawnItems;
      if (drawnItems) {
        drawnItems.clearLayers();
      }

      const rectangleDrawHandler = new L.Draw.Rectangle(map, drawControl.options.draw.rectangle);
      rectangleDrawHandler.enable();
    }
  };

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
        <h3 className="text-lg font-bold mb-2 text-cyan font-figtree">Build Bounding Box</h3>
        <button onClick={handleDrawRectangle} className="w-full py-2 bg-[#4B7BF5] text-white text-base font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mb-4">
          Draw Box
        </button>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-bold font-figtree">Min Latitude</label>
            <input type="number" value={minLat} onChange={(e) => setMinLat(e.target.value ? Number(e.target.value) : "")} className="w-full px-2 py-1 border border-gray-300 rounded font-figtree" />
          </div>
          <div>
            <label className="block mb-1 font-bold font-figtree">Max Latitude</label>
            <input type="number" value={maxLat} onChange={(e) => setMaxLat(e.target.value ? Number(e.target.value) : "")} className="w-full px-2 py-1 border border-gray-300 rounded font-figtree" />
          </div>
          <div>
            <label className="block mb-1 font-bold font-figtree">Min Longitude</label>
            <input type="number" value={minLng} onChange={(e) => setMinLng(e.target.value ? Number(e.target.value) : "")} className="w-full px-2 py-1 border border-gray-300 rounded font-figtree" />
          </div>
          <div>
            <label className="block mb-1 font-bold font-figtree">Max Longitude</label>
            <input type="number" value={maxLng} onChange={(e) => setMaxLng(e.target.value ? Number(e.target.value) : "")} className="w-full px-2 py-1 border border-gray-300 rounded font-figtree" />
          </div>
        </div>
        {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}
        <div className="mb-4 mt-8">
          <h3 className="text-lg font-bold mb-2 text-cyan font-figtree">Visualization Filter</h3>
          <select className="w-full px-2 py-1 border border-gray-300 rounded font-figtree" value={visualizationFilter} onChange={(e) => setVisualizationFilter(e.target.value as "all" | "nodes" | "links")}>
            <option value="all">Show All</option>
            <option value="nodes">Show Nodes Only</option>
            <option value="links">Show Links Only</option>
          </select>
        </div>
        <div className="mt-8 flex flex-col gap-4">
          <button
            onClick={handleFetchNetwork}
            disabled={!minLat || !maxLat || !minLng || !maxLng}
            className="w-full py-3 bg-[#4B7BF5] text-white text-lg font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            Fetch Network
          </button>

          <button onClick={handleReset} className="w-full py-3 bg-gray-500 text-white text-lg font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
            Reset
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
