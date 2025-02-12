import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API_URL } from "../config.ts";
import L from "leaflet";
import { BoundingBox, NetworkNode, NetworkWay, SidebarProps } from "../types/sidebar.ts";

export const Sidebar = ({ boundingBox, setBoundingBox, setNetworkNodes, setNetworkWays, visualizationFilter, setVisualizationFilter }: SidebarProps) => {
  const [error, setError] = useState<string | null>(null);

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

    const drawnItems = (window as any).drawnItems;
    if (drawnItems) {
      drawnItems.clearLayers();
    }

    const map = (window as any).leafletMap;
    if (map) {
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Rectangle) {
          map.removeLayer(layer);
        }
      });
    }
  };

  useEffect(() => {
    if (boundingBox) {
      setMinLat(boundingBox.southWest.lat);
      setMaxLat(boundingBox.northEast.lat);
      setMinLng(boundingBox.southWest.lng);
      setMaxLng(boundingBox.northEast.lng);
    }
  }, [boundingBox]);

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
    </div>
  );
};
