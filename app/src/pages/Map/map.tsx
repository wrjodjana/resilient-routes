import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Popup, Polyline, CircleMarker, Rectangle, useMap } from "react-leaflet";
import { Sidebar, BoundingBox } from "../../components/Sidebar/MapSidebar/sidebar.tsx";
import "leaflet/dist/leaflet.css";
import AllLegend from "../../components/Legend/all-legend.tsx";
import BridgeLegend from "../../components/Legend/bridge-legend.tsx";
import SelectLegend from "../../components/Legend/select-legend.tsx";
import EarthquakeLegend from "../../components/Legend/earthquake-legend.tsx";
import { MapNode, Data, NodeData, BridgeInfo, BridgeData, EarthquakeData } from "./map";

import { API_URL } from "../../config.ts";
import "leaflet-draw/dist/leaflet.draw.css";
import * as L from "leaflet";
import "leaflet-draw";
import axios from "axios";

interface NetworkNode {
  id: number;
  lat: number;
  lon: number;
  tags?: {
    [key: string]: string;
  };
}

interface NetworkWay {
  type: "way";
  id: number;
  nodes: number[];
  tags?: {
    [key: string]: string;
  };
}

const BoundsUpdater = ({ boundingBox }: { boundingBox: BoundingBox | null }) => {
  const map = useMap();

  useEffect(() => {
    if (boundingBox) {
      const bounds = [
        [boundingBox.southWest.lat, boundingBox.southWest.lng],
        [boundingBox.northEast.lat, boundingBox.northEast.lng],
      ] as L.LatLngBoundsLiteral;
      map.fitBounds(bounds);
    }
  }, [boundingBox, map]);

  return null;
};

const DrawControl = ({ setBoundingBox }: { setBoundingBox: (box: BoundingBox | null) => void }) => {
  const map = useMap();

  useEffect(() => {
    // Store map reference globally
    (window as any).leafletMap = map;

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      draw: {
        polyline: false,
        polygon: false,
        circle: false,
        circlemarker: false,
        marker: false,
        rectangle: {
          shapeOptions: {
            color: "black",
            weight: 1,
            fillOpacity: 0,
          },
        },
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });

    // Store the draw control instance in the window object
    (window as any).drawControl = drawControl;
    (window as any).drawnItems = drawnItems;

    map.on(L.Draw.Event.CREATED, (e: any) => {
      const layer = e.layer;
      drawnItems.addLayer(layer);

      const bounds = layer.getBounds();
      setBoundingBox({
        southWest: {
          lat: bounds.getSouth(),
          lng: bounds.getWest(),
        },
        northEast: {
          lat: bounds.getNorth(),
          lng: bounds.getEast(),
        },
      });
    });

    map.on(L.Draw.Event.DELETED, () => {
      setBoundingBox(null);
    });

    return () => {
      map.removeLayer(drawnItems);
      delete (window as any).drawControl;
      delete (window as any).drawnItems;
      delete (window as any).leafletMap; // Clean up map reference
    };
  }, [map, setBoundingBox]);

  return null;
};

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
  const [boundingBox, setBoundingBox] = useState<BoundingBox | null>(null);
  const [networkNodes, setNetworkNodes] = useState<NetworkNode[]>([]);
  const [networkWays, setNetworkWays] = useState<NetworkWay[]>([]);
  const [visualizationFilter, setVisualizationFilter] = useState<"all" | "nodes" | "links">("all");

  useEffect(() => {
    if (runAllScenarios || selectedNodeData) {
      fetch(`${API_URL}/data/${selectedMap}`)
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
      fetch(`${API_URL}/data/bridges/${selectedMap}`)
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
      fetch(`${API_URL}/data/earthquake/${selectedEarthquakeType}/${selectedTargetNode}/${selectedGNNMap}`)
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

  useEffect(() => {
    if (boundingBox) {
      console.log("Bounding box updated:", boundingBox);
    }
  }, [boundingBox]);

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
    setBoundingBox(null);

    // Clear all drawn items
    const drawnItems = (window as any).drawnItems;
    if (drawnItems) {
      drawnItems.clearLayers();
    }

    // Get the map instance and remove all layers
    const map = (window as any).leafletMap;
    if (map) {
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Rectangle) {
          map.removeLayer(layer);
        }
      });
    }
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
        <MapContainer center={[40.7128, -74.006]} zoom={12} className="h-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <DrawControl setBoundingBox={setBoundingBox} />
          <BoundsUpdater boundingBox={boundingBox} />

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
          {boundingBox && (
            <Rectangle
              bounds={[
                [boundingBox.southWest.lat, boundingBox.southWest.lng],
                [boundingBox.northEast.lat, boundingBox.northEast.lng],
              ]}
              pathOptions={{
                color: "black",
                weight: 1,
                fillColor: "transparent",
                fillOpacity: 0,
              }}
            />
          )}
          {networkWays.map((way) => {
            if (visualizationFilter === "nodes") return null;

            const wayPoints = way.nodes
              .map((nodeId) => {
                const node = networkNodes.find((n) => n.id === nodeId);
                return node ? [node.lat, node.lon] : null;
              })
              .filter((point) => point !== null);

            return (
              <Polyline key={way.id} positions={wayPoints as [number, number][]} color="#FF4B4B" weight={2} opacity={0.8}>
                <Popup>
                  Way ID: {way.id}
                  <br />
                  Type: {way.tags?.highway}
                  <br />
                  Name: {way.tags?.name || "Unnamed"}
                </Popup>
              </Polyline>
            );
          })}
          {networkNodes.map((node) => {
            if (visualizationFilter === "links") return null;

            return (
              <CircleMarker key={node.id} center={[node.lat, node.lon]} radius={3} color="#1E40AF" fillOpacity={1}>
                <Popup>
                  Node ID: {node.id}
                  <br />
                  Latitude: {node.lat.toFixed(4)}
                  <br />
                  Longitude: {node.lon.toFixed(4)}
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
      <Sidebar
        boundingBox={boundingBox}
        setBoundingBox={setBoundingBox}
        setNetworkNodes={setNetworkNodes}
        setNetworkWays={setNetworkWays}
        setSelectedNodeData={setSelectedNodeData}
        runAllScenarios={handleRunAllScenarios}
        reset={handleReset}
        runBridgeScenario={handleRunBridgeScenario}
        setMap={setSelectedMap}
        runEarthquakeScenario={handleRunEarthquakeScenario}
        setGNNMap={setSelectedGNNMap}
        setEarthquakeType={setSelectedEarthquakeType}
        setTargetNode={(node: string) => setSelectedTargetNode(Number(node))}
        visualizationFilter={visualizationFilter}
        setVisualizationFilter={setVisualizationFilter}
      />
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};
