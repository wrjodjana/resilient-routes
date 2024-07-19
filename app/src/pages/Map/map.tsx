import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Popup, Polyline, CircleMarker } from "react-leaflet";
import { Sidebar } from "../../components/Sidebar/MapSidebar/sidebar.tsx";
import "leaflet/dist/leaflet.css";
import AllLegend from "../../components/Legend/all-legend.tsx";
import BridgeLegend from "../../components/Legend/bridge-legend.tsx";
import SelectLegend from "../../components/Legend/select-legend.tsx";
import EarthquakeLegend from "../../components/Legend/earthquake-legend.tsx";
import { MapNode, Data, NodeData, BridgeInfo, BridgeData, EarthquakeData } from "./map";

export const BaseMap = () => {
  const [selectedNodeData, setSelectedNodeData] = useState<NodeData | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [bridgeData, setBridgeData] = useState<BridgeData | null>(null);
  const [earthquakeData, setEarthquakeData] = useState<EarthquakeData | null>(null);
  const [runAllScenarios, setRunAllScenarios] = useState<boolean>(false);
  const [runBridgeScenario, setRunBridgeScenario] = useState<boolean>(false);
  const [runEarthquakeScenario, setRunEarthquakeScenario] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMap, setSelectedMap] = useState<string>("connectivity_graph_small");
  const [selectedGNNMap, setSelectedGNNMap] = useState<string>("connectivity_gnn_small");
  const [selectedEarthquakeType, setSelectedEarthquakeType] = useState<string>("major");
  const [selectedTargetNode, setSelectedTargetNode] = useState<number>(0);

  useEffect(() => {
    if (runAllScenarios || selectedNodeData) {
      fetch(`http://localhost:5000/data/${selectedMap}`)
        .then((response) => response.json())
        .then((data: Data) => {
          setData(data);
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
          setError("Failed to load data. Please try again later.");
        });
    }
  }, [selectedMap, runAllScenarios, selectedNodeData]);

  useEffect(() => {
    if (runBridgeScenario) {
      fetch(`http://localhost:5000/data/bridges/${selectedMap}`)
        .then((response) => response.json())
        .then((data: BridgeData) => {
          setBridgeData(data);
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
          setError("Failed to load data. Please try again later.");
        });
    }
  }, [selectedMap, runBridgeScenario]);

  useEffect(() => {
    if (runEarthquakeScenario) {
      fetch(`http://localhost:5000/data/earthquake/${selectedEarthquakeType}/${selectedTargetNode}/${selectedGNNMap}`)
        .then((response) => response.json())
        .then((data: EarthquakeData) => {
          setEarthquakeData(data);
        })

        .catch((error) => {
          console.error("Error fetching data:", error);
          setError("Failed to load data. Please try again later.");
        });
    }
  }, [selectedGNNMap, selectedEarthquakeType, selectedTargetNode, runEarthquakeScenario]);

  const handleRunAllScenarios = () => {
    setRunAllScenarios(true);
  };

  const handleRunBridgeScenario = () => {
    setRunBridgeScenario(true);
  };

  const handleRunEarthquakeScenario = () => {
    setRunEarthquakeScenario(true);
  };

  const handleReset = () => {
    setSelectedNodeData(null);
    setData(null);
    setBridgeData(null);
    setEarthquakeData(null);
    setRunAllScenarios(false);
    setRunBridgeScenario(false);
    setRunEarthquakeScenario(false);
    setError("");
  };

  function getColorByValue(value: number) {
    const hue = 240;
    const saturation = 100;
    const lightness = Math.round(100 - value * 80);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  function getGrayscaleColorByValue(value: number) {
    const clampedValue = Math.max(0, Math.min(1, value));
    const grayValue = Math.round(128 * (1 - clampedValue));
    return `rgb(${grayValue}, ${grayValue}, ${grayValue})`;
  }

  console.log("selectedNodeData:", selectedNodeData);
  console.log("data:", data);
  console.log("path:", selectedNodeData?.path);

  return (
    <div className="flex h-screen">
      {error && <div className="alert alert-error">{error}</div>}
      <div className="w-5/6 h-full">
        <MapContainer center={[37.3387, -121.8853]} zoom={12} className="h-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {selectedNodeData && selectedNodeData.path && data && <Polyline positions={selectedNodeData.path.map((index) => [data.map_nodes.lats[index], data.map_nodes.lons[index]])} color="black" />}
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
              <CircleMarker center={[selectedNodeData.node2.latitude, selectedNodeData.node2.longitude]} color="red" radius={5} fillOpacity={1}>
                <Popup>
                  Node ID: {selectedNodeData.node2.node_id}
                  <br />
                  Latitude: {selectedNodeData.node2.latitude}
                  <br />
                  Longitude: {selectedNodeData.node2.longitude}
                </Popup>
              </CircleMarker>
              <SelectLegend />
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
                    pathOptions={{ color: "black" }}
                  >
                    <Popup>Edge Feature: {data.edge_feat[index]}</Popup>
                  </Polyline>
                ))}
              {data &&
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
              {bridgeData.bridges.map((bridge, index) => (
                <CircleMarker key={index} center={[bridge.latitude, bridge.longitude]} color="green" radius={5} fillOpacity={1}>
                  <Popup>
                    Bridge ID: {bridge.bridge_id}
                    <br />
                    Latitude: {bridge.latitude.toFixed(2)}
                    <br />
                    Longitude: {bridge.longitude.toFixed(2)}
                    <br />
                    Total Length: {bridge.total_length}
                    <br />
                    Year Built: {bridge.year_built}
                  </Popup>
                </CircleMarker>
              ))}
            </>
          )}
          {earthquakeData && runEarthquakeScenario && (
            <>
              {earthquakeData &&
                earthquakeData.edge_list &&
                earthquakeData.edge_list.map((edge, index) => (
                  <Polyline
                    key={index}
                    positions={[
                      [earthquakeData.map_nodes.lats[edge[0]], earthquakeData.map_nodes.lons[edge[0]]],
                      [earthquakeData.map_nodes.lats[edge[1]], earthquakeData.map_nodes.lons[edge[1]]],
                    ]}
                    pathOptions={{ color: getGrayscaleColorByValue(earthquakeData.edge_probabilities[index][0]) }}
                  >
                    <Popup>Edge Feature: {earthquakeData.edge_probabilities[index][0].toFixed(2)}</Popup>
                  </Polyline>
                ))}
              {earthquakeData.map_nodes.ids.map((id: number, index: number) => (
                <CircleMarker
                  key={id}
                  center={[earthquakeData.map_nodes.lats[index], earthquakeData.map_nodes.lons[index]]}
                  color={id === selectedTargetNode ? "red" : getColorByValue(earthquakeData.node_probabilities[index][0])}
                  radius={5}
                  fillOpacity={1}
                >
                  <Popup>
                    Node ID: {id}
                    <br />
                    Probability: {earthquakeData.node_probabilities[index][0].toFixed(2)}
                  </Popup>
                </CircleMarker>
              ))}
            </>
          )}

          {runAllScenarios && <AllLegend />}
          {runEarthquakeScenario && <EarthquakeLegend />}
          {runBridgeScenario && <BridgeLegend />}
        </MapContainer>
      </div>
      <Sidebar
        setSelectedNodeData={setSelectedNodeData}
        runAllScenarios={handleRunAllScenarios}
        reset={handleReset}
        runBridgeScenario={handleRunBridgeScenario}
        setMap={setSelectedMap}
        runEarthquakeScenario={handleRunEarthquakeScenario}
        setGNNMap={setSelectedGNNMap}
        setEarthquakeType={setSelectedEarthquakeType}
        setTargetNode={(node: string) => setSelectedTargetNode(Number(node))}
      />
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};
