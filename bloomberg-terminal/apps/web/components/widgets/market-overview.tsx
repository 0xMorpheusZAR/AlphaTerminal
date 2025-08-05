'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Activity, BarChart3, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatVolume, formatPercent, formatNumber } from '@/lib/format';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface GlobalMetrics {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  ethDominance: number;
  defiVolume: number;
  activeCoins: number;
  marketCapChange24h: number;
  volumeChange24h: number;
  fearGreedIndex: number;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  suffix?: string;
  color?: 'green' | 'red' | 'amber' | 'blue';
}

function MetricCard({ title, value, change, icon, suffix, color = 'amber' }: MetricCardProps) {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    setFlash(true);
    const timer = setTimeout(() => setFlash(false), 500);
    return () => clearTimeout(timer);
  }, [value]);

  const colorClasses = {
    green: 'text-bloomberg-green border-bloomberg-green/20',
    red: 'text-bloomberg-red border-bloomberg-red/20',
    amber: 'text-bloomberg-amber border-bloomberg-amber/20',
    blue: 'text-bloomberg-blue border-bloomberg-blue/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative overflow-hidden rounded-sm border bg-bloomberg-dark/50",
        "hover:bg-bloomberg-dark/70 transition-colors duration-200",
        flash && "price-flash-green"
      )}
    >
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-bloomberg-gray uppercase tracking-wider">{title}</span>
          <span className={cn("text-xs", colorClasses[color])}>{icon}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-white font-mono">
            {value}
          </span>
          {suffix && <span className="text-sm text-bloomberg-gray">{suffix}</span>}
        </div>
        {change !== undefined && (
          <div className={cn(
            "text-xs font-mono",
            change >= 0 ? "text-bloomberg-green" : "text-bloomberg-red"
          )}>
            {change >= 0 ? '+' : ''}{formatPercent(change)}
          </div>
        )}
      </div>
      {/* Bloomberg-style accent line */}
      <div className={cn("absolute bottom-0 left-0 right-0 h-[2px]", `bg-bloomberg-${color}`)} />
    </motion.div>
  );
}

function FearGreedGauge({ value }: { value: number }) {
  const getColor = (val: number) => {
    if (val <= 20) return 'text-bloomberg-red';
    if (val <= 40) return 'text-orange-500';
    if (val <= 60) return 'text-yellow-500';
    if (val <= 80) return 'text-green-500';
    return 'text-bloomberg-green';
  };

  const getLabel = (val: number) => {
    if (val <= 20) return 'EXTREME FEAR';
    if (val <= 40) return 'FEAR';
    if (val <= 60) return 'NEUTRAL';
    if (val <= 80) return 'GREED';
    return 'EXTREME GREED';
  };

  return (
    <div className="relative h-24 flex items-center justify-center">
      <div className="text-center">
        <div className={cn("text-4xl font-bold font-mono", getColor(value))}>
          {value}
        </div>
        <div className="text-xs text-bloomberg-gray mt-1">{getLabel(value)}</div>
      </div>
      {/* Gauge visualization */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100">
        <path
          d="M 20 80 A 60 60 0 0 1 180 80"
          fill="none"
          stroke="rgb(var(--bloomberg-border))"
          strokeWidth="8"
        />
        <path
          d="M 20 80 A 60 60 0 0 1 180 80"
          fill="none"
          stroke="rgb(var(--bloomberg-amber))"
          strokeWidth="8"
          strokeDasharray={`${(value / 100) * 188.4} 188.4`}
          className="transition-all duration-500"
        />
      </svg>
    </div>
  );
}

export function MarketOverviewWidget() {
  // Fetch global market data
  const { data: metrics, isLoading, error } = useQuery<GlobalMetrics>({
    queryKey: ['market-overview'],
    queryFn: async () => {
      const response = await fetch('/api/market/global');
      if (!response.ok) throw new Error('Failed to fetch market data');
      const data = await response.json();
      return data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card className="h-full bg-bloomberg-black border-bloomberg-border">
        <CardHeader className="border-b border-bloomberg-border">
          <CardTitle className="text-bloomberg-amber">MARKET OVERVIEW</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24 bg-bloomberg-dark" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !metrics) {
    return (
      <Card className="h-full bg-bloomberg-black border-bloomberg-border">
        <CardHeader className="border-b border-bloomberg-border">
          <CardTitle className="text-bloomberg-amber">MARKET OVERVIEW</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-bloomberg-red text-center py-8">
            Failed to load market data
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-bloomberg-black border-bloomberg-border overflow-hidden">
      <CardHeader className="border-b border-bloomberg-border pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-bloomberg-amber text-sm font-semibold tracking-wider">
            MARKET OVERVIEW
          </CardTitle>
          <Badge variant="outline" className="text-xs border-bloomberg-green text-bloomberg-green">
            LIVE
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Main metrics grid */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            title="TOTAL MARKET CAP"
            value={formatVolume(metrics.totalMarketCap)}
            change={metrics.marketCapChange24h}
            icon={<DollarSign className="w-4 h-4" />}
            color="amber"
          />
          <MetricCard
            title="24H VOLUME"
            value={formatVolume(metrics.totalVolume24h)}
            change={metrics.volumeChange24h}
            icon={<Activity className="w-4 h-4" />}
            color="blue"
          />
          <MetricCard
            title="BTC DOMINANCE"
            value={metrics.btcDominance.toFixed(1)}
            suffix="%"
            icon={<BarChart3 className="w-4 h-4" />}
            color="amber"
          />
          <MetricCard
            title="ACTIVE COINS"
            value={formatNumber(metrics.activeCoins, 0)}
            icon={<Zap className="w-4 h-4" />}
            color="green"
          />
        </div>

        {/* Fear & Greed Index */}
        <div className="border border-bloomberg-border rounded-sm bg-bloomberg-dark/50 p-4">
          <div className="text-xs text-bloomberg-gray uppercase tracking-wider mb-2 text-center">
            FEAR & GREED INDEX
          </div>
          <FearGreedGauge value={metrics.fearGreedIndex} />
        </div>

        {/* Market sentiment indicator */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-bloomberg-gray">MARKET SENTIMENT</span>
          <div className="flex items-center gap-2">
            {metrics.marketCapChange24h >= 0 ? (
              <>
                <TrendingUp className="w-4 h-4 text-bloomberg-green" />
                <span className="text-bloomberg-green font-semibold">BULLISH</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-bloomberg-red" />
                <span className="text-bloomberg-red font-semibold">BEARISH</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}