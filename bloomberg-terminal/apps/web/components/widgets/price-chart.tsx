'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, LineData } from 'lightweight-charts';
import { useMarketStore } from '@/stores/market-store';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Activity, 
  TrendingUp, 
  BarChart3, 
  LineChart,
  CandlestickChart,
  Maximize2,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice, formatVolume, formatPercent } from '@/lib/format';

interface ChartData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Indicator {
  id: string;
  name: string;
  type: 'overlay' | 'panel';
  enabled: boolean;
}

const TIMEFRAMES = [
  { value: '1m', label: '1M' },
  { value: '5m', label: '5M' },
  { value: '15m', label: '15M' },
  { value: '1h', label: '1H' },
  { value: '4h', label: '4H' },
  { value: '1d', label: '1D' },
  { value: '1w', label: '1W' },
];

const CHART_TYPES = [
  { value: 'candles', label: 'Candles', icon: CandlestickChart },
  { value: 'line', label: 'Line', icon: LineChart },
  { value: 'bars', label: 'Bars', icon: BarChart3 },
];

const INDICATORS: Indicator[] = [
  { id: 'sma20', name: 'SMA 20', type: 'overlay', enabled: false },
  { id: 'sma50', name: 'SMA 50', type: 'overlay', enabled: false },
  { id: 'ema12', name: 'EMA 12', type: 'overlay', enabled: false },
  { id: 'ema26', name: 'EMA 26', type: 'overlay', enabled: false },
  { id: 'bb', name: 'Bollinger Bands', type: 'overlay', enabled: false },
  { id: 'volume', name: 'Volume', type: 'panel', enabled: true },
  { id: 'rsi', name: 'RSI', type: 'panel', enabled: false },
  { id: 'macd', name: 'MACD', type: 'panel', enabled: false },
];

