import React from "react";
import "./App.css";
import "leaflet/dist/leaflet.css";
import { BaseMap } from "./pages/Map/map.tsx";
import { TrafficMap } from "./pages/TrafficMap/traffic-map.tsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <div className="App">
      {" "}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<BaseMap />} />
          <Route path="/traffic-map" element={<TrafficMap />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
