import { useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";

function colorFlowEMA(value: number) {
  const hue = 240;
  const saturation = 100;
  const minValue = 0.0;
  const maxValue = 11983.482682010897;
  const normalizedValue = (value - minValue) / (maxValue - minValue);
  const lightness = Math.round(90 - normalizedValue * 80);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}
const EmaLegendFlow = () => {
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
      div.innerHTML += "<h4 style='margin-bottom: 10px; font-weight: bold;'>Traffic Flow</h4>";

      const values = [0, 6000, 12000];
      const descriptions = ["Low", "Medium", "High"];

      values.forEach((value, index) => {
        const color = colorFlowEMA(value);
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

export default EmaLegendFlow;
