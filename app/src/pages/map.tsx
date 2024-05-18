import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import Sidebar from "../components/map/sidebar";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

interface MapNode {
  ids: number[];
  lats: number[];
  lons: number[];
}

type Edge = [number, number]; // Represents a pair of indices

interface Data {
  map_nodes: MapNode;
  edges: Edge[];
}

const SmallIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -8],
});

const BaseMap = () => {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    fetch("http://localhost:5000/data")
      .then((response) => response.json())
      .then((data: Data) => {
        setData(data);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  return (
    <div className="flex h-screen">
      <div className="w-5/6 h-full">
        <MapContainer center={[37.8272, -122.2913]} zoom={13} className="h-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {data &&
            data.map_nodes &&
            data.map_nodes.ids.map((id: number, index: number) => (
              <Marker key={id} position={[data.map_nodes.lats[index], data.map_nodes.lons[index]]} icon={SmallIcon}>
                <Popup>
                  Node ID: {id}
                  <br />
                  Latitude: {data.map_nodes.lats[index]}
                  <br />
                  Longitude: {data.map_nodes.lons[index]}
                </Popup>
              </Marker>
            ))}
          {data &&
            data.edges &&
            data.edges.map((edge, index) => (
              <Polyline
                key={index}
                positions={[
                  [data.map_nodes.lats[edge[0]], data.map_nodes.lons[edge[0]]],
                  [data.map_nodes.lats[edge[1]], data.map_nodes.lons[edge[1]]],
                ]}
                color="blue"
              />
            ))}
        </MapContainer>
      </div>
      <Sidebar />
    </div>
  );
};

export default BaseMap;
