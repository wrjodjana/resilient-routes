"use client";

import { useRef, useState } from "react";
import { RectangleManager } from "@/lib/rectangle";
import { Coordinates } from "@/lib/types";
import { fetch_roads, fetch_intersections } from "@/lib/network/osm";
import { RenderRoads } from "@/lib/network/roads";
import { RenderBridges } from "@/lib/network/bridges";
import { RenderEarthquakes } from "@/lib/network/earthquakes";
import { MapProps } from "@/lib/types";
import { fetch_shakemap } from "@/lib/network/shakemap";
import Legend from "./legend";

export default function Sidebar({ map }: MapProps) {
  const rectangle_manager_ref = useRef<RectangleManager | null>(null);
  const road_renderer_ref = useRef<RenderRoads | null>(null);
  const earthquake_renderer_ref = useRef<RenderEarthquakes | null>(null);
  const bridge_renderer_ref = useRef<RenderBridges | null>(null);
  const [selected_coords, set_selected_coords] = useState<Coordinates | null>(null);

  const [show_road_legend, set_show_road_legend] = useState(false);
  const [is_drawing_mode, set_is_drawing_mode] = useState(false);
  const [is_loading, set_is_loading] = useState(false);

  const [shakemap_data, set_shakemap_data] = useState<any>(null);
  const [target_magnitude, set_target_magnitude] = useState<number | null>(null);

  const handle_select_location = async () => {
    if (!map) {
      return;
    }
    if (!rectangle_manager_ref.current) {
      const manager = new RectangleManager(map, (coords) => {
        if (coords) {
          set_selected_coords(coords);
          set_is_drawing_mode(false);
        }
      });
      await manager.initialize();
      rectangle_manager_ref.current = manager;
    }
    rectangle_manager_ref.current.enable_drawing();
    set_is_drawing_mode(true);
  };

  const display_roads = async () => {
    if (!selected_coords || !map) return;

    set_is_drawing_mode(false);
    set_is_loading(true);

    try {
      const road_data = await fetch_roads(selected_coords);
      const intersection_data = await fetch_intersections(selected_coords);

      if (!road_renderer_ref.current) {
        road_renderer_ref.current = new RenderRoads(map);
      }

      road_renderer_ref.current.draw_roads(road_data.elements);
      road_renderer_ref.current.draw_intersections(intersection_data.elements);
      set_show_road_legend(true);
    } catch (error) {
      console.error("Failed to fetch roads.");
    } finally {
      set_is_loading(false);
    }
  };

  const display_bridges = async () => {
    if (!selected_coords || !map) return;

    set_is_loading(true);

    try {
      if (!bridge_renderer_ref.current) {
        bridge_renderer_ref.current = new RenderBridges(map);
      }

      await bridge_renderer_ref.current.draw_bridges(selected_coords);
    } catch (error) {
      console.error("Failed to load bridges.");
    } finally {
      set_is_loading(false);
    }
  };

  const display_bridge_failures = async () => {
    if (!shakemap_data) {
      alert("Please fetch earthquakes first!");
      return;
    }

    const bridges = bridge_renderer_ref.current?.get_bridges_data();

    if (!bridges || bridges.length === 0) {
      alert("Please fetch bridges first!");
      return;
    }

    set_is_loading(true);

    try {
      const payload: any = { shakemap_data, bridges };

      if (target_magnitude !== null) {
        payload.target_magnitude = target_magnitude;
      }
      const failures_response = await fetch(`http://localhost:8000/api/bridge_failures`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const failures = await failures_response.json();
      console.log(failures);
    } catch (error) {
      console.error("Failed to calculate bridge failures:", error);
    } finally {
      set_is_loading(false);
    }
  };

  const display_earthquakes = async () => {
    if (!selected_coords || !map) return;

    set_is_loading(true);

    try {
      if (!earthquake_renderer_ref.current) {
        earthquake_renderer_ref.current = new RenderEarthquakes(map);
      }

      const earthquake = await earthquake_renderer_ref.current.get_earthquakes(selected_coords);
      console.log(earthquake);
      const shakemap = await fetch_shakemap(earthquake);
      console.log(shakemap);
      set_shakemap_data(shakemap);
    } catch (error) {
      console.error("Failed to load earthquakes.");
    } finally {
      set_is_loading(false);
    }
  };

  const handle_fetch_roads = () => {
    display_roads();
  };

  const handle_fetch_bridges = () => {
    display_bridges();
  };

  const handle_fetch_earthquakes = () => {
    display_earthquakes();
  };

  const handle_fetch_bridge_failures = () => {
    display_bridge_failures();
  };

  const handle_toggle_monochrome = () => {
    if (road_renderer_ref.current) {
      road_renderer_ref.current.toggle_monochrome();
    }
  };

  const handle_reset = () => {
    if (road_renderer_ref.current) {
      road_renderer_ref.current.clear_all();
    }
    if (bridge_renderer_ref.current) {
      bridge_renderer_ref.current.clear_bridges();
    }
    if (rectangle_manager_ref.current) {
      rectangle_manager_ref.current.clear_rectangle();
    }
    set_show_road_legend(false);
    set_selected_coords(null);
    set_is_drawing_mode(false);
    set_shakemap_data(null);
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "20%",
        height: "100%",
        backgroundColor: "white",
        zIndex: 10,
      }}
    >
      <button onClick={handle_select_location} style={{ backgroundColor: "white", color: "black" }}>
        Select Location
      </button>
      <button onClick={handle_fetch_roads} style={{ backgroundColor: "white", color: "black" }}>
        Fetch Roads
      </button>
      <button onClick={handle_toggle_monochrome} style={{ backgroundColor: "white", color: "black" }}>
        Toggle Monochrome
      </button>
      <button onClick={handle_fetch_bridges} style={{ backgroundColor: "white", color: "black" }}>
        Fetch Bridges
      </button>
      <button onClick={handle_fetch_earthquakes} style={{ backgroundColor: "white", color: "black" }}>
        Fetch Earthquake
      </button>
      <input
        type="number"
        value={target_magnitude || ""}
        onChange={(e) => {
          const val = e.target.value;
          set_target_magnitude(val ? parseFloat(val) : null);
        }}
        placeholder="Target Magnitude"
      />
      <button onClick={handle_fetch_bridge_failures} style={{ backgroundColor: "white", color: "black" }}>
        Fetch Bridge Failures
      </button>
      <button onClick={handle_reset} style={{ backgroundColor: "white", color: "black" }}>
        Reset
      </button>
      <Legend show={show_road_legend} />
    </div>
  );
}
