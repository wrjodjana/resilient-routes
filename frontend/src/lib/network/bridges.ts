import { Bridge } from "../types";
import { Coordinates } from "../types";
import { CustomPopup } from "../popup";

export class RenderBridges {
  private map: google.maps.Map;
  private markers: google.maps.Marker[] = [];
  private all_bridges: Bridge[] = [];
  private currentPopup: CustomPopup | null = null;

  constructor(map: google.maps.Map) {
    this.map = map;
  }

  async load_bridges() {
    if (this.all_bridges.length > 0) {
      return;
    }

    try {
      const response = await fetch("/bridges.json");
      this.all_bridges = await response.json();
      console.log(`Loaded ${this.all_bridges.length} bridges`);
    } catch (error) {
      console.error("Failed to load bridges:", error);
      throw error;
    }
  }

  draw_bridges(coords: Coordinates) {
    this.clear_bridges();

    const bridges_in_area = this.all_bridges.filter((bridge) => {
      return bridge.lat >= coords.south && bridge.lat <= coords.north && bridge.lng >= coords.west && bridge.lng <= coords.east;
    });

    bridges_in_area.forEach((bridge) => {
      const marker = new google.maps.Marker({
        position: { lat: bridge.lat, lng: bridge.lng },
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
            <div style="font-size: 14px; font-weight: 600; margin-bottom: 4px; color: #000;">${bridge.location}</div>
            <div style="font-size: 12px; color: #666;">ID: ${bridge.id}</div>
          </div>
        `;

        const position = new google.maps.LatLng(bridge.lat, bridge.lng);
        this.currentPopup = new CustomPopup(position, content);
        this.currentPopup.setMap(this.map);
      });

      this.markers.push(marker);
    });
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
