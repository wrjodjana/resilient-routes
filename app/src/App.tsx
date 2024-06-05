import React from "react";
import "./App.css";
import "leaflet/dist/leaflet.css";
import BaseMap from "./pages/map";
import TrafficMap from "./pages/traffic-map";
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
