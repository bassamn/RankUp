import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
} from "chart.js";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
);

ChartJS.defaults.color = "#8d939f";
ChartJS.defaults.borderColor = "rgba(255,255,255,.06)";
ChartJS.defaults.font.family = "Inter, ui-sans-serif, system-ui, sans-serif";

export const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { intersect: false, mode: "index" },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#202329",
      borderColor: "rgba(255,255,255,.1)",
      borderWidth: 1,
      titleColor: "#fff",
      bodyColor: "#c8cbd1",
      padding: 12,
      callbacks: {
        label: (context) => `${context.dataset.label || "Focus"}: ${context.parsed.y.toFixed(1)}h`
      }
    }
  },
  scales: {
    x: { grid: { display: false }, ticks: { maxRotation: 0 } },
    y: {
      beginAtZero: true,
      grid: { color: "rgba(255,255,255,.05)" },
      border: { display: false },
      ticks: { callback: (value) => `${value}h` }
    }
  }
};

export const palette = ["#c7f540", "#8b5cf6", "#32c5ff", "#ff8f5c", "#f0529c", "#43d6a3"];
