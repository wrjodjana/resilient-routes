import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Popup, Polyline, CircleMarker, Rectangle, useMap } from "react-leaflet";
import { Sidebar } from "../components/sidebar.tsx";
import { BoundingBox } from "../types/sidebar.ts";
import "leaflet/dist/leaflet.css";
import { NetworkNode, NetworkWay } from "../types/map.ts";
import { API_URL } from "../config.ts";
import "leaflet-draw/dist/leaflet.draw.css";
import * as L from "leaflet";
import "leaflet-draw";
import axios from "axios";

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
  const [visualizationFilter, setVisualizationFilter] = useState<"all" | "nodes" | "links">("all");

  useEffect(() => {
    if (boundingBox) {
      console.log("Bounding box updated:", boundingBox);
    }
  }, [boundingBox]);

  const handleReset = () => {
    setError("");
    setBoundingBox(null);

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
      <div className="w-5/6 h-full">
        <MapContainer center={[40.7128, -74.006]} zoom={12} className="h-full">
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
      <Sidebar boundingBox={boundingBox} setBoundingBox={setBoundingBox} setNetworkNodes={setNetworkNodes} setNetworkWays={setNetworkWays} visualizationFilter={visualizationFilter} setVisualizationFilter={setVisualizationFilter} />
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};
