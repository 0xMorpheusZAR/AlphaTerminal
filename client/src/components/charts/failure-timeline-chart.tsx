import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';

Chart.register(...registerables);

interface FailureTimelineChartProps {
  data?: Array<{ date: string; count: number }>;
  timeframe?: string;
}

export default function FailureTimelineChart({ data, timeframe = '24h' }: FailureTimelineChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  // Mock data for demonstration
  const mockData = [
    { date: '2024-01', count: 45 },
    { date: '2024-02', count: 78 },
    { date: '2024-03', count: 123 },
    { date: '2024-04', count: 189 },
    { date: '2024-05', count: 234 },
    { date: '2024-06', count: 298 },
    { date: '2024-07', count: 367 },
    { date: '2024-08', count: 445 },
    { date: '2024-09', count: 523 },
    { date: '2024-10', count: 678 },
    { date: '2024-11', count: 789 },
    { date: '2024-12', count: 847 },
  ];

  const chartData = data || mockData;

  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartData.map(d => d.date),
        datasets: [{
          label: 'Failed Tokens',
          data: chartData.map(d => d.count),
          borderColor: 'hsl(0, 84.2%, 60.2%)',
          backgroundColor: 'hsla(0, 84.2%, 60.2%, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'hsl(0, 84.2%, 60.2%)',
          pointBorderColor: 'hsl(240, 10%, 3.9%)',
          pointBorderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'hsl(240, 10%, 3.9%)',
            titleColor: 'hsl(0, 0%, 98%)',
            bodyColor: 'hsl(0, 0%, 98%)',
            borderColor: 'hsl(240, 3.7%, 15.9%)',
            borderWidth: 1,
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'hsl(240, 3.7%, 15.9%)',
            },
            ticks: {
              color: 'hsl(240, 5%, 64.9%)',
            }
          },
          x: {
            grid: {
              color: 'hsl(240, 3.7%, 15.9%)',
            },
            ticks: {
              color: 'hsl(240, 5%, 64.9%)',
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [chartData, timeframe]);

  return (
    <div className="h-80 w-full">
      <canvas ref={chartRef} className="w-full h-full"></canvas>
    </div>
  );
}
