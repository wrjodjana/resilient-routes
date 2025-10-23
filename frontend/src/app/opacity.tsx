"use client";

import { useEffect, useState } from "react";
import { MapProps } from "@/lib/types";

export default function OpacitySlider({ map }: MapProps) {
  const [opacity, set_opacity] = useState(0);
  const [overlay, set_overlay] = useState<google.maps.GroundOverlay | null>(null);

  useEffect(() => {
    if (!map) return;

    const bounds = new google.maps.LatLngBounds(new google.maps.LatLng(-85, -180), new google.maps.LatLng(85, 180));

    const ground_overlay = new google.maps.GroundOverlay("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IndoaXRlIi8+PC9zdmc+", bounds, {
      opacity: 0,
      clickable: false,
    });

    ground_overlay.setMap(map);
    set_overlay(ground_overlay);

    return () => {
      ground_overlay.setMap(null);
    };
  }, [map]);

  const handle_opacity_change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const new_opacity = parseFloat(e.target.value);
    set_opacity(new_opacity);

    if (overlay) {
      overlay.setOpacity(new_opacity);
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        bottom: "20px",
        left: "350px",
        zIndex: 1000,
      }}
    >
      <input type="range" min="0" max="1" step="0.01" value={opacity} onChange={handle_opacity_change} />
    </div>
  );
}
