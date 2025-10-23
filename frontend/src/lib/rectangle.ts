import { Coordinates } from "./types";

export class RectangleManager {
  private map: google.maps.Map;
  private drawing_manager: google.maps.drawing.DrawingManager | null = null;
  private current_rectangle: google.maps.Rectangle | null = null;
  private on_coordinates_change: (coords: Coordinates | null) => void;

  constructor(map: google.maps.Map, on_coordinates_change: (coords: Coordinates | null) => void) {
    this.map = map;
    this.on_coordinates_change = on_coordinates_change;
  }

  async initialize() {
    const { DrawingManager } = (await google.maps.importLibrary("drawing")) as google.maps.DrawingLibrary;

    this.drawing_manager = new DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.RECTANGLE,
      drawingControl: false,
      rectangleOptions: {
        fillColor: "#FFFFFF",
        fillOpacity: 0,
        strokeWeight: 2,
        strokeColor: "#1976D2",
        clickable: false,
        editable: true,
        zIndex: 1,
      },
    });

    google.maps.event.addListener(this.drawing_manager, "rectanglecomplete", (rectangle: google.maps.Rectangle) => {
      this.handle_rectangle_complete(rectangle);
    });
  }

  private handle_rectangle_complete(rectangle: google.maps.Rectangle) {
    if (this.current_rectangle) {
      this.current_rectangle.setMap(null);
    }

    this.current_rectangle = rectangle;

    const bounds = rectangle.getBounds();
    if (bounds) {
      this.map.fitBounds(bounds);
    }

    this.update_coordinates();

    if (this.drawing_manager) {
      this.drawing_manager.setDrawingMode(null);
    }

    google.maps.event.addListener(rectangle, "bounds_changed", () => {
      this.update_coordinates();
    });
  }

  private update_coordinates() {
    if (!this.current_rectangle) return;

    const bounds = this.current_rectangle.getBounds();
    if (bounds) {
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();

      const coords: Coordinates = {
        north: ne.lat(),
        south: sw.lat(),
        east: ne.lng(),
        west: sw.lng(),
      };

      this.on_coordinates_change(coords);
    }
  }

  enable_drawing() {
    if (!this.drawing_manager) return;

    this.clear_rectangle();

    this.drawing_manager.setMap(this.map);
    this.drawing_manager.setDrawingMode(google.maps.drawing.OverlayType.RECTANGLE);
  }

  clear_rectangle() {
    if (this.current_rectangle) {
      this.current_rectangle.setMap(null);
      this.current_rectangle = null;
      this.on_coordinates_change(null);
    }

    if (this.drawing_manager) {
      this.drawing_manager.setDrawingMode(null);
    }
  }

  get_coordinates(): Coordinates | null {
    if (!this.current_rectangle) return null;

    const bounds = this.current_rectangle.getBounds();
    if (!bounds) return null;

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    return {
      north: ne.lat(),
      south: sw.lat(),
      east: ne.lng(),
      west: sw.lng(),
    };
  }
}