export function PriceChartWidget() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const candleSeries = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeries = useRef<ISeriesApi<'Histogram'> | null>(null);

  const { selectedSymbol } = useMarketStore();
  const [timeframe, setTimeframe] = useState('1h');
  const [chartType, setChartType] = useState('candles');
  const [indicators, setIndicators] = useState(INDICATORS);

  // Fetch OHLC data
  const { data: chartData, isLoading } = useQuery<ChartData[]>({
    queryKey: ['chart-data', selectedSymbol, timeframe],
    queryFn: async () => {
      const response = await fetch(`/api/market/ohlc/${selectedSymbol}?timeframe=${timeframe}`);
      if (!response.ok) throw new Error('Failed to fetch chart data');
      return response.json();
    },
    refetchInterval: timeframe === '1m' ? 5000 : 30000,
  });

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || chart.current) return;

    const newChart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgb(var(--text-secondary))',
        fontSize: 11,
        fontFamily: 'JetBrains Mono',
      },
      grid: {
        vertLines: { color: 'rgb(var(--bloomberg-border))' },
        horzLines: { color: 'rgb(var(--bloomberg-border))' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: 'rgb(var(--bloomberg-amber))',
          width: 1,
          style: 2,
          labelBackgroundColor: 'rgb(var(--bloomberg-amber))',
        },
        horzLine: {
          color: 'rgb(var(--bloomberg-amber))',
          width: 1,
          style: 2,
          labelBackgroundColor: 'rgb(var(--bloomberg-amber))',
        },
      },
      rightPriceScale: {
        borderColor: 'rgb(var(--bloomberg-border))',
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderColor: 'rgb(var(--bloomberg-border))',
        timeVisible: true,
        secondsVisible: false,
        barSpacing: 12,
      },
    });

    chart.current = newChart;

    // Create main price series
    candleSeries.current = newChart.addCandlestickSeries({
      upColor: 'rgb(var(--bloomberg-green))',
      downColor: 'rgb(var(--bloomberg-red))',
      borderUpColor: 'rgb(var(--bloomberg-green))',
      borderDownColor: 'rgb(var(--bloomberg-red))',
      wickUpColor: 'rgb(var(--bloomberg-green))',
      wickDownColor: 'rgb(var(--bloomberg-red))',
    });

    // Create volume series
    volumeSeries.current = newChart.addHistogramSeries({
      color: 'rgb(var(--bloomberg-blue))',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    newChart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chart.current) {
        chart.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.current?.remove();
      chart.current = null;
    };
  }, []);

  // Update chart data
  useEffect(() => {
    if (!chart.current || !candleSeries.current || !volumeSeries.current || !chartData) return;

    const candleData: CandlestickData[] = chartData.map(d => ({
      time: d.time as any,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    const volumeData = chartData.map(d => ({
      time: d.time as any,
      value: d.volume,
      color: d.close >= d.open ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)',
    }));

    candleSeries.current.setData(candleData);
    volumeSeries.current.setData(volumeData);
    chart.current.timeScale().fitContent();
  }, [chartData]);

  const toggleIndicator = (indicatorId: string) => {
    setIndicators(prev => 
      prev.map(ind => 
        ind.id === indicatorId ? { ...ind, enabled: !ind.enabled } : ind
      )
    );
  };

  if (isLoading) {
    return (
      <Card className="h-full bg-bloomberg-black border-bloomberg-border">
        <CardHeader className="border-b border-bloomberg-border">
          <CardTitle className="text-bloomberg-amber">PRICE CHART</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <Skeleton className="w-full h-[400px] bg-bloomberg-dark" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-bloomberg-black border-bloomberg-border overflow-hidden">
      <CardHeader className="border-b border-bloomberg-border pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-bloomberg-amber text-sm font-semibold tracking-wider">
              {selectedSymbol}
            </CardTitle>
            <Badge variant="outline" className="text-xs border-bloomberg-green text-bloomberg-green">
              LIVE
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-bloomberg-gray hover:text-bloomberg-amber"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-bloomberg-gray hover:text-bloomberg-amber"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Chart controls */}
        <div className="flex items-center justify-between p-3 border-b border-bloomberg-border">
          <div className="flex items-center gap-3">
            {/* Timeframe selector */}
            <div className="flex gap-1">
              {TIMEFRAMES.map((tf) => (
                <Button
                  key={tf.value}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 px-2 text-xs",
                    timeframe === tf.value
                      ? "bg-bloomberg-amber text-bloomberg-black"
                      : "text-bloomberg-gray hover:text-bloomberg-amber"
                  )}
                  onClick={() => setTimeframe(tf.value)}
                >
                  {tf.label}
                </Button>
              ))}
            </div>

            {/* Chart type selector */}
            <div className="flex gap-1 border-l border-bloomberg-border pl-3">
              {CHART_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <Button
                    key={type.value}
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-7 w-7",
                      chartType === type.value
                        ? "text-bloomberg-amber"
                        : "text-bloomberg-gray hover:text-bloomberg-amber"
                    )}
                    onClick={() => setChartType(type.value)}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Indicators */}
          <Select>
            <SelectTrigger className="w-[120px] h-7 text-xs bg-bloomberg-dark border-bloomberg-border">
              <SelectValue placeholder="Indicators" />
            </SelectTrigger>
            <SelectContent className="bg-bloomberg-dark border-bloomberg-border">
              {indicators.map((indicator) => (
                <SelectItem
                  key={indicator.id}
                  value={indicator.id}
                  className="text-xs"
                  onSelect={() => toggleIndicator(indicator.id)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{indicator.name}</span>
                    {indicator.enabled && (
                      <Badge variant="outline" className="text-xs ml-2">ON</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Chart container */}
        <div ref={chartContainerRef} className="w-full h-[400px]" />

        {/* Price info bar */}
        <div className="flex items-center justify-between p-3 border-t border-bloomberg-border text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-bloomberg-gray">O:</span>
              <span className="text-white ml-1 font-mono">{formatPrice(chartData?.[0]?.open)}</span>
            </div>
            <div>
              <span className="text-bloomberg-gray">H:</span>
              <span className="text-white ml-1 font-mono">{formatPrice(chartData?.[0]?.high)}</span>
            </div>
            <div>
              <span className="text-bloomberg-gray">L:</span>
              <span className="text-white ml-1 font-mono">{formatPrice(chartData?.[0]?.low)}</span>
            </div>
            <div>
              <span className="text-bloomberg-gray">C:</span>
              <span className="text-white ml-1 font-mono">{formatPrice(chartData?.[0]?.close)}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <span className="text-bloomberg-gray">VOL:</span>
              <span className="text-white ml-1 font-mono">{formatVolume(chartData?.[0]?.volume)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}