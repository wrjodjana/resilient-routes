import { useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";

const AllLegend = () => {
  const map = useMap();

  function getColorByValue(value: number) {
    const hue = 240;
    const saturation = 100;
    const lightness = Math.round(100 - value * 80);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

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
      const grades = [0.0, 0.2, 0.4, 0.6, 0.8, 1.0];
      const labels: string[] = [];

      div.innerHTML += "<h4 style='margin-bottom: 10px; font-weight: bold;'>Node Values</h4>";
      grades.forEach((grade, index) => {
        const color = getColorByValue(grade);
        labels.push(
          `<div style="display: flex; align-items: center; margin-bottom: 5px;">
            <i style="background:${color}; width: 20px; height: 20px; display: inline-block; margin-right: 8px; border-radius: 50%;"></i>
            ${grades[index].toFixed(1)}${grades[index + 1] ? " &ndash; " + grades[index + 1].toFixed(1) : ""}
          </div>`
        );
      });

      div.innerHTML += labels.join("");
      return div;
    };

    legend.addTo(map);

    return () => {
      legend.remove();
    };
  }, [map]);

  return null;
};

export default AllLegend;
