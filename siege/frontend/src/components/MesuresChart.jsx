import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  TimeScale
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  TimeScale
);

function formatShort(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

export default function MesuresChart({ mesures, kind, ideal, tolerance, unit, color }) {
  const data = useMemo(() => {
    const min = ideal - tolerance;
    const max = ideal + tolerance;
    return {
      labels: mesures.map((m) => formatShort(m.timestamp)),
      datasets: [
        {
          label: kind === 'temp' ? 'Température' : 'Humidité',
          data: mesures.map((m) => (kind === 'temp' ? m.temperature : m.humidite)),
          borderColor: color,
          backgroundColor: color + '20',
          borderWidth: 2,
          tension: 0.25,
          pointRadius: 0,
          pointHoverRadius: 4,
          fill: true
        },
        {
          label: 'Seuil max',
          data: mesures.map(() => max),
          borderColor: '#ef4444',
          borderWidth: 1,
          borderDash: [4, 4],
          pointRadius: 0,
          fill: false
        },
        {
          label: 'Seuil min',
          data: mesures.map(() => min),
          borderColor: '#ef4444',
          borderWidth: 1,
          borderDash: [4, 4],
          pointRadius: 0,
          fill: false
        },
        {
          label: 'Idéal',
          data: mesures.map(() => ideal),
          borderColor: '#10b981',
          borderWidth: 1,
          borderDash: [2, 4],
          pointRadius: 0,
          fill: false
        }
      ]
    };
  }, [mesures, kind, ideal, tolerance, color]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: { boxWidth: 10, boxHeight: 10, font: { size: 11 } }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label} : ${ctx.parsed.y}${unit}`
          }
        }
      },
      scales: {
        x: {
          ticks: { font: { size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
          grid: { display: false }
        },
        y: {
          ticks: {
            font: { size: 10 },
            callback: (v) => `${v}${unit}`
          },
          grid: { color: '#eeece6' }
        }
      }
    }),
    [unit]
  );

  return (
    <div className="chart-canvas">
      <Line data={data} options={options} />
    </div>
  );
}
