import { useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";

function colorRatioSiouxFalls(value: number) {
  const hue = 240;
  const saturation = 100;
  const normalizedValue = (value - 0.12762650681519946) / (1.677709070292858 - 0.12762650681519946);
  const lightness = Math.round(90 - normalizedValue * 80);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

const SiouxFallsLegendRatio = () => {
  const map = useMap();

  useEffect(() => {
    const legend = (L.control as any)({ position: "bottomleft" });

    legend.onAdd = function (map: any) {
      const div = L.DomUtil.create("div", "info legend");
      div.style.backgroundColor = "white";
      div.style.padding = "10px";
      div.style.border = "1px solid black";
      div.style.width = "200px";
      div.style.textAlign = "left";
      div.style.fontFamily = "Figtree, sans-serif";
      div.innerHTML += "<h4 style='margin-bottom: 10px; font-weight: bold;'>Traffic Ratio</h4>";

      // Define quantitative values and their corresponding colors
      const values = [0.1, 0.5, 0.9]; // Example values
      const descriptions = ["Low", "Medium", "High"]; // Corresponding descriptions

      values.forEach((value, index) => {
        const color = colorRatioSiouxFalls(value);
        const lineContainer = L.DomUtil.create("div", "", div);
        lineContainer.style.display = "flex";
        lineContainer.style.alignItems = "center";
        lineContainer.style.marginBottom = "5px";

        lineContainer.innerHTML = `
          <svg style="width: 30px; height: 3px; vertical-align: middle;">
            <rect width="30" height="3" style="fill:${color};"></rect>
          </svg>
          <span style="margin-left: 8px;">${descriptions[index]} (${value})</span>
        `;
      });

      return div;
    };

    legend.addTo(map);

    return () => {
      legend.remove();
    };
  }, [map]);

  return null;
};

export default SiouxFallsLegendRatio;
