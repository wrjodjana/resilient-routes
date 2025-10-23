"use client";

import { LegendProps } from "@/lib/types";

export default function Legend({ show }: LegendProps) {
  if (!show) return null;

  const roads = [
    { type: "Motorway", color: "#d73027" },
    { type: "Trunk", color: "#fc8d59" },
    { type: "Primary", color: "#fee090" },
    { type: "Secondary", color: "#91bfdb" },
    { type: "Tertiary", color: "#4575b4" },
    { type: "Residential", color: "#999999" },
    { type: "Unclassified", color: "#123456" },
  ];

  return (
    <div
      style={{
        position: "absolute",
        bottom: "60px",
        left: "350px",
        backgroundColor: "white",
        padding: "10px",
        borderRadius: "4px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        zIndex: 1000,
        fontSize: "12px",
      }}
    >
      <div style={{ color: "black", fontWeight: "600", marginBottom: "8px" }}>Roads</div>
      {roads.map((road) => (
        <div key={road.type} style={{ color: "black", display: "flex", alignItems: "center", marginBottom: "4px" }}>
          <div
            style={{
              width: "20px",
              height: "3px",
              backgroundColor: road.color,
              marginRight: "8px",
            }}
          />
          <span>{road.type}</span>
        </div>
      ))}
    </div>
  );
}
