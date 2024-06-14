import { useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";

const DemandLegend = () => {
  const map = useMap();

  useEffect(() => {
    const legend = (L.control as any)({ position: "bottomleft" });

    legend.onAdd = function (map: any) {
      const div = L.DomUtil.create("div", "info legend");
      div.style.backgroundColor = "white";
      div.style.padding = "10px";
      div.style.border = "1px solid black";
      div.style.width = "180px";
      div.style.textAlign = "left";
      div.style.fontFamily = "Figtree, sans-serif";

      div.innerHTML += "<h4 style='margin-bottom: 10px; font-weight: bold;'>Origin-Destination Demand</h4>";
      div.innerHTML += `
        <div style="display: flex; flex-direction: column; align-items: flex-start;">
          <div style="display: flex; align-items: center; margin-bottom: 5px;">
            <i style="background:green; width: 10px; height: 10px; display: inline-block; margin-right: 8px; border-radius: 50%;"></i>
            <span>0-300</span>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 5px;">
            <i style="background:green; width: 20px; height: 20px; display: inline-block; margin-right: 8px; border-radius: 50%;"></i>
            <span>301-500</span>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 5px;">
            <i style="background:green; width: 30px; height: 30px; display: inline-block; margin-right: 8px; border-radius: 50%;"></i>
            <span>501+</span>
          </div>
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

export default DemandLegend;
