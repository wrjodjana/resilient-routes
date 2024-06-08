import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Pane } from "react-leaflet";
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

const TrafficMap = () => {
  const [error, setError] = useState<string | null>(null);
  const [selectedMap, setSelectedMap] = useState<string>("sta_siouxfalls");
  const [matrixData, setMatrixData] = useState<MatrixData | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);

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

  const handleReset = () => {
    setError("");
    setSelectedNodeId(null);
  };

  const handleAddNodeId = (nodeId: number) => {
    setSelectedNodeId(nodeId);
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

      const polyline1 = L.polyline([firstSegment], { color: "green", weight: 2, opacity: 0.75, pane: "polylines" }).addTo(map);
      polyline1.arrowheads({ size: "10px", frequency: "endonly", fill: true, color: "green" });

      const polyline2 = L.polyline([secondSegment], { color: "green", weight: 2, opacity: 0.75, pane: "polylines" }).addTo(map);

      return () => {
        map.removeLayer(polyline1);
        map.removeLayer(polyline2);
      };
    }, [map, positions]);

    return null;
  };

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
                  return null;
                })}
              {matrixData &&
                selectedNodeId &&
                matrixData.map_nodes.ids.map((id: number, index: number) => {
                  const selectedNodeIndex = matrixData.map_nodes.ids.indexOf(selectedNodeId);
                  const demand = selectedNodeIndex !== -1 && matrixData.matrix[selectedNodeIndex] && matrixData.matrix[selectedNodeIndex][index] !== undefined ? matrixData.matrix[selectedNodeIndex][index] : 0;
                  const isCurrentNode = id === selectedNodeId;
                  const radius = isCurrentNode ? 5 : demand / 47;
                  const color = isCurrentNode ? "red" : "blue";

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
        </MapContainer>
      </div>
      <TrafficSidebar reset={handleReset} setMap={setSelectedMap} addNodeId={handleAddNodeId} />
    </div>
  );
};

export default TrafficMap;
