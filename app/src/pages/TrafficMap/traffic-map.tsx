import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Pane, Polyline } from "react-leaflet";
import { TrafficSidebar } from "../../components/Sidebar/TrafficMapSidebar/traffic-sidebar.tsx";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-arrowheads";
import { MatrixData, TrafficData } from "./traffic-map";

export const TrafficMap = () => {
  const [error, setError] = useState<string | null>(null);
  const [selectedMap, setSelectedMap] = useState<string>("sta_siouxfalls");
  const [matrixData, setMatrixData] = useState<MatrixData | null>(null);
  const [trafficData, setTrafficData] = useState<TrafficData | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [ratioScenarios, setRatioScenarios] = useState<boolean>(false);
  const [flowScenarios, setFlowScenarios] = useState<boolean>(false);
  const [capacityScenarios, setCapacityScenarios] = useState<boolean>(false);

  useEffect(() => {
    fetch(`http://localhost:5000/data/matrix/${selectedMap}`)
      .then((response) => response.json())
      .then((data: MatrixData) => {
        setMatrixData(data);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setError("Failed to load data. Please try again later.");
      });
  }, [selectedMap]);

  useEffect(() => {
    fetch(`http://localhost:5000/data/traffic/${selectedMap}`)
      .then((response) => response.json())
      .then((data: TrafficData) => {
        setTrafficData(data);
        console.log(data);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setError("Failed to load data. Please try again later.");
      });
  }, [selectedMap]);

  const handleReset = () => {
    setError("");
    setSelectedNodeId(null);
    setRatioScenarios(false);
    setFlowScenarios(false);
    setCapacityScenarios(false);
  };

  const handleAddNodeId = (nodeId: number) => {
    setSelectedNodeId(nodeId);
  };

  const runRatioScenarios = () => {
    setSelectedNodeId(null);
    setRatioScenarios(true);
    setFlowScenarios(false);
    setCapacityScenarios(false);
  };

  const runFlowScenarios = () => {
    setSelectedNodeId(null);
    setFlowScenarios(true);
    setRatioScenarios(false);
    setCapacityScenarios(false);
  };

  const runCapacityScenarios = () => {
    setSelectedNodeId(null);
    setCapacityScenarios(true);
    setRatioScenarios(false);
    setFlowScenarios(false);
  };

  const ArrowedPolyline = ({ positions }: { positions: [number, number][][] }) => {
    const map = useMap();

    useEffect(() => {
      const [start, end] = positions[0];
      const midLat = (start[0] + end[0]) / 2;
      const midLon = (start[1] + end[1]) / 2;
      const midPoint = [midLat, midLon] as [number, number];

      const firstSegment = [start, midPoint];
      const secondSegment = [midPoint, end];

      const polyline1 = L.polyline([firstSegment], { color: "blue", weight: 2, opacity: 0.75, pane: "polylines" }).addTo(map);
      polyline1.arrowheads({ size: "10px", frequency: "endonly", fill: true, color: "blue" });

      const polyline2 = L.polyline([secondSegment], { color: "blue", weight: 2, opacity: 0.75, pane: "polylines" }).addTo(map);

      return () => {
        map.removeLayer(polyline1);
        map.removeLayer(polyline2);
      };
    }, [map, positions]);

    return null;
  };

  function parseKey(key: string): [number | null, number | null] {
    if (!key) {
      console.error("parseKey was called with an empty key.");
      return [null, null]; // Return null or a default value that your logic can handle.
    }

    const parts = key.split("-");
    if (parts.length !== 2) {
      console.error(`parseKey received a key in an unexpected format: ${key}`);
      return [null, null]; // Return null or a default value that your logic can handle.
    }

    const startId = parseInt(parts[0], 10);
    const endId = parseInt(parts[1], 10);

    if (isNaN(startId) || isNaN(endId)) {
      console.error(`parseKey received non-numeric IDs from key: ${key}`);
      return [null, null]; // Return null or a default value that your logic can handle.
    }

    return [startId, endId];
  }

  // ratio colors
  function colorRatioSiouxFalls(value: number) {
    const hue = 240;
    const saturation = 100;
    const normalizedValue = (value - 0.12762650681519946) / (1.677709070292858 - 0.12762650681519946);
    const lightness = Math.round(100 - normalizedValue * 80);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  function colorRatioAnaheim(value: number) {
    const hue = 240;
    const saturation = 100;
    const normalizedValue = (value - 0.0020611606997490923) / (1.8780740683167956 - 0.0020611606997490923);
    const lightness = Math.round(100 - normalizedValue * 80);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  function colorRatioEMA(value: number) {
    const hue = 240;
    const saturation = 100;
    const normalizedValue = (value - 0.0) / (3.6088610537124026 - 0.0);
    const lightness = Math.round(100 - normalizedValue * 80);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  // flow colors

  function colorFlowSiouxFalls(value: number) {
    const hue = 240;
    const saturation = 100;
    const minValue = 2336.99156973385;
    const maxValue = 20778.95938822101;
    const normalizedValue = (value - minValue) / (maxValue - minValue);
    const lightness = Math.round(100 - normalizedValue * 80);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  function colorFlowAnaheim(value: number) {
    const hue = 240;
    const saturation = 100;
    const minValue = 49.47501460555722;
    const maxValue = 9179.169793452049;
    const normalizedValue = (value - minValue) / (maxValue - minValue);
    const lightness = Math.round(100 - normalizedValue * 80);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  function colorFlowEMA(value: number) {
    const hue = 240;
    const saturation = 100;
    const minValue = 0.0;
    const maxValue = 11983.482682010897;
    const normalizedValue = (value - minValue) / (maxValue - minValue);
    const lightness = Math.round(100 - normalizedValue * 80);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  // capacity colors

  function colorCapacitySiouxFalls(value: number) {
    const hue = 240;
    const saturation = 100;
    const minValue = 3482.2918353127734;
    const maxValue = 46318.51293684211;
    const normalizedValue = (value - minValue) / (maxValue - minValue);
    const lightness = Math.round(100 - normalizedValue * 80);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  function colorCapacityAnaheim(value: number) {
    const hue = 240;
    const saturation = 100;
    const minValue = 659.4235006158718;
    const maxValue = 9934.27017574994;
    const normalizedValue = (value - minValue) / (maxValue - minValue);
    const lightness = Math.round(100 - normalizedValue * 80);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  function colorCapacityEMA(value: number) {
    const hue = 240;
    const saturation = 100;
    const minValue = 199.60754318254547;
    const maxValue = 7974.870302540027;
    const normalizedValue = (value - minValue) / (maxValue - minValue);
    const lightness = Math.round(100 - normalizedValue * 80);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  return (
    <div className="flex h-screen">
      <div className="w-5/6 h-full">
        <MapContainer center={[43.546, -96.7313]} zoom={12} className="h-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Pane name="polylines" style={{ zIndex: 400 }} />
          <Pane name="nodes" style={{ zIndex: 500 }} />

          {matrixData && (
            <>
              {selectedNodeId &&
                matrixData &&
                matrixData.map_nodes.ids.length > 0 &&
                matrixData.map_nodes.ids.map((id: number, index: number) => {
                  if (id !== selectedNodeId) {
                    const selectedNodeIndex = matrixData.map_nodes.ids.indexOf(selectedNodeId);
                    if (selectedNodeIndex === -1) {
                      console.error("Selected node ID not found in the list");
                      return null;
                    }
                    return (
                      <ArrowedPolyline
                        key={id}
                        positions={
                          [
                            [
                              [matrixData.map_nodes.lats[selectedNodeIndex], matrixData.map_nodes.lons[selectedNodeIndex]],
                              [matrixData.map_nodes.lats[index], matrixData.map_nodes.lons[index]],
                            ],
                          ] as [number, number][][]
                        }
                      />
                    );
                  }
                })}
              {matrixData &&
                selectedNodeId &&
                matrixData.map_nodes.ids.map((id: number, index: number) => {
                  const selectedNodeIndex = matrixData.map_nodes.ids.indexOf(selectedNodeId);
                  const demand = selectedNodeIndex !== -1 && matrixData.matrix[selectedNodeIndex] && matrixData.matrix[selectedNodeIndex][index] !== undefined ? matrixData.matrix[selectedNodeIndex][index] : 0;
                  const isCurrentNode = id === selectedNodeId;
                  const radius = isCurrentNode ? 4 : demand / 47;
                  const color = isCurrentNode ? "red" : "green";

                  return (
                    <CircleMarker key={id} center={[matrixData.map_nodes.lats[index], matrixData.map_nodes.lons[index]]} radius={radius} color={color} fillOpacity={1} pane="nodes">
                      <Popup>
                        Node ID: {id}
                        <br />
                        Latitude: {matrixData.map_nodes.lats[index]}
                        <br />
                        Longitude: {matrixData.map_nodes.lons[index]}
                        <br />
                        Demand: {demand}
                      </Popup>
                    </CircleMarker>
                  );
                })}
            </>
          )}
          {trafficData && ratioScenarios && (
            <>
              {trafficData &&
                trafficData.map_nodes.ids.map((id: number, index: number) => {
                  return (
                    <CircleMarker key={id} center={[trafficData.map_nodes.lats[index], trafficData.map_nodes.lons[index]]} radius={4} color="green" fillOpacity={1} pane="nodes">
                      <Popup>
                        Node ID: {id}
                        <br />
                        Latitude: {trafficData.map_nodes.lats[index]}
                        <br />
                        Longitude: {trafficData.map_nodes.lons[index]}
                      </Popup>
                      ;
                    </CircleMarker>
                  );
                })}
              {trafficData &&
                Object.entries(trafficData.ratio).map(([key, ratio]) => {
                  const [startId, endId] = parseKey(key);
                  if (startId === null || endId === null) {
                    return;
                  }

                  const startIndex = trafficData.map_nodes.ids.indexOf(startId);
                  const endIndex = trafficData.map_nodes.ids.indexOf(endId);

                  if (startIndex === -1 || endIndex === -1) {
                    console.error(`Invalid start or end index for IDs ${startId} and ${endId}`);
                    return null;
                  }

                  const positions: [number, number][] = [
                    [trafficData.map_nodes.lats[startIndex], trafficData.map_nodes.lons[startIndex]],
                    [trafficData.map_nodes.lats[endIndex], trafficData.map_nodes.lons[endIndex]],
                  ] as [number, number][];

                  return (
                    <Polyline
                      key={key}
                      positions={positions}
                      color={selectedMap === "sta_siouxfalls" ? colorRatioSiouxFalls(ratio) : selectedMap === "sta_anaheim" ? colorRatioAnaheim(ratio) : selectedMap === "sta_EMA" ? colorRatioEMA(ratio) : "blue"}
                    >
                      <Popup>Ratio: {ratio.toFixed(2)}</Popup>
                    </Polyline>
                  );
                })}
            </>
          )}
          {trafficData && flowScenarios && (
            <>
              {trafficData &&
                trafficData.map_nodes.ids.map((id: number, index: number) => {
                  return (
                    <CircleMarker key={id} center={[trafficData.map_nodes.lats[index], trafficData.map_nodes.lons[index]]} radius={4} color="green" fillOpacity={1} pane="nodes">
                      <Popup>
                        Node ID: {id}
                        <br />
                        Latitude: {trafficData.map_nodes.lats[index]}
                        <br />
                        Longitude: {trafficData.map_nodes.lons[index]}
                      </Popup>
                      ;
                    </CircleMarker>
                  );
                })}
              {trafficData &&
                Object.entries(trafficData.flow).map(([key, flow]) => {
                  const [startId, endId] = parseKey(key);
                  if (startId === null || endId === null) {
                    return;
                  }

                  const startIndex = trafficData.map_nodes.ids.indexOf(startId);
                  const endIndex = trafficData.map_nodes.ids.indexOf(endId);

                  if (startIndex === -1 || endIndex === -1) {
                    console.error(`Invalid start or end index for IDs ${startId} and ${endId}`);
                    return null;
                  }

                  const positions: [number, number][] = [
                    [trafficData.map_nodes.lats[startIndex], trafficData.map_nodes.lons[startIndex]],
                    [trafficData.map_nodes.lats[endIndex], trafficData.map_nodes.lons[endIndex]],
                  ] as [number, number][];

                  return (
                    <Polyline
                      key={key}
                      positions={positions}
                      color={selectedMap === "sta_siouxfalls" ? colorFlowSiouxFalls(flow) : selectedMap === "sta_anaheim" ? colorFlowAnaheim(flow) : selectedMap === "sta_EMA" ? colorFlowEMA(flow) : "blue"}
                    >
                      <Popup>Flow: {flow.toFixed(2)}</Popup>
                    </Polyline>
                  );
                })}
            </>
          )}
          {trafficData && capacityScenarios && (
            <>
              {trafficData &&
                trafficData.map_nodes.ids.map((id: number, index: number) => {
                  return (
                    <CircleMarker key={id} center={[trafficData.map_nodes.lats[index], trafficData.map_nodes.lons[index]]} radius={4} color="green" fillOpacity={1} pane="nodes">
                      <Popup>
                        Node ID: {id}
                        <br />
                        Latitude: {trafficData.map_nodes.lats[index]}
                        <br />
                        Longitude: {trafficData.map_nodes.lons[index]}
                      </Popup>
                      ;
                    </CircleMarker>
                  );
                })}
              {trafficData &&
                Object.entries(trafficData.capacity).map(([key, capacity]) => {
                  const [startId, endId] = parseKey(key);
                  if (startId === null || endId === null) {
                    return;
                  }

                  const startIndex = trafficData.map_nodes.ids.indexOf(startId);
                  const endIndex = trafficData.map_nodes.ids.indexOf(endId);

                  if (startIndex === -1 || endIndex === -1) {
                    console.error(`Invalid start or end index for IDs ${startId} and ${endId}`);
                    return null;
                  }

                  const positions: [number, number][] = [
                    [trafficData.map_nodes.lats[startIndex], trafficData.map_nodes.lons[startIndex]],
                    [trafficData.map_nodes.lats[endIndex], trafficData.map_nodes.lons[endIndex]],
                  ] as [number, number][];

                  return (
                    <Polyline
                      key={key}
                      positions={positions}
                      color={selectedMap === "sta_siouxfalls" ? colorCapacitySiouxFalls(capacity) : selectedMap === "sta_anaheim" ? colorCapacityAnaheim(capacity) : selectedMap === "sta_EMA" ? colorCapacityEMA(capacity) : "blue"}
                    >
                      <Popup>Capacity: {capacity.toFixed(2)}</Popup>
                    </Polyline>
                  );
                })}
            </>
          )}
        </MapContainer>
      </div>
      <TrafficSidebar reset={handleReset} setMap={setSelectedMap} addNodeId={handleAddNodeId} runRatioScenarios={runRatioScenarios} runFlowScenarios={runFlowScenarios} runCapacityScenarios={runCapacityScenarios} />
    </div>
  );
};
