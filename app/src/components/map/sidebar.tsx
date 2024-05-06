import React, { useState } from "react";

interface SidebarProps {
  onMapToggle: (isVisible: boolean) => void;
  onScenarioRun: (scenario: string, userInput: string) => void;
}

const Sidebar = ({ onMapToggle, onScenarioRun }: SidebarProps) => {
  const [isMapVisible, setIsMapVisible] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState("");
  const [userInput, setUserInput] = useState("");

  const handleMapToggle = () => {
    setIsMapVisible(!isMapVisible);
    onMapToggle(!isMapVisible);
  };

  const handleScenarioChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedScenario(event.target.value);
  };

  const handleUserInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(event.target.value);
  };

  const handleRunScenario = () => {
    onScenarioRun(selectedScenario, userInput);
  };

  return (
    <div className="w-1/4 bg-gray-100 p`-4 shadow">
      <h2 className="text-xl font-bold mb-4">Sidebar</h2>
      <div className="mb-4">
        <label className="block mb-2 font-bold">Map Visibility</label>
        <button className={`px-4 py-2 ${isMapVisible ? "bg-green-500" : "bg-red-500"} text-white rounded`} onClick={handleMapToggle}>
          {isMapVisible ? "On" : "Off"}
        </button>
      </div>
      <div className="mb-4">
        <label className="block mb-2 font-bold">Select Scenario</label>
        <select className="w-full px-2 py-1 border border-gray-300 rounded" value={selectedScenario} onChange={handleScenarioChange}>
          <option value="">Choose a scenario</option>
          <option value="scenario1">Scenario 1</option>
          <option value="scenario2">Scenario 2</option>
          <option value="scenario3">Scenario 3</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-2 font-bold">User Input</label>
        <input type="text" className="w-full px-2 py-1 border border-gray-300 rounded" value={userInput} onChange={handleUserInputChange} />
      </div>
      <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={handleRunScenario}>
        Run Scenario
      </button>
    </div>
  );
};

export default Sidebar;
