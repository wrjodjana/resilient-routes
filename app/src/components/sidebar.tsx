import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API_URL } from "../config.ts";
import L from "leaflet";
import { BoundingBox, NetworkNode, NetworkWay, SidebarProps, VisualizationFilter, BridgeData } from "../types/sidebar.ts";

export const Sidebar = ({ boundingBox, setBoundingBox, setNetworkNodes, setNetworkWays, visualizationFilter, setVisualizationFilter, setBridgeData }: SidebarProps) => {
  const [error, setError] = useState<string | null>(null);
  const [mapOpacity, setMapOpacity] = useState<number>(1);

  const [minLat, setMinLat] = useState<number | "">("");
  const [maxLat, setMaxLat] = useState<number | "">("");
  const [minLng, setMinLng] = useState<number | "">("");
  const [maxLng, setMaxLng] = useState<number | "">("");
  const [earthquakeMagnitude, setEarthquakeMagnitude] = useState<number>(6.0);
  const [seismicAnalysisData, setSeismicAnalysisData] = useState<any>(null);

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

    try {
      setBoundingBox({
        southWest: { lat: Number(minLat), lng: Number(minLng) },
        northEast: { lat: Number(maxLat), lng: Number(maxLng) },
      });

      const query = `
        [out:json][timeout:25];
        (
          way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|unclassified)$"]
            (${minLat},${minLng},${maxLat},${maxLng});
        );
        out body;
        >;
        out skel qt;
      `;

      const networkResponse = await axios.get("https://overpass-api.de/api/interpreter", {
        params: { data: query },
      });

      if (networkResponse.data && networkResponse.data.elements) {
        const ways = networkResponse.data.elements.filter((elem: any) => elem.type === "way");
        const nodes = networkResponse.data.elements.filter((elem: any) => elem.type === "node");
        setNetworkNodes(nodes);
        setNetworkWays(ways);
      }
    } catch (error) {
      console.error("Failed to fetch network data:", error);
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.detail || "Failed to fetch network data");
      } else {
        setError("Failed to fetch network data");
      }
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
    setBridgeData(null);

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

  const roadTypes = [
    { id: "motorway", label: "Motorway", color: "#d73027" },
    { id: "trunk", label: "Trunk", color: "#fc8d59" },
    { id: "primary", label: "Primary", color: "#fee090" },
    { id: "secondary", label: "Secondary", color: "#91bfdb" },
    { id: "tertiary", label: "Tertiary", color: "#4575b4" },
    { id: "residential", label: "Residential", color: "#999999" },
    { id: "unclassified", label: "Unclassified", color: "#666666" },
  ] as const;

  const handleRoadTypeChange = (roadType: keyof VisualizationFilter["roadTypes"]) => {
    setVisualizationFilter((prev) => ({
      ...prev,
      roadTypes: {
        ...prev.roadTypes,
        [roadType]: !prev.roadTypes[roadType],
      },
    }));
  };

  const handleMonochromeChange = () => {
    setVisualizationFilter((prev) => ({
      ...prev,
      isMonochrome: !prev.isMonochrome,
    }));
  };

  const viewOptions = [
    { id: "network-only", label: "Network Only", icon: "🛣️" },
    { id: "bridges-only", label: "Bridges Only", icon: "🌉" },
    { id: "network-and-bridges", label: "Network & Bridges", icon: "🗺️" },
  ] as const;

  const handleViewModeChange = (mode: VisualizationFilter["viewMode"]) => {
    setVisualizationFilter((prev) => ({
      ...prev,
      viewMode: mode,
    }));
  };

  const fetchSeismicAnalysis = async () => {
    if (!boundingBox) {
      alert("Please draw a bounding box first");
      return;
    }

    try {
      const response = await axios.get(`http://localhost:8000/data/combined-info/bridge_data`, {
        params: {
          min_lat: boundingBox.southWest.lat,
          max_lat: boundingBox.northEast.lat,
          min_lng: boundingBox.southWest.lng,
          max_lng: boundingBox.northEast.lng,
          user_magnitude: earthquakeMagnitude,
          perform_seismic_analysis: true,
        },
      });

      setSeismicAnalysisData(response.data.earthquake);

      if (response.data.bridges) {
        setBridgeData({
          bridge_coordinates: response.data.bridges,
        });
      }
    } catch (error) {
      console.error("Error fetching seismic analysis:", error);
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.detail || "Failed to fetch seismic analysis");
      } else {
        setError("Failed to fetch seismic analysis");
      }
    }
  };

  return (
    <div className="w-1/4 p-4 shadow bg-white h-screen overflow-y-auto fixed right-0 top-0 z-50">
      <h2 className="text-xl font-bold mb-4 text-cyan mt-3 flex items-center">
        <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M6 21C7.5 19.4 9 17.9673 9 16.2C9 14.4327 7.65685 13 6 13C4.34315 13 3 14.4327 3 16.2C3 17.9673 4.5 19.4 6 21ZM6 21H17.5C18.8807 21 20 19.8807 20 18.5C20 17.1193 18.8807 16 17.5 16H15M18 11C19.5 9.4 21 7.96731 21 6.2C21 4.43269 19.6569 3 18 3C16.3431 3 15 4.43269 15 6.2C15 7.96731 16.5 9.4 18 11ZM18 11H14.5C13.1193 11 12 12.1193 12 13.5C12 14.8807 13.1193 16 14.5 16H15.6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Resilient Routes
      </h2>

      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-bold mb-3 text-cyan font-figtree flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
          Select Menu
        </h3>
        <select className="w-full px-3 py-2.5 border border-gray-300 rounded-md font-figtree bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 cursor-pointer hover:border-blue-400">
          <option value="connectivity">Connectivity</option>
          <option value="static_traffic">Static Traffic Assignment</option>
        </select>
      </div>
      <div className="mb-4">
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-bold mb-3 text-cyan font-figtree flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a2 2 0 012-2h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm0 0v14h16V5H4z" />
            </svg>
            Build Bounding Box
          </h3>
          <button
            onClick={handleDrawRectangle}
            className="w-full py-2.5 mb-4 bg-[#4B7BF5] text-white text-base font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center"
          >
            Draw Box
          </button>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded-md border border-gray-200">
              <label className="block mb-1.5 font-bold text-sm text-gray-700 font-figtree">Min Latitude</label>
              <input
                type="number"
                value={minLat}
                onChange={(e) => setMinLat(e.target.value ? Number(e.target.value) : "")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md font-figtree focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
              />
            </div>
            <div className="bg-white p-3 rounded-md border border-gray-200">
              <label className="block mb-1.5 font-bold text-sm text-gray-700 font-figtree">Max Latitude</label>
              <input
                type="number"
                value={maxLat}
                onChange={(e) => setMaxLat(e.target.value ? Number(e.target.value) : "")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md font-figtree focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
              />
            </div>
            <div className="bg-white p-3 rounded-md border border-gray-200">
              <label className="block mb-1.5 font-bold text-sm text-gray-700 font-figtree">Min Longitude</label>
              <input
                type="number"
                value={minLng}
                onChange={(e) => setMinLng(e.target.value ? Number(e.target.value) : "")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md font-figtree focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
              />
            </div>
            <div className="bg-white p-3 rounded-md border border-gray-200">
              <label className="block mb-1.5 font-bold text-sm text-gray-700 font-figtree">Max Longitude</label>
              <input
                type="number"
                value={maxLng}
                onChange={(e) => setMaxLng(e.target.value ? Number(e.target.value) : "")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md font-figtree focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
              />
            </div>
          </div>
        </div>
        {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}
        <div className="mb-4 mt-8 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-cyan font-figtree flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
                />
              </svg>
              Road Types
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Monochrome</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={visualizationFilter.isMonochrome} onChange={handleMonochromeChange} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
          <div className="space-y-3">
            {roadTypes.map(({ id, label, color }) => (
              <div key={id} className="flex items-center bg-white p-2 rounded-md border border-gray-200">
                <input
                  type="checkbox"
                  id={id}
                  checked={visualizationFilter.roadTypes?.[id as keyof typeof visualizationFilter.roadTypes] ?? true}
                  onChange={() => handleRoadTypeChange(id as keyof VisualizationFilter["roadTypes"])}
                  className="w-4 h-4 mr-3 accent-[#4B7BF5] cursor-pointer"
                />
                <label htmlFor={id} className="flex items-center flex-1 cursor-pointer">
                  <div
                    className="w-5 h-5 mr-3 rounded"
                    style={{
                      backgroundColor: visualizationFilter.isMonochrome ? "#000000" : color,
                      border: "1px solid #ccc",
                    }}
                  ></div>
                  <span className="font-medium">{label}</span>
                </label>
              </div>
            ))}
          </div>
        </div>
        <div className="mb-4 mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-bold mb-3 text-cyan font-figtree flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            Map Background Opacity
          </h3>
          <div className="flex items-center gap-4">
            <input type="range" min="0" max="1" step="0.1" value={mapOpacity} onChange={(e) => setMapOpacity(Number(e.target.value))} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#4B7BF5]" />
            <div className="w-16 px-2 py-1 bg-white border border-gray-200 rounded text-sm text-center font-medium">{Math.round(mapOpacity * 100)}%</div>
          </div>
        </div>
        <div className="mb-4 mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-bold mb-3 text-cyan font-figtree flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Mode
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {viewOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleViewModeChange(option.id as VisualizationFilter["viewMode"])}
                className={`
                  p-3 rounded-lg border transition-all duration-200
                  flex flex-col items-center justify-center gap-1
                  ${visualizationFilter.viewMode === option.id ? "bg-blue-50 border-blue-500 text-blue-700 font-medium shadow-sm" : "bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50"}
                `}
              >
                <span className="text-xl">{option.icon}</span>
                <span className="text-sm whitespace-nowrap">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
        {visualizationFilter.viewMode !== "network-only" && (
          <div className="mb-4 mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-bold mb-3 text-cyan font-figtree flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Seismic Analysis
            </h3>
            <div className="bg-white p-4 rounded-md border border-gray-200">
              <label className="block mb-2 font-bold text-sm text-gray-700 font-figtree">
                Earthquake Magnitude (M<sub>w</sub>)
              </label>
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="range"
                  min="4.0"
                  max="9.0"
                  step="0.1"
                  value={earthquakeMagnitude}
                  onChange={(e) => setEarthquakeMagnitude(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#4B7BF5]"
                />
                <div className="w-16 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-sm text-center font-medium">{earthquakeMagnitude.toFixed(1)}</div>
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Minor (4.0)</span>
                  <span>Moderate (6.0)</span>
                  <span>Major (8.0+)</span>
                </div>
                <div className="h-1.5 mt-1 bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 rounded-full"></div>
              </div>

              <button
                onClick={fetchSeismicAnalysis}
                disabled={!boundingBox}
                className="w-full px-4 py-3 bg-[#4B7BF5] text-white rounded-md hover:bg-[#3D63C9] transition-colors
                  text-base font-semibold flex items-center justify-center gap-2
                  disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Run Seismic Analysis
              </button>

              {error && <div className="mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">{error}</div>}

              {seismicAnalysisData && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <h4 className="font-bold text-sm text-blue-800 mb-2">Analysis Results</h4>
                  <div className="text-sm text-blue-700">
                    <p>Earthquake Location: {seismicAnalysisData.location}</p>
                    <p>Magnitude: {seismicAnalysisData.actual_magnitude.toFixed(1)}</p>
                    <p>Depth: {seismicAnalysisData.depth.toFixed(1)} km</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="mt-8 flex flex-col gap-4">
          <button
            onClick={handleFetchNetwork}
            disabled={!minLat || !maxLat || !minLng || !maxLng}
            className="w-full py-3.5 bg-[#4B7BF5] text-white text-base font-semibold rounded-lg 
            hover:bg-blue-600 active:bg-blue-700 
            transition-colors duration-200 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
            disabled:bg-blue-200 disabled:cursor-not-allowed disabled:hover:bg-blue-200 
            shadow-sm hover:shadow-md"
          >
            Fetch Network
          </button>

          <button
            onClick={handleReset}
            className="w-full py-3.5 bg-white text-gray-700 text-base font-semibold rounded-lg 
            border border-gray-300 
            hover:bg-gray-50 active:bg-gray-100 
            transition-all duration-200 
            focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
            shadow-sm hover:shadow-md"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
