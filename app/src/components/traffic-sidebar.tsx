import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

interface SidebarProps {
  runTrafficScenario: () => void;
  reset: () => void;
}

const TrafficSidebar = ({ runTrafficScenario, reset }: SidebarProps) => {
  const [error, setError] = useState<string>("");

  const handleReset = () => {
    reset();
    setError("");
  };

  return (
    <div className="w-1/4 p-4 shadow bg-lightBlue">
      <button onClick={runTrafficScenario} className="mt-4 px-4 py-2 bg-green-500 text-white rounded font-figtree w-full">
        Run Traffic Scenarios
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
