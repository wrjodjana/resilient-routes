import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API_URL } from "../config.ts";
import L from "leaflet";
import { BoundingBox, NetworkNode, NetworkWay, SidebarProps, VisualizationFilter } from "../types/sidebar.ts";

export const Sidebar = ({ boundingBox, setBoundingBox, setNetworkNodes, setNetworkWays, visualizationFilter, setVisualizationFilter }: SidebarProps) => {
  const [error, setError] = useState<string | null>(null);
  const [mapOpacity, setMapOpacity] = useState<number>(1);

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
        // Get all roads
        way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|unclassified)$"]
          (${minLat},${minLng},${maxLat},${maxLng});
        // Get all bridges as nodes
        node["bridge"="yes"]
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
        const bridges = response.data.elements.filter((elem: any) => elem.type === "node" && elem.tags?.bridge === "yes");
        const ways = response.data.elements.filter((elem: any) => elem.type === "way");
        const otherNodes = response.data.elements.filter((elem: any) => elem.type === "node" && !elem.tags?.bridge);

        setNetworkNodes([...bridges, ...otherNodes]);
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

  useEffect(() => {
    const map = (window as any).leafletMap;
    if (map) {
      map.eachLayer((layer: any) => {
        if (layer instanceof L.TileLayer) {
          layer.setOpacity(mapOpacity);
        }
      });
    }
  }, [mapOpacity]);

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

  // Define road types outside of render to avoid recreating on each render
  const roadTypes = [
    { id: "motorway", label: "Motorway", color: "#e892a2" },
    { id: "trunk", label: "Trunk", color: "#f9b29c" },
    { id: "primary", label: "Primary", color: "#fcd6a4" },
    { id: "secondary", label: "Secondary", color: "#f7fabf" },
    { id: "tertiary", label: "Tertiary", color: "#ffffff" },
    { id: "residential", label: "Residential", color: "#ffffff" },
    { id: "unclassified", label: "Unclassified", color: "#ffffff" },
  ] as const;
  const handleRoadTypeChange = (roadType: keyof VisualizationFilter["roadTypes"]) => {
    setVisualizationFilter((prev: VisualizationFilter): VisualizationFilter => {
      const updatedRoadTypes = { ...prev.roadTypes };
      updatedRoadTypes[roadType] = !updatedRoadTypes[roadType];
      return {
        ...prev,
        roadTypes: updatedRoadTypes,
      };
    });
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
          <h3 className="text-lg font-bold mb-2 text-cyan font-figtree">Map Background Opacity</h3>
          <input type="range" min="0" max="1" step="0.1" value={mapOpacity} onChange={(e) => setMapOpacity(Number(e.target.value))} className="w-full" />
          <div className="text-sm text-gray-600 text-center mt-1">{Math.round(mapOpacity * 100)}%</div>
        </div>
        <div className="mb-4 mt-8">
          <h3 className="text-lg font-bold mb-2 text-cyan font-figtree">Road Types</h3>
          <div className="space-y-2">
            {roadTypes.map(({ id, label, color }) => (
              <div key={id} className="flex items-center">
                <input
                  type="checkbox"
                  id={id}
                  checked={visualizationFilter.roadTypes?.[id as keyof typeof visualizationFilter.roadTypes] ?? true}
                  onChange={() => handleRoadTypeChange(id as keyof VisualizationFilter["roadTypes"])}
                  className="mr-2"
                />
                <label htmlFor={id} className="flex items-center">
                  <div className="w-4 h-4 mr-2" style={{ backgroundColor: color, border: "1px solid #ccc" }}></div>
                  {label}
                </label>
              </div>
            ))}
          </div>
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
