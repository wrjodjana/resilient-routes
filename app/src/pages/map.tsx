import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const BaseMap = () => {
  const nodes = [
    { id: 1, position: [41.8786, -87.6251], name: "Chicago Loop" },
    { id: 2, position: [41.8919, -87.6051], name: "Navy Pier" },
    { id: 3, position: [41.8789, -87.6359], name: "Willis Tower" },
  ];

  return (
    <div className="w-full h-screen absolute top-0 left-0 z-0">
      <MapContainer center={[41.8781, -87.6298]} zoom={13}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors' />
        {nodes.map((node) => (
          <Marker key={node.id} position={[node.position[0], node.position[1]]} icon={greenIcon}>
            <Popup>{node.name}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default BaseMap;
