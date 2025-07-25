import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface SectorBreakdownChartProps {
  data?: Array<{ sector: string; count: number; percentage: number }>;
}

export default function SectorBreakdownChart({ data }: SectorBreakdownChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  // Mock data for demonstration
  const mockData = [
    { sector: 'DeFi', count: 435, percentage: 35 },
    { sector: 'Gaming', count: 311, percentage: 25 },
    { sector: 'Layer 2', count: 187, percentage: 15 },
    { sector: 'NFTs', count: 149, percentage: 12 },
    { sector: 'Metaverse', count: 100, percentage: 8 },
    { sector: 'Others', count: 62, percentage: 5 },
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
      type: 'doughnut',
      data: {
        labels: chartData.map(d => d.sector),
        datasets: [{
          data: chartData.map(d => d.percentage),
          backgroundColor: [
            'hsl(0, 84.2%, 60.2%)',    // Destructive
            'hsl(47.9, 95.8%, 53.1%)', // Warning  
            'hsl(207, 90%, 54%)',      // Primary
            'hsl(142.1, 76.2%, 36.3%)', // Success
            'hsl(263.4, 70%, 50.4%)',  // Purple
            'hsl(215.4, 16.3%, 46.9%)', // Muted
          ],
          borderWidth: 0,
          hoverBorderWidth: 2,
          hoverBorderColor: 'hsl(0, 0%, 98%)',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: 'hsl(240, 5%, 64.9%)',
              padding: 20,
              usePointStyle: true,
              font: {
                size: 12,
              }
            }
          },
          tooltip: {
            backgroundColor: 'hsl(240, 10%, 3.9%)',
            titleColor: 'hsl(0, 0%, 98%)',
            bodyColor: 'hsl(0, 0%, 98%)',
            borderColor: 'hsl(240, 3.7%, 15.9%)',
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed;
                const count = chartData[context.dataIndex]?.count || 0;
                return `${label}: ${value}% (${count} tokens)`;
              }
            }
          }
        },
        cutout: '60%',
        animation: {
          animateRotate: true,
          animateScale: true,
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [chartData]);

  return (
    <div className="h-80 w-full">
      <canvas ref={chartRef} className="w-full h-full"></canvas>
    </div>
  );
}
