import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

interface SidebarProps {
  reset: () => void;
  setMap: (mapName: string) => void;
}

const TrafficSidebar = ({ reset, setMap }: SidebarProps) => {
  const [error, setError] = useState<string>("");
  const [selectedMap, setSelectedMap] = useState<string>("sta_siouxfalls");

  const handleReset = () => {
    reset();
    setError("");
  };

  const handleMapChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const mapName = event.target.value;
    setSelectedMap(mapName);
    setMap(mapName);
  };

  return (
    <div className="w-1/4 p-4 shadow bg-lightBlue">
      <div className="mb-4">
        <label className="block mb-2 font-bold font-figtree">Select Dataset</label>
        <select className="w-full px-2 py-1 border border-gray-300 rounded font-figtree" value={selectedMap} onChange={handleMapChange}>
          <option value="sta_siouxfalls">Sioux Falls</option>
          <option value="sta_EMA">Eastern Massachussets Network (EMA)</option>
          <option value="sta_anaheim">Anaheim</option>
        </select>
      </div>
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
