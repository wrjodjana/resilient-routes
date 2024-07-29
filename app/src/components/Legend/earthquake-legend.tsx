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

  function getGrayscaleColorByValue(value: number) {
    const clampedValue = Math.max(0, Math.min(1, value));
    const grayValue = Math.round(128 * (1 - clampedValue));
    return `rgb(${grayValue}, ${grayValue}, ${grayValue})`;
  }

  useEffect(() => {
    const legend = (L.control as any)({ position: "bottomleft" });

    legend.onAdd = function (map: any) {
      const div = L.DomUtil.create("div", "info legend");
      div.style.backgroundColor = "white";
      div.style.padding = "10px";
      div.style.border = "1px solid black";
      div.style.width = "250px";
      div.style.fontFamily = "Figtree, sans-serif";

      const grades = [0.0, 0.2, 0.4, 0.6, 0.8];
      const labels: string[] = [];
      const edgeLabels: string[] = [];

      div.innerHTML = "<h4 style='margin-bottom: 10px; font-weight: bold; text-align: center;'>Connectivity and Link Failure Probabilities</h4>";

      const legendsContainer = document.createElement("div");
      legendsContainer.style.display = "flex";
      legendsContainer.style.justifyContent = "center";
      legendsContainer.style.gap = "20px";

      const leftDiv = document.createElement("div");
      leftDiv.style.width = "45%";
      leftDiv.style.textAlign = "right";
      grades.forEach((grade, index) => {
        const color = getColorByValue(grade);
        const nextGrade = grades[index + 1] || 1.0;
        labels.push(
          `<div style="display: flex; align-items: center; justify-content: flex-end; margin-bottom: 5px;">
            <span style="margin-right: 8px;">${grade.toFixed(1)}–${nextGrade.toFixed(1)}</span>
            <i style="background:${color}; width: 20px; height: 20px; display: inline-block; border-radius: 50%;"></i>
          </div>`
        );
      });
      leftDiv.innerHTML = labels.join("");
      legendsContainer.appendChild(leftDiv);

      const rightDiv = document.createElement("div");
      rightDiv.style.width = "45%";
      grades.forEach((grade, index) => {
        const color = getGrayscaleColorByValue(grade);
        const nextGrade = grades[index + 1] || 1.0;
        edgeLabels.push(
          `<div style="display: flex; align-items: center; margin-bottom: 5px;">
            <i style="background:${color}; width: 30px; height: 3px; display: inline-block; margin-right: 8px;"></i>
            ${grade.toFixed(1)}–${nextGrade.toFixed(1)}
          </div>`
        );
      });
      rightDiv.innerHTML = edgeLabels.join("");
      legendsContainer.appendChild(rightDiv);

      div.appendChild(legendsContainer);

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
