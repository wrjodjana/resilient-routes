import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Popup, Polyline, CircleMarker } from "react-leaflet";
import TrafficSidebar from "../components/traffic-sidebar";
import "leaflet/dist/leaflet.css";

interface TrafficNode {
  ids: number[];
  lats: number[];
  lons: number[];
}

interface TrafficData {
  map_nodes: TrafficNode;
}

const TrafficMap = () => {
  const [trafficData, setTrafficData] = useState<TrafficData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runTrafficScenario, setTrafficScenario] = useState<boolean>(false);

  useEffect(() => {
    fetch(`http://localhost:5000/data/traffic`)
      .then((response) => response.json())
      .then((data: TrafficData) => {
        setTrafficData(data);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setError("Failed to load data. Please try again later.");
      });
  }, []);

  const handleTrafficScenario = () => {
    setTrafficScenario(true);
  };

  const handleReset = () => {
    setError("");
    setTrafficScenario(false);
  };

  return (
    <div className="flex h-screen">
      <div className="w-5/6 h-full">
        <MapContainer center={[37.8272, -122.2913]} zoom={13} className="h-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {trafficData && runTrafficScenario && (
            <>
              {trafficData.map_nodes.ids.map((id: number, index: number) => (
                <CircleMarker key={id} center={[trafficData.map_nodes.lats[index], trafficData.map_nodes.lons[index]]} radius={5} fillOpacity={1}>
                  <Popup>
                    Node ID: {id}
                    <br />
                    Latitude: {trafficData.map_nodes.lats[index]}
                    <br />
                    Longitude: {trafficData.map_nodes.lons[index]}
                  </Popup>
                </CircleMarker>
              ))}
            </>
          )}
        </MapContainer>
      </div>
      <TrafficSidebar runTrafficScenario={handleTrafficScenario} reset={handleReset}></TrafficSidebar>
    </div>
  );
};

export default TrafficMap;
