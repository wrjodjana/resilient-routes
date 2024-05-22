import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, Tooltip } from "react-leaflet";
import Sidebar from "../components/map/sidebar";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const SmallIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -8],
});

interface MapNode {
  ids: number[];
  lats: number[];
  lons: number[];
}

interface Data {
  map_nodes: MapNode;
  edge_list: number[][];
  node_res: number[];
  edge_feat: number[][];
}

interface NodeData {
  node1: {
    latitude: number;
    longitude: number;
    node_id: string;
  };
  node2: {
    latitude: number;
    longitude: number;
    node_id: string;
  };
}

const BaseMap = () => {
  const [selectedNodeData, setSelectedNodeData] = useState<NodeData | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [runAllScenarios, setRunAllScenarios] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:5000/data")
      .then((response) => response.json())
      .then((data: Data) => {
        setData(data);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setError("Failed to load data. Please try again later.");
      });
  }, []);

  const handleRunAllScenarios = () => {
    setRunAllScenarios(true);
  };

  const handleReset = () => {
    setSelectedNodeData(null);
    setRunAllScenarios(false);
    setError("");
  };

  function getColorByValue(value: number) {
    const hue = 240;
    const saturation = 100;
    const lightness = Math.round(100 - value * 80);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  return (
    <div className="flex h-screen">
      {error && <div className="alert alert-error">{error}</div>}
      <div className="w-5/6 h-full">
        <MapContainer center={[37.8272, -122.2913]} zoom={13} className="h-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {selectedNodeData && (
            <>
              <CircleMarker center={[selectedNodeData.node1.latitude, selectedNodeData.node1.longitude]} color="blue" radius={5} fillOpacity={1}>
                <Popup>
                  Node ID: {selectedNodeData.node1.node_id}
                  <br />
                  Latitude: {selectedNodeData.node1.latitude}
                  <br />
                  Longitude: {selectedNodeData.node1.longitude}
                </Popup>
              </CircleMarker>
              <CircleMarker center={[selectedNodeData.node2.latitude, selectedNodeData.node2.longitude]} color="blue" radius={5} fillOpacity={1}>
                <Popup>
                  Node ID: {selectedNodeData.node2.node_id}
                  <br />
                  Latitude: {selectedNodeData.node2.latitude}
                  <br />
                  Longitude: {selectedNodeData.node2.longitude}
                </Popup>
              </CircleMarker>
            </>
          )}
          {data && runAllScenarios && (
            <>
              {data &&
                data.edge_list &&
                data.edge_list.map((edge, index) => (
                  <Polyline
                    key={index}
                    positions={[
                      [data.map_nodes.lats[edge[0]], data.map_nodes.lons[edge[0]]],
                      [data.map_nodes.lats[edge[1]], data.map_nodes.lons[edge[1]]],
                    ]}
                    color="black"
                  >
                    <Popup>Edge Feature: {data.edge_feat[index]}</Popup>
                  </Polyline>
                ))}
              {data &&
                data.map_nodes.ids.map((id: number, index: number) => (
                  <CircleMarker key={id} center={[data.map_nodes.lats[index], data.map_nodes.lons[index]]} color={getColorByValue(data.node_res[index])} radius={5} fillOpacity={1}>
                    <Popup>
                      Node ID: {id}
                      <br />
                      Latitude: {data.map_nodes.lats[index]}
                      <br />
                      Longitude: {data.map_nodes.lons[index]}
                      <br />
                      Value: {data.node_res[index]}
                    </Popup>
                  </CircleMarker>
                ))}
            </>
          )}
        </MapContainer>
      </div>
      <Sidebar setSelectedNodeData={setSelectedNodeData} runAllScenarios={handleRunAllScenarios} reset={handleReset} />
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default BaseMap;
