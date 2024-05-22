import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Popup, Polyline, CircleMarker } from "react-leaflet";
import Sidebar from "../components/sidebar";
import "leaflet/dist/leaflet.css";

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

interface BridgeData {
  map_nodes: MapNode;
  edges: number[][];
  bridges: BridgeInfo[];
}

interface RoadData {
  roads: number[][];
  map_nodes: MapNode;
}

const BaseMap = () => {
  const [selectedNodeData, setSelectedNodeData] = useState<NodeData | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [bridgeData, setBridgeData] = useState<BridgeData | null>(null);
  const [roadData, setRoadData] = useState<RoadData | null>(null);
  const [runAllScenarios, setRunAllScenarios] = useState<boolean>(false);
  const [runBridgeScenario, setRunBridgeScenario] = useState<boolean>(false);
  const [runRoadScenario, setRunRoadScenario] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [visualizationLevel, setVisualizationLevel] = useState<string>("scenario1");

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

  useEffect(() => {
    fetch("http://localhost:5000/data/bridges")
      .then((response) => response.json())
      .then((data: BridgeData) => {
        setBridgeData(data);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setError("Failed to load data. Please try again later.");
      });
  }, []);

  useEffect(() => {
    fetch("http://localhost:5000/data/roads")
      .then((response) => response.json())
      .then((data: RoadData) => {
        setRoadData(data);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setError("Failed to load data. Please try again later.");
      });
  }, []);

  const handleRunAllScenarios = () => {
    setRunAllScenarios(true);
  };

  const handleRunBridgeScenario = () => {
    setRunBridgeScenario(true);
  };

  const handleRunRoadScenario = () => {
    setRunRoadScenario(true);
  };

  const handleReset = () => {
    setSelectedNodeData(null);
    setRunAllScenarios(false);
    setRunBridgeScenario(false);
    setRunRoadScenario(false);
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
                visualizationLevel !== "scenario2" &&
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
                visualizationLevel !== "scenario3" &&
                data.map_nodes.ids.map((id: number, index: number) => (
                  <CircleMarker key={id} center={[data.map_nodes.lats[index], data.map_nodes.lons[index]]} color={id === 17 ? "red" : getColorByValue(data.node_res[index])} radius={5} fillOpacity={1}>
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
          {bridgeData && runBridgeScenario && (
            <>
              {bridgeData &&
                bridgeData.bridges &&
                visualizationLevel !== "scenario2" &&
                bridgeData.bridges.map((bridge, index) => (
                  <Polyline
                    key={index}
                    positions={[
                      [bridgeData.map_nodes.lats[bridge.node1], bridgeData.map_nodes.lons[bridge.node1]],
                      [bridgeData.map_nodes.lats[bridge.node2], bridgeData.map_nodes.lons[bridge.node2]],
                    ]}
                    color="red"
                  >
                    {" "}
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
              {bridgeData &&
                visualizationLevel !== "scenario3" &&
                bridgeData.map_nodes.ids.map((id: number, index: number) => (
                  <CircleMarker key={id} center={[bridgeData.map_nodes.lats[index], bridgeData.map_nodes.lons[index]]} radius={5} fillOpacity={1}>
                    <Popup>
                      Node ID: {id}
                      <br />
                      Latitude: {bridgeData.map_nodes.lats[index]}
                      <br />
                      Longitude: {bridgeData.map_nodes.lons[index]}
                    </Popup>
                  </CircleMarker>
                ))}
            </>
          )}

          {roadData && runRoadScenario && (
            <>
              {roadData &&
                roadData.roads &&
                visualizationLevel !== "scenario2" &&
                roadData.roads.map((road, index) => (
                  <Polyline
                    key={index}
                    positions={[
                      [roadData.map_nodes.lats[road[0]], roadData.map_nodes.lons[road[0]]],
                      [roadData.map_nodes.lats[road[1]], roadData.map_nodes.lons[road[1]]],
                    ]}
                    color="green"
                  />
                ))}
              {bridgeData &&
                visualizationLevel !== "scenario3" &&
                bridgeData.map_nodes.ids.map((id: number, index: number) => (
                  <CircleMarker key={id} center={[bridgeData.map_nodes.lats[index], bridgeData.map_nodes.lons[index]]} radius={5} fillOpacity={1}>
                    <Popup>
                      Node ID: {id}
                      <br />
                      Latitude: {bridgeData.map_nodes.lats[index]}
                      <br />
                      Longitude: {bridgeData.map_nodes.lons[index]}
                    </Popup>
                  </CircleMarker>
                ))}
            </>
          )}
        </MapContainer>
      </div>
      <Sidebar
        setSelectedNodeData={setSelectedNodeData}
        runAllScenarios={handleRunAllScenarios}
        reset={handleReset}
        runBridgeScenario={handleRunBridgeScenario}
        runRoadScenario={handleRunRoadScenario}
        setVisualizationLevel={setVisualizationLevel}
      />
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default BaseMap;
