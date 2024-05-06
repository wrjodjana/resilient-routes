import React from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import Sidebar from "../components/map/sidebar";

const BaseMap = () => {
  const handleMapToggle = (isVisible: boolean) => {
    console.log(`Map visibility: ${isVisible}`);
  };

  const handleScenarioRun = (scenario: string, userInput: string) => {
    console.log(`Running scenario: ${scenario} with user input: ${userInput}`);
  };

  return (
    <div className="flex h-screen">
      <div className="w-5/6 h-full">
        <MapContainer center={[37.8272, -122.2913]} zoom={13} className="h-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors' />
        </MapContainer>
      </div>
      <Sidebar onMapToggle={handleMapToggle} onScenarioRun={handleScenarioRun} />
    </div>
  );
};

export default BaseMap;
