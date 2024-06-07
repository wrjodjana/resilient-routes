import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import TrafficSidebar from "../components/traffic-sidebar";
import "leaflet/dist/leaflet.css";

const TrafficMap = () => {
  const [error, setError] = useState<string | null>(null);
  const [selectedMap, setSelectedMap] = useState<string>("sta_siouxfalls");

  const handleReset = () => {
    setError("");
  };

  return (
    <div className="flex h-screen">
      <div className="w-5/6 h-full">
        <MapContainer center={[43.546, -96.7313]} zoom={12} className="h-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        </MapContainer>
      </div>
      <TrafficSidebar reset={handleReset} setMap={setSelectedMap} />
    </div>
  );
};

export default TrafficMap;
