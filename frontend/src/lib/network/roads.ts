import { RoadElements } from "../types";
import { CustomPopup } from "../popup";

const ROAD_STYLES: Record<string, { color: string; weight: number; opacity: number; zIndex: number }> = {
  motorway: { color: "#d73027", weight: 5, opacity: 1, zIndex: 100 },
  trunk: { color: "#fc8d59", weight: 5, opacity: 1, zIndex: 90 },
  primary: { color: "#fee090", weight: 5, opacity: 1, zIndex: 80 },
  secondary: { color: "#91bfdb", weight: 5, opacity: 1, zIndex: 70 },
  tertiary: { color: "#4575b4", weight: 5, opacity: 1, zIndex: 60 },
  residential: { color: "#999999", weight: 5, opacity: 0.9, zIndex: 50 },
  unclassified: { color: "#123456", weight: 5, opacity: 0.9, zIndex: 45 },
};

const DEFAULT_STYLE = {
  color: "#999999",
  weight: 2,
  opacity: 0.5,
  zIndex: 30,
};

export class RenderRoads {
  private map: google.maps.Map;
  private polylines: google.maps.Polyline[] = [];
  private current_popup: CustomPopup | null = null;
  private roads_data: RoadElements[] = [];
  private is_monochrome: boolean = false;

  constructor(map: google.maps.Map) {
    this.map = map;
  }

  draw_roads(roads: RoadElements[]) {
    this.roads_data = roads;
    this.clear_roads();

    roads.forEach((road) => {
      const highway_type = road.tags?.highway;

      if (highway_type && road.geometry && road.geometry.length > 0) {
        const style = ROAD_STYLES[highway_type] || DEFAULT_STYLE;

        const color = this.is_monochrome ? "#666666" : style.color;

        const path = road.geometry.map((point) => ({
          lat: point.lat,
          lng: point.lon,
        }));

        const polyline = new google.maps.Polyline({
          path: path,
          geodesic: true,
          strokeColor: color,
          strokeOpacity: style.opacity,
          strokeWeight: style.weight,
          zIndex: style.zIndex,
          clickable: true,
          map: this.map,
        });

        google.maps.event.addListener(polyline, "click", (event: google.maps.MapMouseEvent) => {
          if (this.current_popup) {
            this.current_popup.setMap(null);
          }

          const roadName = road.tags?.name || "Unnamed Road";
          const roadType = highway_type;
          const roadId = road.id;

          const content = `
            <div style="line-height: 1.6;">
              <strong style="font-size: 14px;">${roadName}</strong><br>
              <span style="font-size: 12px; color: #666;">Type: ${roadType}</span><br>
              <span style="font-size: 12px; color: #666;">ID: ${roadId}</span>
            </div>
          `;

          if (event.latLng) {
            this.current_popup = new CustomPopup(event.latLng, content);
            this.current_popup.setMap(this.map);
          }
        });

        this.polylines.push(polyline);
      }
    });
  }

  toggle_monochrome() {
    this.is_monochrome = !this.is_monochrome;
    if (this.roads_data.length > 0) {
      this.draw_roads(this.roads_data);
    }
  }

  clear_roads() {
    this.polylines.forEach((polyline) => polyline.setMap(null));
    this.polylines = [];

    if (this.current_popup) {
      this.current_popup.setMap(null);
      this.current_popup = null;
    }
  }
}
