import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
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

interface BridgeInfo {
  node1: number;
  node2: number;
  series_id: number;
  bridge_class: number;
  bridge_id: string;
  skew: number;
  num_span: number;
  max_span_length: number;
  total_length: number;
}

interface MapNode {
  ids: number[];
  lats: number[];
  lons: number[];
}

type Edge = [number, number];

interface Data {
  map_nodes: MapNode;
  edges: Edge[];
  bridges: BridgeInfo[];
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

  useEffect(() => {
    fetch("http://localhost:5000/data")
      .then((response) => response.json())
      .then((data: Data) => {
        setData(data);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  const handleRunAllScenarios = () => {
    setRunAllScenarios(true);
  };

  const handleReset = () => {
    setSelectedNodeData(null);
    setRunAllScenarios(false);
  };

  return (
    <div className="flex h-screen">
      <div className="w-5/6 h-full">
        <MapContainer center={[37.8272, -122.2913]} zoom={13} className="h-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {selectedNodeData && (
            <>
              <Marker position={[selectedNodeData.node1.latitude, selectedNodeData.node1.longitude]} icon={SmallIcon}>
                <Popup>
                  Node ID: {selectedNodeData.node1.node_id}
                  <br />
                  Latitude: {selectedNodeData.node1.latitude}
                  <br />
                  Longitude: {selectedNodeData.node1.longitude}
                </Popup>
              </Marker>
              <Marker position={[selectedNodeData.node2.latitude, selectedNodeData.node2.longitude]} icon={SmallIcon}>
                <Popup>
                  Node ID: {selectedNodeData.node2.node_id}
                  <br />
                  Latitude: {selectedNodeData.node2.latitude}
                  <br />
                  Longitude: {selectedNodeData.node2.longitude}
                </Popup>
              </Marker>
            </>
          )}
          {data && runAllScenarios && (
            <>
              {data.map_nodes.ids.map((id: number, index: number) => (
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
              {data.bridges.map((bridge, index) => (
                <Polyline
                  key={index}
                  positions={[
                    [data.map_nodes.lats[bridge.node1], data.map_nodes.lons[bridge.node1]],
                    [data.map_nodes.lats[bridge.node2], data.map_nodes.lons[bridge.node2]],
                  ]}
                  color="red"
                >
                  <Popup>
                    Bridge ID: {bridge.bridge_id}
                    <br />
                    Series ID: {bridge.series_id}
                    <br />
                    Bridge Class: {bridge.bridge_class}
                    <br />
                    Skew: {bridge.skew} degrees
                    <br />
                    Number of Spans: {bridge.num_span}
                    <br />
                    Max Span Length: {bridge.max_span_length} m
                    <br />
                    Total Length: {bridge.total_length} m
                  </Popup>
                </Polyline>
              ))}
            </>
          )}
        </MapContainer>
      </div>
      <Sidebar setSelectedNodeData={setSelectedNodeData} runAllScenarios={handleRunAllScenarios} reset={handleReset} />
    </div>
  );
};

export default BaseMap;
