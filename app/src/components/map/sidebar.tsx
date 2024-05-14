import React, { useState } from "react";

const Sidebar = () => {
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
        <form>
          <div className="mb-2">
            <label className="block mb-1 font-bold font-figtree">Start Place</label>
            <input type="text" className="w-full px-2 py-1 border border-gray-300 rounded font-figtree" />
          </div>
          <div className="mb-2">
            <label className="block mb-1 font-bold font-figtree">End Place</label>
            <input type="text" className="w-full px-2 py-1 border border-gray-300 rounded font-figtree" />
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded font-figtree w-full">
            Run Scenario
          </button>
        </form>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-bold mb-2 text-cyan font-figtree">Additional Options</h3>
        <div className="mb-2">
          <label className="block mb-1 font-figtree">
            <input type="checkbox" className="mr-2" />
            Show Bridges
          </label>
        </div>
        <div className="mb-2">
          <label className="block mb-1 font-figtree">
            <input type="checkbox" className="mr-2" />
            Show Highways
          </label>
        </div>
      </div>

      <button type="reset" className="px-4 py-2 border border-gray-300 rounded font-figtree w-full">
        Reset
      </button>
    </div>
  );
};

export default Sidebar;
