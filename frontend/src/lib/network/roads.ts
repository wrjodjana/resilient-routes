import { RoadElements, Intersection } from "../types";
import { CustomPopup } from "../popup";

const ROAD_STYLES: Record<string, { color: string; weight: number; opacity: number; zIndex: number }> = {
  motorway: { color: "#d73027", weight: 5, opacity: 1, zIndex: 100 },
  motorway_link: { color: "#d73027", weight: 5, opacity: 1, zIndex: 100 },
  trunk: { color: "#fc8d59", weight: 5, opacity: 1, zIndex: 90 },
  trunk_link: { color: "#fc8d59", weight: 5, opacity: 1, zIndex: 90 },
  primary: { color: "#fee090", weight: 5, opacity: 1, zIndex: 80 },
  primary_link: { color: "#fee090", weight: 5, opacity: 1, zIndex: 80 },
  secondary: { color: "#91bfdb", weight: 5, opacity: 1, zIndex: 70 },
  secondary_link: { color: "#91bfdb", weight: 5, opacity: 1, zIndex: 70 },
  tertiary: { color: "#4575b4", weight: 5, opacity: 1, zIndex: 60 },
  tertiary_link: { color: "#4575b4", weight: 5, opacity: 1, zIndex: 60 },
  residential: { color: "#999999", weight: 5, opacity: 0.9, zIndex: 50 },
  unclassified: { color: "#666666", weight: 5, opacity: 0.9, zIndex: 45 },
  living_street: { color: "#cccccc", weight: 4, opacity: 0.8, zIndex: 40 },
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
  private intersection_markers: google.maps.Marker[] = [];
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
            <div style="line-height: 1.5;">
              <div style="font-size: 14px; font-weight: 600; margin-bottom: 4px; color: #000;">${roadName}</div>
              <div style="font-size: 12px; color: #666;">Type: ${roadType}</div>
              <div style="font-size: 12px; color: #666;">ID: ${roadId}</div>
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

  draw_intersections(intersections: Intersection[]) {
    this.clear_intersections();

    intersections.forEach((node) => {
      const marker = new google.maps.Marker({
        position: { lat: node.lat, lng: node.lon },
        map: this.map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: "#90EE90",
          fillOpacity: 1,
          strokeColor: "#000000",
          strokeWeight: 2,
        },
      });

      marker.addListener("click", () => {
        if (this.current_popup) {
          this.current_popup.setMap(null);
        }

        const content = `
          <div style="line-height: 1.5;">
            <div style="font-size: 14px; font-weight: 600; margin-bottom: 4px; color: #000;">Intersection</div>
            <div style="font-size: 12px; color: #666;">Node ID: ${node.id}</div>
          </div>
        `;

        const position = new google.maps.LatLng(node.lat, node.lon);
        this.current_popup = new CustomPopup(position, content);
        this.current_popup.setMap(this.map);
      });

      this.intersection_markers.push(marker);
    });
  }

  toggle_monochrome() {
    this.is_monochrome = !this.is_monochrome;
    if (this.roads_data.length > 0) {
      this.draw_roads(this.roads_data);
    }
  }

  clear_intersections() {
    this.intersection_markers.forEach((marker) => marker.setMap(null));
    this.intersection_markers = [];
  }

  clear_roads() {
    this.polylines.forEach((polyline) => polyline.setMap(null));
    this.polylines = [];

    if (this.current_popup) {
      this.current_popup.setMap(null);
      this.current_popup = null;
    }
  }

  clear_all() {
    this.clear_roads();
    this.clear_intersections();
  }
}
