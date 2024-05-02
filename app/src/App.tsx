import React from "react";
import logo from "./logo.svg";
import "./App.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function App() {
  return (
    <div className="App">
      <MapContainer center={[51.505, -0.09]} zoom={13}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors' />
      </MapContainer>
    </div>
  );
}

export default App;
