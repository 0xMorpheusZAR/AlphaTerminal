import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, 
  Globe, Shield, Zap, Brain, Eye, Wallet, ArrowUpRight,
  Info, AlertTriangle, CheckCircle2, XCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Line, Bar, Doughnut, Radar, Bubble } from 'react-chartjs-2';
import { api } from '@/lib/api';

export default function CoinGeckoProShowcase() {
  const [selectedMetric, setSelectedMetric] = useState('market-overview');
  const [timeframe, setTimeframe] = useState('24h');

  // Fetch all showcase data
  const { data: showcaseData, isLoading } = useQuery({
    queryKey: ['coingecko-pro-showcase', timeframe],
    queryFn: async () => {
      const response = await api.get(`/api/coingecko-pro/showcase?timeframe=${timeframe}`);
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const features = [
    {
      id: 'market-overview',
      title: 'Global Market Intelligence',
      icon: Globe,
      description: 'Real-time global crypto market analytics',
      color: 'bg-blue-500',
    },
    {
      id: 'whale-tracker',
      title: 'Whale Movement Tracker',
      icon: Wallet,
      description: 'Track large transactions and smart money',
      color: 'bg-purple-500',
    },
    {
      id: 'defi-pulse',
      title: 'DeFi Pulse Analytics',
      icon: Activity,
      description: 'Cross-chain DeFi protocol intelligence',
      color: 'bg-green-500',
    },
    {
      id: 'derivatives',
      title: 'Derivatives Dashboard',
      icon: BarChart3,
      description: 'Options, futures, and perpetuals analytics',
      color: 'bg-orange-500',
    },
    {
      id: 'sentiment',
      title: 'AI Sentiment Analysis',
      icon: Brain,
      description: 'Market sentiment and social signals',
      color: 'bg-pink-500',
    },
    {
      id: 'risk-metrics',
      title: 'Risk Management Suite',
      icon: Shield,
      description: 'Institutional-grade risk analytics',
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              CoinGecko Pro Analytics Suite
            </h1>
            <p className="text-xl text-gray-400 mt-2">
              Enterprise-Grade Cryptocurrency Intelligence Platform
            </p>
          </div>
          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 text-lg">
            PRO
          </Badge>
        </div>

        {/* Key Metrics Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Total Market Cap"
            value={showcaseData?.globalMetrics?.totalMarketCap || '$2.45T'}
            change={showcaseData?.globalMetrics?.marketCapChange || '+3.2%'}
            trend="up"
            icon={DollarSign}
          />
          <MetricCard
            title="24h Volume"
            value={showcaseData?.globalMetrics?.volume24h || '$124.5B'}
            change={showcaseData?.globalMetrics?.volumeChange || '+12.4%'}
            trend="up"
            icon={Activity}
          />
          <MetricCard
            title="Active Cryptocurrencies"
            value={showcaseData?.globalMetrics?.activeCryptos || '12,854'}
            change={showcaseData?.globalMetrics?.cryptoChange || '+42'}
            trend="up"
            icon={Zap}
          />
          <MetricCard
            title="Market Dominance"
            value={`BTC ${showcaseData?.globalMetrics?.btcDominance || '52.3%'}`}
            change={showcaseData?.globalMetrics?.dominanceChange || '-0.8%'}
            trend="down"
            icon={Eye}
          />
        </div>
      </motion.div>

      {/* Feature Selection */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {features.map((feature) => (
          <motion.div
            key={feature.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedMetric(feature.id)}
            className={`cursor-pointer ${
              selectedMetric === feature.id ? 'ring-2 ring-white' : ''
            }`}
          >
            <Card className="bg-gray-800/50 backdrop-blur border-gray-700 h-full">
              <CardContent className="p-4 text-center">
                <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-sm">{feature.title}</h3>
                <p className="text-xs text-gray-400 mt-1">{feature.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedMetric}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent(selectedMetric, showcaseData)}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Metric Card Component
function MetricCard({ title, value, change, trend, icon: Icon }) {
  return (
    <Card className="bg-gray-800/50 backdrop-blur border-gray-700">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Icon className="w-5 h-5 text-gray-400" />
          <Badge 
            variant="outline" 
            className={trend === 'up' ? 'text-green-400 border-green-400' : 'text-red-400 border-red-400'}
          >
            {change}
          </Badge>
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-gray-400">{title}</div>
      </CardContent>
    </Card>
  );
}

// Content renderer based on selected metric
function renderContent(metric, data) {
  switch (metric) {
    case 'market-overview':
      return <GlobalMarketOverview data={data?.marketOverview} />;
    case 'whale-tracker':
      return <WhaleTracker data={data?.whaleData} />;
    case 'defi-pulse':
      return <DeFiAnalytics data={data?.defiData} />;
    case 'derivatives':
      return <DerivativesDashboard data={data?.derivativesData} />;
    case 'sentiment':
      return <SentimentAnalysis data={data?.sentimentData} />;
    case 'risk-metrics':
      return <RiskManagement data={data?.riskData} />;
    default:
      return <GlobalMarketOverview data={data?.marketOverview} />;
  }
}

// Global Market Overview Component
function GlobalMarketOverview({ data }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-gray-800/50 backdrop-blur border-gray-700">
        <CardHeader>
          <CardTitle>Market Cap Distribution</CardTitle>
          <CardDescription>Top 10 cryptocurrencies by market cap</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <Doughnut
              data={{
                labels: data?.topCoins?.map(c => c.symbol) || ['BTC', 'ETH', 'BNB', 'SOL', 'XRP'],
                datasets: [{
                  data: data?.topCoins?.map(c => c.marketCap) || [880000000000, 300000000000, 48000000000, 41000000000, 29000000000],
                  backgroundColor: [
                    '#F7931A', '#627EEA', '#F0B90B', '#00FFA3', '#00AAE4',
                    '#FF5B5B', '#9945FF', '#14F195', '#3B82F6', '#8B5CF6'
                  ],
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                    labels: { color: '#fff' }
                  }
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 backdrop-blur border-gray-700">
        <CardHeader>
          <CardTitle>Market Trend Analysis</CardTitle>
          <CardDescription>7-day market performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <Line
              data={{
                labels: data?.trendLabels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [
                  {
                    label: 'Total Market Cap',
                    data: data?.marketCapTrend || [2.42, 2.44, 2.41, 2.45, 2.48, 2.46, 2.45],
                    borderColor: '#10B981',
                    backgroundColor: '#10B98120',
                    tension: 0.4,
                  },
                  {
                    label: 'Trading Volume',
                    data: data?.volumeTrend || [110, 115, 108, 124, 130, 125, 124],
                    borderColor: '#F59E0B',
                    backgroundColor: '#F59E0B20',
                    tension: 0.4,
                    yAxisID: 'y1',
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: { grid: { color: '#374151' }, ticks: { color: '#9CA3AF' } },
                  y: { 
                    grid: { color: '#374151' }, 
                    ticks: { color: '#9CA3AF' },
                    title: { display: true, text: 'Market Cap (T)', color: '#9CA3AF' }
                  },
                  y1: {
                    position: 'right',
                    grid: { display: false },
                    ticks: { color: '#9CA3AF' },
                    title: { display: true, text: 'Volume (B)', color: '#9CA3AF' }
                  }
                },
                plugins: {
                  legend: { labels: { color: '#fff' } }
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 backdrop-blur border-gray-700 lg:col-span-2">
        <CardHeader>
          <CardTitle>Real-Time Market Movers</CardTitle>
          <CardDescription>Top gainers and losers in the last 24 hours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Top Gainers
              </h3>
              <div className="space-y-2">
                {(data?.topGainers || mockGainers).map((coin, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-700/50 rounded">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">#{idx + 1}</span>
                      <span className="font-medium">{coin.symbol}</span>
                      <span className="text-sm text-gray-400">{coin.name}</span>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border-green-400">
                      +{coin.change}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
                <TrendingDown className="w-5 h-5" /> Top Losers
              </h3>
              <div className="space-y-2">
                {(data?.topLosers || mockLosers).map((coin, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-700/50 rounded">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">#{idx + 1}</span>
                      <span className="font-medium">{coin.symbol}</span>
                      <span className="text-sm text-gray-400">{coin.name}</span>
                    </div>
                    <Badge className="bg-red-500/20 text-red-400 border-red-400">
                      {coin.change}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Whale Tracker Component
function WhaleTracker({ data }) {
  return (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 backdrop-blur border-gray-700">
        <CardHeader>
          <CardTitle>Whale Alert Dashboard</CardTitle>
          <CardDescription>Large transactions detected in the last 24 hours</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {(data?.whaleTransactions || mockWhaleTransactions).map((tx, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-4 bg-gray-700/50 rounded-lg border border-gray-600"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${tx.type === 'buy' ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span className="font-semibold">{tx.amount} {tx.symbol}</span>
                      <Badge variant="outline" className="text-xs">
                        ${tx.usdValue}
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-400">{tx.time}</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    From: {tx.from} → To: {tx.to}
                  </div>
                  {tx.exchange && (
                    <Badge className="mt-2 bg-blue-500/20 text-blue-400 border-blue-400">
                      {tx.exchange}
                    </Badge>
                  )}
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-800/50 backdrop-blur border-gray-700">
          <CardHeader>
            <CardTitle>Whale Accumulation Index</CardTitle>
            <CardDescription>Smart money sentiment indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Radar
                data={{
                  labels: ['BTC', 'ETH', 'SOL', 'AVAX', 'MATIC', 'LINK'],
                  datasets: [{
                    label: 'Accumulation Score',
                    data: data?.accumulationScores || [85, 72, 68, 45, 55, 78],
                    backgroundColor: '#10B98140',
                    borderColor: '#10B981',
                    pointBackgroundColor: '#10B981',
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    r: {
                      angleLines: { color: '#374151' },
                      grid: { color: '#374151' },
                      pointLabels: { color: '#9CA3AF' },
                      ticks: { color: '#9CA3AF' }
                    }
                  },
                  plugins: {
                    legend: { labels: { color: '#fff' } }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 backdrop-blur border-gray-700">
          <CardHeader>
            <CardTitle>Exchange Flow Analysis</CardTitle>
            <CardDescription>Net inflow/outflow from major exchanges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(data?.exchangeFlows || mockExchangeFlows).map((exchange, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{exchange.name}</span>
                    <span className={`text-sm ${exchange.netFlow > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {exchange.netFlow > 0 ? '+' : ''}{exchange.netFlow} BTC
                    </span>
                  </div>
                  <Progress 
                    value={Math.abs(exchange.netFlow) / 10} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// DeFi Analytics Component
function DeFiAnalytics({ data }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Total Value Locked"
          value={data?.tvl || '$142.8B'}
          change={data?.tvlChange || '+5.2%'}
          trend="up"
          icon={DollarSign}
        />
        <MetricCard
          title="DeFi Dominance"
          value={data?.defiDominance || '5.8%'}
          change={data?.dominanceChange || '+0.3%'}
          trend="up"
          icon={Activity}
        />
        <MetricCard
          title="Active Protocols"
          value={data?.activeProtocols || '3,241'}
          change={data?.protocolChange || '+18'}
          trend="up"
          icon={Shield}
        />
      </div>

      <Card className="bg-gray-800/50 backdrop-blur border-gray-700">
        <CardHeader>
          <CardTitle>Cross-Chain TVL Distribution</CardTitle>
          <CardDescription>Total value locked across different blockchains</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <Bar
              data={{
                labels: data?.chains || ['Ethereum', 'BSC', 'Arbitrum', 'Polygon', 'Optimism', 'Avalanche'],
                datasets: [{
                  label: 'TVL (Billions)',
                  data: data?.chainTvl || [85.2, 12.8, 8.5, 6.2, 4.8, 3.9],
                  backgroundColor: [
                    '#627EEA', '#F0B90B', '#2D374B', '#8247E5', '#FF0420', '#E84142'
                  ],
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: { grid: { color: '#374151' }, ticks: { color: '#9CA3AF' } },
                  y: { 
                    grid: { color: '#374151' }, 
                    ticks: { color: '#9CA3AF' },
                    title: { display: true, text: 'TVL (Billions USD)', color: '#9CA3AF' }
                  }
                },
                plugins: {
                  legend: { display: false }
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800/50 backdrop-blur border-gray-700">
          <CardHeader>
            <CardTitle>Top DeFi Protocols</CardTitle>
            <CardDescription>By total value locked</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.topProtocols || mockDeFiProtocols).map((protocol, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-700/50 rounded">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 font-mono">#{idx + 1}</span>
                    <div>
                      <div className="font-medium">{protocol.name}</div>
                      <div className="text-sm text-gray-400">{protocol.category}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${protocol.tvl}</div>
                    <div className={`text-sm ${protocol.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {protocol.change > 0 ? '+' : ''}{protocol.change}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 backdrop-blur border-gray-700">
          <CardHeader>
            <CardTitle>Yield Farming Opportunities</CardTitle>
            <CardDescription>High APY pools across protocols</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.yieldPools || mockYieldPools).map((pool, idx) => (
                <div key={idx} className="p-3 bg-gray-700/50 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{pool.pair}</span>
                    <Badge className="bg-green-500/20 text-green-400 border-green-400">
                      {pool.apy}% APY
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{pool.protocol}</span>
                    <span className="text-gray-400">TVL: ${pool.tvl}</span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    {pool.rewards.map((reward, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {reward}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Derivatives Dashboard Component
function DerivativesDashboard({ data }) {
  return (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 backdrop-blur border-gray-700">
        <CardHeader>
          <CardTitle>Options & Futures Overview</CardTitle>
          <CardDescription>Derivatives market analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64">
              <h3 className="text-sm font-medium mb-3">Open Interest by Asset</h3>
              <Doughnut
                data={{
                  labels: ['BTC', 'ETH', 'SOL', 'Others'],
                  datasets: [{
                    data: data?.openInterest || [18500000000, 8200000000, 1800000000, 3500000000],
                    backgroundColor: ['#F7931A', '#627EEA', '#00FFA3', '#6B7280'],
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { color: '#fff', padding: 10 }
                    }
                  }
                }}
              />
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Market Indicators</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">24h Volume</span>
                    <span className="font-medium">${data?.volume24h || '142.8B'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Open Interest</span>
                    <span className="font-medium">${data?.totalOI || '32.0B'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Long/Short Ratio</span>
                    <span className="font-medium text-green-400">{data?.lsRatio || '1.24'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Funding Rate (BTC)</span>
                    <span className="font-medium text-yellow-400">{data?.fundingRate || '0.012%'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800/50 backdrop-blur border-gray-700">
          <CardHeader>
            <CardTitle>Options Flow</CardTitle>
            <CardDescription>Large options trades today</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {(data?.optionsFlow || mockOptionsFlow).map((trade, idx) => (
                  <div key={idx} className="p-2 bg-gray-700/50 rounded text-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{trade.asset}</span>
                        <span className="mx-2 text-gray-400">{trade.strike}</span>
                        <Badge variant="outline" className={trade.type === 'CALL' ? 'text-green-400' : 'text-red-400'}>
                          {trade.type}
                        </Badge>
                      </div>
                      <span className="font-medium">${trade.premium}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Exp: {trade.expiry} • Size: {trade.size}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 backdrop-blur border-gray-700">
          <CardHeader>
            <CardTitle>Liquidation Heatmap</CardTitle>
            <CardDescription>Potential liquidation levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Bar
                data={{
                  labels: data?.liquidationLevels || ['$42k', '$43k', '$44k', '$45k', '$46k', '$47k'],
                  datasets: [
                    {
                      label: 'Longs',
                      data: data?.longLiquidations || [120, 85, 45, 20, 10, 5],
                      backgroundColor: '#10B98180',
                      borderColor: '#10B981',
                      borderWidth: 1,
                    },
                    {
                      label: 'Shorts',
                      data: data?.shortLiquidations || [5, 10, 25, 60, 95, 140],
                      backgroundColor: '#EF444480',
                      borderColor: '#EF4444',
                      borderWidth: 1,
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: { 
                      grid: { color: '#374151' }, 
                      ticks: { color: '#9CA3AF' },
                      stacked: true
                    },
                    y: { 
                      grid: { color: '#374151' }, 
                      ticks: { color: '#9CA3AF' },
                      title: { display: true, text: 'Liquidations (M)', color: '#9CA3AF' },
                      stacked: true
                    }
                  },
                  plugins: {
                    legend: { labels: { color: '#fff' } }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Sentiment Analysis Component
function SentimentAnalysis({ data }) {
  return (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 backdrop-blur border-gray-700">
        <CardHeader>
          <CardTitle>AI-Powered Market Sentiment</CardTitle>
          <CardDescription>Real-time sentiment analysis from multiple sources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400">{data?.overallSentiment || '72'}</div>
              <div className="text-sm text-gray-400 mt-1">Overall Score</div>
              <Badge className="mt-2 bg-green-500/20 text-green-400 border-green-400">
                Bullish
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-400">{data?.fearGreed || '68'}</div>
              <div className="text-sm text-gray-400 mt-1">Fear & Greed Index</div>
              <Badge className="mt-2 bg-yellow-500/20 text-yellow-400 border-yellow-400">
                Greed
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-400">{data?.socialVolume || '8.2M'}</div>
              <div className="text-sm text-gray-400 mt-1">Social Volume</div>
              <Badge className="mt-2 bg-blue-500/20 text-blue-400 border-blue-400">
                +24% 24h
              </Badge>
            </div>
          </div>

          <div className="h-64">
            <Line
              data={{
                labels: data?.sentimentLabels || ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
                datasets: [
                  {
                    label: 'Twitter',
                    data: data?.twitterSentiment || [65, 68, 72, 70, 75, 72],
                    borderColor: '#1DA1F2',
                    backgroundColor: '#1DA1F220',
                    tension: 0.4,
                  },
                  {
                    label: 'Reddit',
                    data: data?.redditSentiment || [60, 62, 68, 65, 70, 68],
                    borderColor: '#FF4500',
                    backgroundColor: '#FF450020',
                    tension: 0.4,
                  },
                  {
                    label: 'News',
                    data: data?.newsSentiment || [70, 72, 75, 73, 78, 75],
                    borderColor: '#10B981',
                    backgroundColor: '#10B98120',
                    tension: 0.4,
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: { grid: { color: '#374151' }, ticks: { color: '#9CA3AF' } },
                  y: { 
                    grid: { color: '#374151' }, 
                    ticks: { color: '#9CA3AF' },
                    min: 0,
                    max: 100,
                    title: { display: true, text: 'Sentiment Score', color: '#9CA3AF' }
                  }
                },
                plugins: {
                  legend: { labels: { color: '#fff' } }
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-800/50 backdrop-blur border-gray-700">
          <CardHeader>
            <CardTitle>Trending Topics</CardTitle>
            <CardDescription>Most discussed crypto topics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.trendingTopics || mockTrendingTopics).map((topic, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{topic.emoji}</span>
                    <div>
                      <div className="font-medium">{topic.name}</div>
                      <div className="text-sm text-gray-400">{topic.mentions} mentions</div>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-xs ${
                    topic.sentiment > 0 ? 'text-green-400 border-green-400' : 'text-red-400 border-red-400'
                  }`}>
                    {topic.sentiment > 0 ? '+' : ''}{topic.sentiment}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 backdrop-blur border-gray-700">
          <CardHeader>
            <CardTitle>Influencer Sentiment</CardTitle>
            <CardDescription>Key opinion leaders' market views</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.influencers || mockInfluencers).map((influencer, idx) => (
                <div key={idx} className="p-3 bg-gray-700/50 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full" />
                      <div>
                        <div className="font-medium">{influencer.name}</div>
                        <div className="text-xs text-gray-400">{influencer.followers} followers</div>
                      </div>
                    </div>
                    <Badge className={`${
                      influencer.stance === 'Bullish' 
                        ? 'bg-green-500/20 text-green-400 border-green-400' 
                        : influencer.stance === 'Bearish'
                        ? 'bg-red-500/20 text-red-400 border-red-400'
                        : 'bg-gray-500/20 text-gray-400 border-gray-400'
                    }`}>
                      {influencer.stance}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-300 italic">"{influencer.lastTweet}"</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Risk Management Component
function RiskManagement({ data }) {
  return (
    <div className="space-y-6">
      <Alert className="bg-gray-800/50 border-yellow-500/50">
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
        <AlertDescription>
          <span className="font-semibold">Market Risk Level: </span>
          <Badge className="ml-2 bg-yellow-500/20 text-yellow-400 border-yellow-400">
            MODERATE
          </Badge>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <RiskMetricCard
          title="Volatility Index"
          value={data?.volatilityIndex || '68.5'}
          status="high"
          description="24h price volatility"
        />
        <RiskMetricCard
          title="Correlation Risk"
          value={data?.correlationRisk || '0.82'}
          status="medium"
          description="Cross-asset correlation"
        />
        <RiskMetricCard
          title="Liquidity Score"
          value={data?.liquidityScore || '7.2/10'}
          status="good"
          description="Market depth quality"
        />
        <RiskMetricCard
          title="Systemic Risk"
          value={data?.systemicRisk || '42%'}
          status="medium"
          description="Overall market risk"
        />
      </div>

      <Card className="bg-gray-800/50 backdrop-blur border-gray-700">
        <CardHeader>
          <CardTitle>Portfolio Risk Analysis</CardTitle>
          <CardDescription>Risk metrics for a balanced crypto portfolio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64">
              <h3 className="text-sm font-medium mb-3">Risk Distribution</h3>
              <Radar
                data={{
                  labels: ['Market Risk', 'Liquidity Risk', 'Credit Risk', 'Operational Risk', 'Regulatory Risk', 'Technical Risk'],
                  datasets: [{
                    label: 'Current Risk Level',
                    data: data?.riskLevels || [75, 45, 30, 55, 60, 40],
                    backgroundColor: '#EF444440',
                    borderColor: '#EF4444',
                    pointBackgroundColor: '#EF4444',
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    r: {
                      angleLines: { color: '#374151' },
                      grid: { color: '#374151' },
                      pointLabels: { color: '#9CA3AF', font: { size: 10 } },
                      ticks: { color: '#9CA3AF', backdropColor: 'transparent' },
                      suggestedMin: 0,
                      suggestedMax: 100
                    }
                  },
                  plugins: {
                    legend: { display: false }
                  }
                }}
              />
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Risk Mitigation Strategies</h3>
              <div className="space-y-2">
                {(data?.strategies || mockStrategies).map((strategy, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-gray-700/50 rounded">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{strategy.title}</div>
                      <div className="text-xs text-gray-400 mt-1">{strategy.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 backdrop-blur border-gray-700">
        <CardHeader>
          <CardTitle>Black Swan Event Monitor</CardTitle>
          <CardDescription>Potential high-impact, low-probability events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(data?.blackSwanEvents || mockBlackSwanEvents).map((event, idx) => (
              <div key={idx} className="p-4 bg-gray-700/50 rounded border border-gray-600">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-5 h-5 ${
                      event.severity === 'high' ? 'text-red-400' : 
                      event.severity === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                    }`} />
                    <span className="font-medium">{event.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {event.probability}% chance
                    </Badge>
                    <Badge className={`text-xs ${
                      event.impact === 'high' ? 'bg-red-500/20 text-red-400 border-red-400' : 
                      event.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-400' : 
                      'bg-blue-500/20 text-blue-400 border-blue-400'
                    }`}>
                      {event.impact} impact
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-400">{event.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Risk Metric Card Component
function RiskMetricCard({ title, value, status, description }) {
  const statusColors = {
    good: 'text-green-400 border-green-400',
    medium: 'text-yellow-400 border-yellow-400',
    high: 'text-red-400 border-red-400'
  };

  return (
    <Card className="bg-gray-800/50 backdrop-blur border-gray-700">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Shield className="w-5 h-5 text-gray-400" />
          <Badge variant="outline" className={`text-xs ${statusColors[status]}`}>
            {status.toUpperCase()}
          </Badge>
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-gray-400">{title}</div>
        <div className="text-xs text-gray-500 mt-1">{description}</div>
      </CardContent>
    </Card>
  );
}

// Mock data
const mockGainers = [
  { symbol: 'PEPE', name: 'Pepe', change: 45.2 },
  { symbol: 'WIF', name: 'dogwifhat', change: 38.7 },
  { symbol: 'BONK', name: 'Bonk', change: 32.1 },
  { symbol: 'JUP', name: 'Jupiter', change: 28.5 },
  { symbol: 'PYTH', name: 'Pyth Network', change: 24.3 }
];

const mockLosers = [
  { symbol: 'LUNA', name: 'Terra Luna Classic', change: -18.5 },
  { symbol: 'FTT', name: 'FTX Token', change: -15.2 },
  { symbol: 'CEL', name: 'Celsius', change: -12.8 },
  { symbol: 'LUNC', name: 'Terra Classic', change: -11.4 },
  { symbol: 'UST', name: 'TerraUSD', change: -9.7 }
];

const mockWhaleTransactions = [
  { amount: '2,500', symbol: 'BTC', usdValue: '112.5M', type: 'buy', from: '0x1234...5678', to: 'Binance', time: '2 mins ago', exchange: 'Binance' },
  { amount: '50,000', symbol: 'ETH', usdValue: '125M', type: 'sell', from: 'Coinbase', to: '0xabcd...efgh', time: '15 mins ago', exchange: 'Coinbase' },
  { amount: '10,000,000', symbol: 'USDT', usdValue: '10M', type: 'transfer', from: '0x9876...5432', to: '0x2468...1357', time: '28 mins ago' },
];

const mockExchangeFlows = [
  { name: 'Binance', netFlow: -850 },
  { name: 'Coinbase', netFlow: -420 },
  { name: 'Kraken', netFlow: 280 },
  { name: 'OKX', netFlow: -150 }
];

const mockDeFiProtocols = [
  { name: 'Lido', category: 'Liquid Staking', tvl: '32.8B', change: 5.2 },
  { name: 'MakerDAO', category: 'CDP', tvl: '8.5B', change: -2.1 },
  { name: 'AAVE', category: 'Lending', tvl: '7.2B', change: 3.8 },
  { name: 'Uniswap', category: 'DEX', tvl: '5.8B', change: 1.5 }
];

const mockYieldPools = [
  { pair: 'ETH-USDC', protocol: 'Uniswap V3', apy: 24.5, tvl: '125M', rewards: ['UNI', 'ARB'] },
  { pair: 'wBTC-ETH', protocol: 'Curve', apy: 18.2, tvl: '89M', rewards: ['CRV', 'CVX'] },
  { pair: 'MATIC-USDT', protocol: 'Quickswap', apy: 35.8, tvl: '42M', rewards: ['QUICK', 'MATIC'] }
];

const mockOptionsFlow = [
  { asset: 'BTC', strike: '$50,000', type: 'CALL', expiry: 'Jan 26', size: '1,000', premium: '2.5M' },
  { asset: 'ETH', strike: '$3,000', type: 'PUT', expiry: 'Jan 19', size: '5,000', premium: '1.8M' },
  { asset: 'BTC', strike: '$45,000', type: 'CALL', expiry: 'Feb 23', size: '500', premium: '1.2M' }
];

const mockTrendingTopics = [
  { emoji: '🚀', name: 'Bitcoin ETF', mentions: '45.2k', sentiment: 82 },
  { emoji: '🔥', name: 'Solana Memecoins', mentions: '38.7k', sentiment: 75 },
  { emoji: '💎', name: 'Diamond Hands', mentions: '32.1k', sentiment: 68 },
  { emoji: '🐋', name: 'Whale Activity', mentions: '28.5k', sentiment: -15 }
];

const mockInfluencers = [
  { name: 'CryptoPunk6529', followers: '458K', stance: 'Bullish', lastTweet: 'The macro setup for crypto has never been better. Accumulate.' },
  { name: 'Pentoshi', followers: '742K', stance: 'Neutral', lastTweet: 'Watching key levels here. $44k must hold for bulls.' },
  { name: 'CryptoCapo', followers: '385K', stance: 'Bearish', lastTweet: 'Distribution phase ongoing. Expecting correction to $38k.' }
];

const mockStrategies = [
  { title: 'Diversification', description: 'Spread investments across multiple assets and sectors' },
  { title: 'Stop-Loss Orders', description: 'Set automatic sell orders to limit downside risk' },
  { title: 'Position Sizing', description: 'Never risk more than 2% of portfolio on a single trade' },
  { title: 'Regular Rebalancing', description: 'Quarterly portfolio rebalancing to maintain target allocations' }
];

const mockBlackSwanEvents = [
  { title: 'Major Exchange Hack', probability: 15, impact: 'high', severity: 'high', description: 'Potential security breach at top-5 exchange could trigger market panic' },
  { title: 'Stablecoin De-peg', probability: 8, impact: 'high', severity: 'high', description: 'Major stablecoin losing peg could cause liquidity crisis' },
  { title: 'Regulatory Crackdown', probability: 25, impact: 'medium', severity: 'medium', description: 'Sudden regulatory action in major market' },
  { title: 'Quantum Computing Threat', probability: 2, impact: 'high', severity: 'low', description: 'Breakthrough in quantum computing threatening cryptographic security' }
];