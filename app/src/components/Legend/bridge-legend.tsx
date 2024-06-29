import { useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";

const BridgeLegend = () => {
  const map = useMap();

  useEffect(() => {
    const legend = (L.control as any)({ position: "bottomleft" });

    legend.onAdd = function (map: any) {
      const div = L.DomUtil.create("div", "info legend");
      div.style.backgroundColor = "white";
      div.style.padding = "10px";
      div.style.border = "1px solid black";
      div.style.width = "180px";
      div.style.textAlign = "center";
      div.style.fontFamily = "Figtree, sans-serif";

      div.innerHTML += "<h4 style='margin-bottom: 10px; font-weight: bold;'>Legend</h4>";
      div.innerHTML += `
        <div style="display: flex; align-items: center; margin-bottom: 5px;">
          <i style="background:green; width: 20px; height: 20px; display: inline-block; margin-right: 8px; border-radius: 50%;"></i>
          Bridge
        </div>`;

      return div;
    };

    legend.addTo(map);

    return () => {
      legend.remove();
    };
  }, [map]);

  return null;
};

export default BridgeLegend;
