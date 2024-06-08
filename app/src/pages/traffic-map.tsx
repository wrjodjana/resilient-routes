import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Pane, Polyline } from "react-leaflet";
import TrafficSidebar from "../components/traffic-sidebar";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-arrowheads";

interface MapNode {
  ids: number[];
  lats: number[];
  lons: number[];
}

interface MatrixData {
  map_nodes: MapNode;
  matrix: number[][];
}

interface TrafficData {
  ratio: { [key: string]: number };
  map_nodes: MapNode;
  flow: { [key: string]: number };
  capacity: { [key: string]: number };
}

const TrafficMap = () => {
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
    setRatioScenarios(true);
  };

  const runFlowScenarios = () => {
    setFlowScenarios(true);
  };

  const runCapacityScenarios = () => {
    setCapacityScenarios(true);
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

      const polyline1 = L.polyline([firstSegment], { color: "black", weight: 2, opacity: 0.75, pane: "polylines" }).addTo(map);
      polyline1.arrowheads({ size: "10px", frequency: "endonly", fill: true, color: "black" });

      const polyline2 = L.polyline([secondSegment], { color: "black", weight: 2, opacity: 0.75, pane: "polylines" }).addTo(map);

      return () => {
        map.removeLayer(polyline1);
        map.removeLayer(polyline2);
      };
    }, [map, positions]);

    return null;
  };

  const parseKey = (key: string): [number, number] => {
    const match = key.match(/\((\d+), (\d+)\)/);
    return [parseInt(match![1], 10), parseInt(match![2], 10)];
  };

  function getColorRatioByValue(value: number) {
    const hue = 240;
    const saturation = 100;
    const normalizedValue = (value - 0.1) / (1.7 - 0.1);
    const lightness = Math.round(100 - normalizedValue * 80);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  function getColorFlowByValue(value: number) {
    const hue = 240;
    const saturation = 100;
    const minValue = 2336.99156973385;
    const maxValue = 20778.95938822101;
    const normalizedValue = (value - minValue) / (maxValue - minValue);
    const lightness = Math.round(100 - normalizedValue * 80);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  function getColorCapacityByValue(value: number) {
    const hue = 240;
    const saturation = 100;
    const minValue = 3482.2918353127734;
    const maxValue = 45771.78635022687;
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
                    <Polyline key={key} positions={positions} color={getColorRatioByValue(ratio)}>
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
                    <Polyline key={key} positions={positions} color={getColorFlowByValue(flow)}>
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
                    <Polyline key={key} positions={positions} color={getColorCapacityByValue(capacity)}>
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

export default TrafficMap;
