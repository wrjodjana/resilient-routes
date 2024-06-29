import { useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";

const SelectLegend = () => {
  const map = useMap();

  useEffect(() => {
    const legend = (L.control as any)({ position: "bottomleft" });

    legend.onAdd = function (map: any) {
      const div = L.DomUtil.create("div", "info legend");
      div.style.backgroundColor = "white";
      div.style.padding = "10px";
      div.style.border = "1px solid black";
      div.style.width = "150px";
      div.style.textAlign = "center";
      div.style.fontFamily = "Figtree, sans-serif";

      div.innerHTML += "<h4 style='margin-top: 10px; margin-bottom: 10px; font-weight: bold;'>Route Info</h4>";
      div.innerHTML += `
        <div style="display: flex; align-items: center; margin-bottom: 5px;">
          <i style="background:blue; width: 20px; height: 20px; display: inline-block; margin-right: 8px; border-radius: 50%;"></i>Start Place
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 5px;">
          <i style="background:red; width: 20px; height: 20px; display: inline-block; margin-right: 8px; border-radius: 50%;"></i>End Place
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 5px;">
          <i style="background:black; width: 30px; height: 3px; display: inline-block; margin-right: 8px;"></i>Shortest Path
        </div>
      `;

      return div;
    };

    legend.addTo(map);

    return () => {
      legend.remove();
    };
  }, [map]);

  return null;
};

export default SelectLegend;
