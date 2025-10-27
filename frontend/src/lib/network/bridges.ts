import { Coordinates } from "../types";
import { CustomPopup } from "../popup";

const PYTHON_API = "http://localhost:8000";

export class RenderBridges {
  private map: google.maps.Map;
  private markers: google.maps.Marker[] = [];
  private bridges_data: any[] = [];
  private currentPopup: CustomPopup | null = null;

  constructor(map: google.maps.Map) {
    this.map = map;
  }

  async draw_bridges(coords: Coordinates) {
    this.clear_bridges();

    try {
      const response = await fetch(`${PYTHON_API}/api/bridges`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(coords),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch bridges from Python API");
      }

      const bridges = await response.json();

      this.bridges_data = bridges;

      bridges.forEach((bridge: any) => {
        const marker = new google.maps.Marker({
          position: { lat: bridge.LATITUDE, lng: bridge.LONGITUDE },
          map: this.map,
          icon: {
            path: "M 0,-5 L 5,0 L 0,5 L -5,0 Z",
            strokeColor: "#000000",
            strokeWeight: 2,
            fillColor: "#964B00",
            fillOpacity: 1,
            scale: 2,
          },
        });

        marker.addListener("click", () => {
          if (this.currentPopup) {
            this.currentPopup.setMap(null);
          }

          const content = `
            <div style="line-height: 1.5;">
              <div style="font-size: 14px; font-weight: 600; margin-bottom: 4px; color: #000;">${bridge.LOCATION_009 || bridge.name || "Bridge"}</div>
              <div style="font-size: 12px; color: #666;">ID: ${bridge.id}</div>
            </div>
          `;

          const position = new google.maps.LatLng(bridge.LATITUDE, bridge.LONGITUDE);
          this.currentPopup = new CustomPopup(position, content);
          this.currentPopup.setMap(this.map);
        });

        this.markers.push(marker);
      });
    } catch (error) {
      console.error("Failed to load bridges:", error);
      throw error;
    }
  }

  get_bridges_data() {
    return this.bridges_data;
  }

  clear_bridges() {
    this.markers.forEach((marker) => marker.setMap(null));
    this.markers = [];

    if (this.currentPopup) {
      this.currentPopup.setMap(null);
      this.currentPopup = null;
    }
  }
}
