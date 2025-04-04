import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Popup, Polyline, CircleMarker, Rectangle, useMap, Marker, Tooltip } from "react-leaflet";
import { Sidebar } from "../components/sidebar.tsx";
import { BoundingBox, VisualizationFilter } from "../types/sidebar.ts";
import "leaflet/dist/leaflet.css";
import { NetworkNode, NetworkWay } from "../types/map.ts";
import { API_URL } from "../config.ts";
import "leaflet-draw/dist/leaflet.draw.css";
import * as L from "leaflet";
import "leaflet-draw";
import axios from "axios";

interface BridgeCoordinate {
  latitude: number;
  longitude: number;
  name: string;
}

interface BridgeData {
  bridge_coordinates: BridgeCoordinate[];
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
      delete (window as any).leafletMap;
    };
  }, [map, setBoundingBox]);

  return null;
};

export const BaseMap = () => {
  const [error, setError] = useState<string | null>(null);
  const [boundingBox, setBoundingBox] = useState<BoundingBox | null>(null);
  const [networkNodes, setNetworkNodes] = useState<NetworkNode[]>([]);
  const [networkWays, setNetworkWays] = useState<NetworkWay[]>([]);
  const [visualizationFilter, setVisualizationFilter] = useState<VisualizationFilter>({
    showWays: true,
    isMonochrome: false,
    roadTypes: {
      motorway: true,
      trunk: true,
      primary: true,
      secondary: true,
      tertiary: true,
      residential: true,
      unclassified: true,
    },
    viewMode: "network-and-bridges",
  });
  const [bridgeData, setBridgeData] = useState<BridgeData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (boundingBox) {
        try {
          // Fetch bridge data
          const bridgeResponse = await axios.get("http://localhost:8000/data/bridge-info/bridge_data", {
            params: {
              min_lat: boundingBox.southWest.lat,
              max_lat: boundingBox.northEast.lat,
              min_lng: boundingBox.southWest.lng,
              max_lng: boundingBox.northEast.lng,
            },
          });
          setBridgeData(bridgeResponse.data);

          // Fetch network data
          const query = `
            [out:json][timeout:25];
            (
              way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|unclassified)$"]
                (${boundingBox.southWest.lat},${boundingBox.southWest.lng},${boundingBox.northEast.lat},${boundingBox.northEast.lng});
            );
            out body;
            >;
            out skel qt;
          `;

          const networkResponse = await axios.get("https://overpass-api.de/api/interpreter", {
            params: { data: query },
          });

          if (networkResponse.data && networkResponse.data.elements) {
            const ways = networkResponse.data.elements.filter((elem: any) => elem.type === "way");
            const nodes = networkResponse.data.elements.filter((elem: any) => elem.type === "node");
            setNetworkNodes(nodes);
            setNetworkWays(ways);
          }
        } catch (error) {
          if (axios.isAxiosError(error) && error.response) {
            // Only set error for non-empty bridge data errors
            if (error.response.status !== 400 || error.response.data.detail !== "No valid coordinates found in the dataset") {
              console.error("Data fetch error:", error.response.data.detail);
              setError(error.response.data.detail);
            }
          } else {
            console.error("Failed to fetch data:", error);
            setError("Failed to fetch data");
          }
        }
      }
    };

    fetchData();
  }, [boundingBox]);

  const handleReset = () => {
    setError("");
    setBoundingBox(null);
    setBridgeData(null);

    const drawnItems = (window as any).drawnItems;
    if (drawnItems) {
      drawnItems.clearLayers();
    }

    const map = (window as any).leafletMap;
    if (map) {
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Rectangle) {
          map.removeLayer(layer);
        }
      });
    }
  };

  return (
    <div className="flex h-screen">
      {error && <div className="alert alert-error">{error}</div>}
      <div className="w-3/4 h-full">
        <MapContainer center={[40.7128, -74.006]} zoom={12} className="h-full w-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <DrawControl setBoundingBox={setBoundingBox} />
          <BoundsUpdater boundingBox={boundingBox} />

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
          {(visualizationFilter.viewMode === "network-only" || visualizationFilter.viewMode === "network-and-bridges") &&
            networkWays.map((way) => {
              if (!visualizationFilter.showWays) return null;
              if (!way.tags?.highway) return null;
              if (!visualizationFilter.roadTypes[way.tags.highway as keyof typeof visualizationFilter.roadTypes]) return null;

              const wayPoints = way.nodes
                .map((nodeId) => {
                  const node = networkNodes.find((n) => n.id === nodeId);
                  return node ? [node.lat, node.lon] : null;
                })
                .filter((point) => point !== null);

              const roadColors = {
                motorway: "#d73027",
                trunk: "#fc8d59",
                primary: "#fee090",
                secondary: "#91bfdb",
                tertiary: "#4575b4",
                residential: "#999999",
                unclassified: "#666666",
              };

              const roadColor = visualizationFilter.isMonochrome ? "#000000" : roadColors[way.tags.highway as keyof typeof roadColors] || "#FF4B4B";

              return (
                <Polyline key={way.id} positions={wayPoints as [number, number][]} color={roadColor} weight={4} opacity={1}>
                  <Popup>
                    Link ID: {way.id}
                    <br />
                    Type: {way.tags?.highway}
                    <br />
                    Name: {way.tags?.name || "Unnamed"}
                  </Popup>
                </Polyline>
              );
            })}
          {(visualizationFilter.viewMode === "bridges-only" || visualizationFilter.viewMode === "network-and-bridges") &&
            bridgeData?.bridge_coordinates.map((bridge, index) => (
              <CircleMarker
                key={index}
                center={[bridge.latitude, bridge.longitude]}
                radius={10}
                pathOptions={{
                  color: "#006400",
                  fillColor: "#006400",
                  fillOpacity: 1,
                  weight: 1,
                }}
              >
                <Popup>
                  Bridge ID: {bridge.name}
                  <br />
                  Latitude: {bridge.latitude.toFixed(6)}
                  <br />
                  Longitude: {bridge.longitude.toFixed(6)}
                </Popup>
              </CircleMarker>
            ))}
        </MapContainer>
      </div>
      <Sidebar
        boundingBox={boundingBox}
        setBoundingBox={setBoundingBox}
        setNetworkNodes={setNetworkNodes}
        setNetworkWays={setNetworkWays}
        visualizationFilter={visualizationFilter}
        setVisualizationFilter={setVisualizationFilter}
        setBridgeData={setBridgeData}
      />
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};
