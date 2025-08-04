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
  Info, AlertTriangle, CheckCircle2, XCircle, Wand2,
  Sparkles, ChevronRight, ExternalLink, Clock, Users
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Line, Bar, Doughnut, Radar, Bubble } from 'react-chartjs-2';
import { api } from '@/lib/api';
import MagicUIGenerator from '@/components/coingecko/magic-ui-generator';
import { LiveDataIndicator, MultiServiceIndicator, useApiStatus } from '@/components/ui/live-data-indicator';

export default function CoinGeckoProShowcase() {
  const [selectedMetric, setSelectedMetric] = useState('market-overview');
  const [timeframe, setTimeframe] = useState('24h');
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  // Track API status for all services
  const coinGeckoStatus = useApiStatus('CoinGecko', '/api/coingecko-pro/health');
  const whaleAlertStatus = useApiStatus('Whale Alert', '/api/whale-alert/health');
  const veloStatus = useApiStatus('Velo', '/api/velo/health');
  const openAIStatus = useApiStatus('OpenAI', '/api/ai/health');
  const defiLlamaStatus = useApiStatus('DefiLlama', '/api/defillama/health');

  const apiServices = [
    coinGeckoStatus,
    whaleAlertStatus,
    veloStatus,
    openAIStatus,
    defiLlamaStatus
  ];

  // Fetch all showcase data
  const { data: showcaseData, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['coingecko-pro-showcase', timeframe],
    queryFn: async () => {
      const response = await api.get(`/api/coingecko-pro/showcase?timeframe=${timeframe}`);
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Determine data source based on response
  const dataSource = showcaseData?.metadata?.source || (showcaseData ? 'live' : 'mock');
  const isLiveData = dataSource === 'live';
  const lastUpdate = dataUpdatedAt ? new Date(dataUpdatedAt) : new Date();

  const features = [
    {
      id: 'market-overview',
      title: 'Market Intelligence',
      icon: Globe,
      description: 'Real-time global analytics',
      gradient: 'from-blue-600 to-cyan-500',
      shadowColor: 'shadow-blue-500/25',
    },
    {
      id: 'whale-tracker',
      title: 'Whale Tracker',
      icon: Wallet,
      description: 'Smart money movements',
      gradient: 'from-purple-600 to-violet-500',
      shadowColor: 'shadow-purple-500/25',
    },
    {
      id: 'defi-pulse',
      title: 'DeFi Analytics',
      icon: Activity,
      description: 'Cross-chain intelligence',
      gradient: 'from-emerald-600 to-green-500',
      shadowColor: 'shadow-emerald-500/25',
    },
    {
      id: 'derivatives',
      title: 'Derivatives',
      icon: BarChart3,
      description: 'Options & futures data',
      gradient: 'from-orange-600 to-amber-500',
      shadowColor: 'shadow-orange-500/25',
    },
    {
      id: 'sentiment',
      title: 'AI Sentiment',
      icon: Brain,
      description: 'Market psychology',
      gradient: 'from-pink-600 to-rose-500',
      shadowColor: 'shadow-pink-500/25',
    },
    {
      id: 'risk-metrics',
      title: 'Risk Suite',
      icon: Shield,
      description: 'Institutional analytics',
      gradient: 'from-red-600 to-rose-600',
      shadowColor: 'shadow-red-500/25',
    },
    {
      id: 'magic-ui',
      title: 'Magic UI',
      icon: Wand2,
      description: 'AI component builder',
      gradient: 'from-purple-600 via-pink-600 to-blue-600',
      shadowColor: 'shadow-purple-500/25',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-purple-900/10 to-pink-900/10" />
        <motion.div
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="relative z-10 p-6 max-w-8xl mx-auto">
        {/* Sleek Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 blur-2xl opacity-50" />
                <h1 className="relative text-5xl font-bold">
                  <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                    CoinGecko Pro
                  </span>
                </h1>
              </div>
              <div className="h-12 w-px bg-gradient-to-b from-transparent via-gray-600 to-transparent" />
              <div>
                <p className="text-gray-400 text-sm">Enterprise Analytics Suite</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  Real-time data • 
                  <Users className="w-3 h-3 ml-1" />
                  10k+ active traders
                </p>
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Badge className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-xl border-yellow-500/30 text-yellow-300 px-6 py-2 text-lg font-semibold">
                <Sparkles className="w-4 h-4 mr-2" />
                PRO
              </Badge>
            </motion.div>
          </div>

          {/* Glassmorphic Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Total Market Cap"
              value={showcaseData?.globalMetrics?.totalMarketCap || '$2.45T'}
              change={showcaseData?.globalMetrics?.marketCapChange || '+3.2%'}
              trend="up"
              icon={DollarSign}
              gradient="from-blue-500 to-cyan-500"
            />
            <MetricCard
              title="24h Volume"
              value={showcaseData?.globalMetrics?.volume24h || '$124.5B'}
              change={showcaseData?.globalMetrics?.volumeChange || '+12.4%'}
              trend="up"
              icon={Activity}
              gradient="from-purple-500 to-violet-500"
            />
            <MetricCard
              title="Active Cryptos"
              value={showcaseData?.globalMetrics?.activeCryptos || '12,854'}
              change={showcaseData?.globalMetrics?.cryptoChange || '+42'}
              trend="up"
              icon={Zap}
              gradient="from-emerald-500 to-green-500"
            />
            <MetricCard
              title="BTC Dominance"
              value={`${showcaseData?.globalMetrics?.btcDominance || '52.3%'}`}
              change={showcaseData?.globalMetrics?.dominanceChange || '-0.8%'}
              trend="down"
              icon={Eye}
              gradient="from-orange-500 to-amber-500"
            />
          </div>
        </motion.div>

        {/* Feature Navigation - Sleek Pills */}
        <div className="mb-8 overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {features.map((feature, index) => (
              <motion.button
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedMetric(feature.id)}
                onMouseEnter={() => setHoveredFeature(feature.id)}
                onMouseLeave={() => setHoveredFeature(null)}
                className={`relative group px-6 py-3 rounded-2xl transition-all duration-300 ${
                  selectedMetric === feature.id
                    ? 'bg-gradient-to-r ' + feature.gradient + ' text-white shadow-lg ' + feature.shadowColor
                    : 'bg-gray-900/50 backdrop-blur-sm border border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <feature.icon className={`w-5 h-5 ${
                    selectedMetric === feature.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'
                  }`} />
                  <div className="text-left">
                    <p className={`font-semibold text-sm ${
                      selectedMetric === feature.id ? 'text-white' : 'text-gray-300'
                    }`}>
                      {feature.title}
                    </p>
                    <p className={`text-xs ${
                      selectedMetric === feature.id ? 'text-white/80' : 'text-gray-500'
                    }`}>
                      {feature.description}
                    </p>
                  </div>
                </div>
                {selectedMetric === feature.id && (
                  <motion.div
                    layoutId="activeFeature"
                    className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-2xl pointer-events-none"
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Main Content Area with Smooth Transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedMetric}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 to-transparent rounded-3xl blur-3xl" />
            <div className="relative">
              {renderContent(selectedMetric, showcaseData)}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Sleek Metric Card Component
function MetricCard({ title, value, change, trend, icon: Icon, gradient }) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-xl" 
           style={{ 
             background: `linear-gradient(to right, var(--tw-gradient-stops))`,
             '--tw-gradient-from': gradient.split(' ')[1],
             '--tw-gradient-to': gradient.split(' ')[3]
           }} 
      />
      <Card className="relative bg-gray-900/60 backdrop-blur-xl border-gray-800 hover:border-gray-700 transition-colors duration-300 rounded-2xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-xl bg-gradient-to-r ${gradient} bg-opacity-20`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <Badge 
              variant="outline" 
              className={`backdrop-blur-sm ${
                trend === 'up' 
                  ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' 
                  : 'text-red-400 border-red-400/30 bg-red-400/10'
              }`}
            >
              {trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {change}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              {value}
            </p>
            <p className="text-sm text-gray-500">{title}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
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
    case 'magic-ui':
      return <MagicUIGenerator />;
    default:
      return <GlobalMarketOverview data={data?.marketOverview} />;
  }
}

// Global Market Overview Component - Redesigned
function GlobalMarketOverview({ data }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Market Cap Distribution - Glassmorphic */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gray-900/40 backdrop-blur-xl border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition-colors duration-300">
          <CardHeader className="border-b border-gray-800/50">
            <CardTitle className="text-xl font-semibold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 bg-opacity-20">
                <BarChart3 className="w-5 h-5 text-blue-400" />
              </div>
              Market Cap Distribution
            </CardTitle>
            <CardDescription className="text-gray-500">
              Top 10 cryptocurrencies by market cap
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
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
                    borderWidth: 0,
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: { 
                        color: '#9CA3AF',
                        padding: 15,
                        font: {
                          size: 12
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Market Trend Analysis - Modern Line Chart */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-gray-900/40 backdrop-blur-xl border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition-colors duration-300">
          <CardHeader className="border-b border-gray-800/50">
            <CardTitle className="text-xl font-semibold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-violet-500 bg-opacity-20">
                <Activity className="w-5 h-5 text-purple-400" />
              </div>
              Market Trend Analysis
            </CardTitle>
            <CardDescription className="text-gray-500">
              7-day market performance overview
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-80">
              <Line
                data={{
                  labels: data?.trendLabels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                  datasets: [
                    {
                      label: 'Total Market Cap',
                      data: data?.marketCapTrend || [2.42, 2.44, 2.41, 2.45, 2.48, 2.46, 2.45],
                      borderColor: '#10B981',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      tension: 0.4,
                      borderWidth: 3,
                      pointRadius: 0,
                      pointHoverRadius: 6,
                      pointHoverBackgroundColor: '#10B981',
                      pointHoverBorderColor: '#fff',
                      pointHoverBorderWidth: 2,
                    },
                    {
                      label: 'Trading Volume',
                      data: data?.volumeTrend || [110, 115, 108, 124, 130, 125, 124],
                      borderColor: '#F59E0B',
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      tension: 0.4,
                      borderWidth: 3,
                      pointRadius: 0,
                      pointHoverRadius: 6,
                      pointHoverBackgroundColor: '#F59E0B',
                      pointHoverBorderColor: '#fff',
                      pointHoverBorderWidth: 2,
                      yAxisID: 'y1',
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: {
                    mode: 'index',
                    intersect: false,
                  },
                  scales: {
                    x: { 
                      grid: { 
                        color: 'rgba(75, 85, 99, 0.2)',
                        drawBorder: false,
                      }, 
                      ticks: { 
                        color: '#9CA3AF',
                        font: {
                          size: 11
                        }
                      } 
                    },
                    y: { 
                      grid: { 
                        color: 'rgba(75, 85, 99, 0.2)',
                        drawBorder: false,
                      }, 
                      ticks: { 
                        color: '#9CA3AF',
                        font: {
                          size: 11
                        }
                      },
                      title: { 
                        display: true, 
                        text: 'Market Cap (T)', 
                        color: '#6B7280',
                        font: {
                          size: 12
                        }
                      }
                    },
                    y1: {
                      position: 'right',
                      grid: { 
                        display: false 
                      },
                      ticks: { 
                        color: '#9CA3AF',
                        font: {
                          size: 11
                        }
                      },
                      title: { 
                        display: true, 
                        text: 'Volume (B)', 
                        color: '#6B7280',
                        font: {
                          size: 12
                        }
                      }
                    }
                  },
                  plugins: {
                    legend: { 
                      labels: { 
                        color: '#9CA3AF',
                        usePointStyle: true,
                        padding: 20,
                        font: {
                          size: 12
                        }
                      } 
                    },
                    tooltip: {
                      backgroundColor: 'rgba(17, 24, 39, 0.9)',
                      titleColor: '#F3F4F6',
                      bodyColor: '#D1D5DB',
                      borderColor: 'rgba(75, 85, 99, 0.3)',
                      borderWidth: 1,
                      padding: 12,
                      cornerRadius: 8,
                      displayColors: true,
                      usePointStyle: true,
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Market Movers - Sleek List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="lg:col-span-2"
      >
        <Card className="bg-gray-900/40 backdrop-blur-xl border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition-colors duration-300">
          <CardHeader className="border-b border-gray-800/50">
            <CardTitle className="text-xl font-semibold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 bg-opacity-20">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              Real-Time Market Movers
            </CardTitle>
            <CardDescription className="text-gray-500">
              Top gainers and losers in the last 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Gainers */}
              <div>
                <h3 className="text-emerald-400 font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" /> 
                  Top Gainers
                </h3>
                <div className="space-y-3">
                  {(data?.topGainers || mockGainers).map((coin, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ x: 4 }}
                      className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800/70 transition-all duration-300 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500 font-mono text-sm">#{idx + 1}</span>
                        <div>
                          <span className="font-semibold text-white">{coin.symbol}</span>
                          <span className="text-sm text-gray-400 ml-2">{coin.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-400/30 font-semibold">
                          +{coin.change}%
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Top Losers */}
              <div>
                <h3 className="text-red-400 font-semibold mb-4 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5" /> 
                  Top Losers
                </h3>
                <div className="space-y-3">
                  {(data?.topLosers || mockLosers).map((coin, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ x: 4 }}
                      className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800/70 transition-all duration-300 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500 font-mono text-sm">#{idx + 1}</span>
                        <div>
                          <span className="font-semibold text-white">{coin.symbol}</span>
                          <span className="text-sm text-gray-400 ml-2">{coin.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-red-500/20 text-red-400 border-red-400/30 font-semibold">
                          {coin.change}%
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// Whale Tracker Component - Redesigned
function WhaleTracker({ data }) {
  return (
    <div className="space-y-6">
      {/* Whale Alert Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gray-900/40 backdrop-blur-xl border-gray-800 rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-gray-800/50">
            <CardTitle className="text-xl font-semibold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-violet-500 bg-opacity-20">
                <Wallet className="w-5 h-5 text-purple-400" />
              </div>
              Whale Alert Dashboard
              <Badge className="ml-auto bg-purple-500/20 text-purple-400 border-purple-400/30">
                Live
              </Badge>
            </CardTitle>
            <CardDescription className="text-gray-500">
              Large transactions detected in the last 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {(data?.whaleTransactions || mockWhaleTransactions).map((tx, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 hover:border-purple-500/30 transition-all duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            tx.type === 'buy' ? 'bg-emerald-400' : 'bg-red-400'
                          } animate-pulse`} />
                          <span className="font-bold text-lg">{tx.amount} {tx.symbol}</span>
                          <Badge variant="outline" className="bg-gray-800/50 backdrop-blur-sm">
                            ${tx.usdValue}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {tx.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400">From:</span>
                        <code className="text-blue-400 bg-blue-400/10 px-2 py-1 rounded font-mono text-xs">
                          {tx.from}
                        </code>
                        <ArrowUpRight className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-400">To:</span>
                        <code className="text-purple-400 bg-purple-400/10 px-2 py-1 rounded font-mono text-xs">
                          {tx.to}
                        </code>
                      </div>
                      {tx.exchange && (
                        <Badge className="mt-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-400/30">
                          {tx.exchange}
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Whale Accumulation Index */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gray-900/40 backdrop-blur-xl border-gray-800 rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-gray-800/50">
              <CardTitle className="text-lg font-semibold">Whale Accumulation Index</CardTitle>
              <CardDescription className="text-gray-500">Smart money sentiment indicators</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-64">
                <Radar
                  data={{
                    labels: ['BTC', 'ETH', 'SOL', 'AVAX', 'MATIC', 'LINK'],
                    datasets: [{
                      label: 'Accumulation Score',
                      data: data?.accumulationScores || [85, 72, 68, 45, 55, 78],
                      backgroundColor: 'rgba(147, 51, 234, 0.2)',
                      borderColor: '#9333ea',
                      pointBackgroundColor: '#9333ea',
                      pointBorderColor: '#fff',
                      pointHoverBackgroundColor: '#fff',
                      pointHoverBorderColor: '#9333ea',
                      borderWidth: 2,
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      r: {
                        angleLines: { color: 'rgba(75, 85, 99, 0.3)' },
                        grid: { color: 'rgba(75, 85, 99, 0.3)' },
                        pointLabels: { 
                          color: '#9CA3AF',
                          font: {
                            size: 12
                          }
                        },
                        ticks: { 
                          color: '#6B7280',
                          backdropColor: 'transparent',
                          font: {
                            size: 10
                          }
                        }
                      }
                    },
                    plugins: {
                      legend: { 
                        display: false
                      },
                      tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.9)',
                        titleColor: '#F3F4F6',
                        bodyColor: '#D1D5DB',
                        borderColor: 'rgba(75, 85, 99, 0.3)',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                      }
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Exchange Flow Analysis */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gray-900/40 backdrop-blur-xl border-gray-800 rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-gray-800/50">
              <CardTitle className="text-lg font-semibold">Exchange Flow Analysis</CardTitle>
              <CardDescription className="text-gray-500">Net inflow/outflow from major exchanges</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {(data?.exchangeFlows || mockExchangeFlows).map((exchange, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-300">{exchange.name}</span>
                      <span className={`text-sm font-semibold ${
                        exchange.netFlow > 0 ? 'text-red-400' : 'text-emerald-400'
                      }`}>
                        {exchange.netFlow > 0 ? '+' : ''}{exchange.netFlow} BTC
                      </span>
                    </div>
                    <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.abs(exchange.netFlow) / 10}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`absolute h-full rounded-full ${
                          exchange.netFlow > 0 
                            ? 'bg-gradient-to-r from-red-500 to-red-400' 
                            : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                        }`}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

// DeFi Analytics Component - Redesigned
function DeFiAnalytics({ data }) {
  return (
    <div className="space-y-6">
      {/* DeFi Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Total Value Locked"
          value={data?.tvl || '$142.8B'}
          change={data?.tvlChange || '+5.2%'}
          trend="up"
          icon={DollarSign}
          gradient="from-emerald-500 to-green-500"
        />
        <MetricCard
          title="DeFi Dominance"
          value={data?.defiDominance || '5.8%'}
          change={data?.dominanceChange || '+0.3%'}
          trend="up"
          icon={Activity}
          gradient="from-blue-500 to-cyan-500"
        />
        <MetricCard
          title="Active Protocols"
          value={data?.activeProtocols || '3,241'}
          change={data?.protocolChange || '+18'}
          trend="up"
          icon={Shield}
          gradient="from-purple-500 to-violet-500"
        />
      </div>

      {/* Cross-Chain TVL Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-gray-900/40 backdrop-blur-xl border-gray-800 rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-gray-800/50">
            <CardTitle className="text-xl font-semibold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 bg-opacity-20">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
              </div>
              Cross-Chain TVL Distribution
            </CardTitle>
            <CardDescription className="text-gray-500">
              Total value locked across different blockchains
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-80">
              <Bar
                data={{
                  labels: data?.chains || ['Ethereum', 'BSC', 'Arbitrum', 'Polygon', 'Optimism', 'Avalanche'],
                  datasets: [{
                    label: 'TVL (Billions)',
                    data: data?.chainTvl || [85.2, 12.8, 8.5, 6.2, 4.8, 3.9],
                    backgroundColor: [
                      'rgba(98, 126, 234, 0.8)',
                      'rgba(240, 185, 11, 0.8)',
                      'rgba(45, 55, 75, 0.8)',
                      'rgba(130, 71, 229, 0.8)',
                      'rgba(255, 4, 32, 0.8)',
                      'rgba(232, 65, 66, 0.8)'
                    ],
                    borderColor: [
                      '#627EEA', '#F0B90B', '#2D374B', '#8247E5', '#FF0420', '#E84142'
                    ],
                    borderWidth: 2,
                    borderRadius: 8,
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: { 
                      grid: { 
                        color: 'rgba(75, 85, 99, 0.2)',
                        drawBorder: false,
                      }, 
                      ticks: { 
                        color: '#9CA3AF',
                        font: {
                          size: 11
                        }
                      } 
                    },
                    y: { 
                      grid: { 
                        color: 'rgba(75, 85, 99, 0.2)',
                        drawBorder: false,
                      }, 
                      ticks: { 
                        color: '#9CA3AF',
                        font: {
                          size: 11
                        }
                      },
                      title: { 
                        display: true, 
                        text: 'TVL (Billions USD)', 
                        color: '#6B7280',
                        font: {
                          size: 12
                        }
                      }
                    }
                  },
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: 'rgba(17, 24, 39, 0.9)',
                      titleColor: '#F3F4F6',
                      bodyColor: '#D1D5DB',
                      borderColor: 'rgba(75, 85, 99, 0.3)',
                      borderWidth: 1,
                      padding: 12,
                      cornerRadius: 8,
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top DeFi Protocols */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gray-900/40 backdrop-blur-xl border-gray-800 rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-gray-800/50">
              <CardTitle className="text-lg font-semibold">Top DeFi Protocols</CardTitle>
              <CardDescription className="text-gray-500">By total value locked</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {(data?.topProtocols || mockDeFiProtocols).map((protocol, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ x: 4 }}
                    className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800/70 transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 font-mono text-sm w-6">#{idx + 1}</span>
                      <div>
                        <div className="font-semibold text-white">{protocol.name}</div>
                        <div className="text-sm text-gray-500">{protocol.category}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">${protocol.tvl}</div>
                      <div className={`text-sm font-medium ${
                        protocol.change > 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {protocol.change > 0 ? '+' : ''}{protocol.change}%
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Yield Farming Opportunities */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gray-900/40 backdrop-blur-xl border-gray-800 rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-gray-800/50">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                Yield Farming Opportunities
                <Badge className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border-yellow-400/30">
                  Hot
                </Badge>
              </CardTitle>
              <CardDescription className="text-gray-500">High APY pools across protocols</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {(data?.yieldPools || mockYieldPools).map((pool, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-4 bg-gradient-to-r from-gray-800/50 to-gray-800/30 rounded-xl border border-gray-700/50 hover:border-yellow-500/30 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-lg">{pool.pair}</span>
                      <Badge className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400 border-emerald-400/30 font-bold">
                        {pool.apy}% APY
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-400">{pool.protocol}</span>
                      <span className="text-gray-400">TVL: ${pool.tvl}</span>
                    </div>
                    <div className="flex gap-2">
                      {pool.rewards.map((reward, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-gray-800/50 backdrop-blur-sm">
                          {reward}
                        </Badge>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

// Derivatives Dashboard Component - Redesigned
function DerivativesDashboard({ data }) {
  return (
    <div className="space-y-6">
      {/* Options & Futures Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gray-900/40 backdrop-blur-xl border-gray-800 rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-gray-800/50">
            <CardTitle className="text-xl font-semibold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 bg-opacity-20">
                <BarChart3 className="w-5 h-5 text-orange-400" />
              </div>
              Options & Futures Overview
            </CardTitle>
            <CardDescription className="text-gray-500">
              Derivatives market analysis and metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64">
                <h3 className="text-sm font-medium mb-3 text-gray-400">Open Interest by Asset</h3>
                <Doughnut
                  data={{
                    labels: ['BTC', 'ETH', 'SOL', 'Others'],
                    datasets: [{
                      data: data?.openInterest || [18500000000, 8200000000, 1800000000, 3500000000],
                      backgroundColor: [
                        'rgba(247, 147, 26, 0.8)',
                        'rgba(98, 126, 234, 0.8)',
                        'rgba(0, 255, 163, 0.8)',
                        'rgba(107, 114, 128, 0.8)'
                      ],
                      borderColor: ['#F7931A', '#627EEA', '#00FFA3', '#6B7280'],
                      borderWidth: 2,
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: { 
                          color: '#9CA3AF',
                          padding: 15,
                          font: {
                            size: 11
                          }
                        }
                      },
                      tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.9)',
                        titleColor: '#F3F4F6',
                        bodyColor: '#D1D5DB',
                        borderColor: 'rgba(75, 85, 99, 0.3)',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                      }
                    }
                  }}
                />
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-medium mb-3 text-gray-400">Market Indicators</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-xl">
                    <span className="text-gray-400">24h Volume</span>
                    <span className="font-bold text-lg">${data?.volume24h || '142.8B'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-xl">
                    <span className="text-gray-400">Open Interest</span>
                    <span className="font-bold text-lg">${data?.totalOI || '32.0B'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-xl">
                    <span className="text-gray-400">Long/Short Ratio</span>
                    <span className="font-bold text-lg text-emerald-400">{data?.lsRatio || '1.24'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-xl">
                    <span className="text-gray-400">Funding Rate (BTC)</span>
                    <span className="font-bold text-lg text-yellow-400">{data?.fundingRate || '0.012%'}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Options Flow */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gray-900/40 backdrop-blur-xl border-gray-800 rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-gray-800/50">
              <CardTitle className="text-lg font-semibold">Options Flow</CardTitle>
              <CardDescription className="text-gray-500">Large options trades today</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {(data?.optionsFlow || mockOptionsFlow).map((trade, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-3 bg-gray-800/50 rounded-xl hover:bg-gray-800/70 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">{trade.asset}</span>
                          <span className="text-gray-400 text-sm">{trade.strike}</span>
                          <Badge variant="outline" className={`text-xs ${
                            trade.type === 'CALL' 
                              ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' 
                              : 'text-red-400 border-red-400/30 bg-red-400/10'
                          }`}>
                            {trade.type}
                          </Badge>
                        </div>
                        <span className="font-bold">${trade.premium}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Exp: {trade.expiry} • Size: {trade.size}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* Liquidation Heatmap */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gray-900/40 backdrop-blur-xl border-gray-800 rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-gray-800/50">
              <CardTitle className="text-lg font-semibold">Liquidation Heatmap</CardTitle>
              <CardDescription className="text-gray-500">Potential liquidation levels</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-64">
                <Bar
                  data={{
                    labels: data?.liquidationLevels || ['$42k', '$43k', '$44k', '$45k', '$46k', '$47k'],
                    datasets: [
                      {
                        label: 'Longs',
                        data: data?.longLiquidations || [120, 85, 45, 20, 10, 5],
                        backgroundColor: 'rgba(16, 185, 129, 0.6)',
                        borderColor: '#10B981',
                        borderWidth: 2,
                        borderRadius: 6,
                      },
                      {
                        label: 'Shorts',
                        data: data?.shortLiquidations || [5, 10, 25, 60, 95, 140],
                        backgroundColor: 'rgba(239, 68, 68, 0.6)',
                        borderColor: '#EF4444',
                        borderWidth: 2,
                        borderRadius: 6,
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: { 
                        grid: { 
                          color: 'rgba(75, 85, 99, 0.2)',
                          drawBorder: false,
                        }, 
                        ticks: { 
                          color: '#9CA3AF',
                          font: {
                            size: 11
                          }
                        },
                        stacked: true
                      },
                      y: { 
                        grid: { 
                          color: 'rgba(75, 85, 99, 0.2)',
                          drawBorder: false,
                        }, 
                        ticks: { 
                          color: '#9CA3AF',
                          font: {
                            size: 11
                          }
                        },
                        title: { 
                          display: true, 
                          text: 'Liquidations (M)', 
                          color: '#6B7280',
                          font: {
                            size: 12
                          }
                        },
                        stacked: true
                      }
                    },
                    plugins: {
                      legend: { 
                        labels: { 
                          color: '#9CA3AF',
                          usePointStyle: true,
                          padding: 15,
                          font: {
                            size: 12
                          }
                        } 
                      },
                      tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.9)',
                        titleColor: '#F3F4F6',
                        bodyColor: '#D1D5DB',
                        borderColor: 'rgba(75, 85, 99, 0.3)',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                      }
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

// Sentiment Analysis Component - Redesigned
function SentimentAnalysis({ data }) {
  return (
    <div className="space-y-6">
      {/* AI-Powered Market Sentiment */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gray-900/40 backdrop-blur-xl border-gray-800 rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-gray-800/50">
            <CardTitle className="text-xl font-semibold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 bg-opacity-20">
                <Brain className="w-5 h-5 text-pink-400" />
              </div>
              AI-Powered Market Sentiment
              <Badge className="ml-auto bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-400 border-pink-400/30">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Enhanced
              </Badge>
            </CardTitle>
            <CardDescription className="text-gray-500">
              Real-time sentiment analysis from multiple sources
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="text-center p-6 bg-gradient-to-br from-gray-800/50 to-gray-800/30 rounded-2xl border border-gray-700/50"
              >
                <div className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                  {data?.overallSentiment || '72'}
                </div>
                <div className="text-sm text-gray-400 mt-2">Overall Score</div>
                <Badge className="mt-3 bg-emerald-500/20 text-emerald-400 border-emerald-400/30 font-semibold">
                  Bullish
                </Badge>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="text-center p-6 bg-gradient-to-br from-gray-800/50 to-gray-800/30 rounded-2xl border border-gray-700/50"
              >
                <div className="text-5xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  {data?.fearGreed || '68'}
                </div>
                <div className="text-sm text-gray-400 mt-2">Fear & Greed Index</div>
                <Badge className="mt-3 bg-yellow-500/20 text-yellow-400 border-yellow-400/30 font-semibold">
                  Greed
                </Badge>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="text-center p-6 bg-gradient-to-br from-gray-800/50 to-gray-800/30 rounded-2xl border border-gray-700/50"
              >
                <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  {data?.socialVolume || '8.2M'}
                </div>
                <div className="text-sm text-gray-400 mt-2">Social Volume</div>
                <Badge className="mt-3 bg-blue-500/20 text-blue-400 border-blue-400/30 font-semibold">
                  +24% 24h
                </Badge>
              </motion.div>
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
                      backgroundColor: 'rgba(29, 161, 242, 0.1)',
                      tension: 0.4,
                      borderWidth: 3,
                      pointRadius: 0,
                      pointHoverRadius: 6,
                      pointHoverBackgroundColor: '#1DA1F2',
                      pointHoverBorderColor: '#fff',
                      pointHoverBorderWidth: 2,
                    },
                    {
                      label: 'Reddit',
                      data: data?.redditSentiment || [60, 62, 68, 65, 70, 68],
                      borderColor: '#FF4500',
                      backgroundColor: 'rgba(255, 69, 0, 0.1)',
                      tension: 0.4,
                      borderWidth: 3,
                      pointRadius: 0,
                      pointHoverRadius: 6,
                      pointHoverBackgroundColor: '#FF4500',
                      pointHoverBorderColor: '#fff',
                      pointHoverBorderWidth: 2,
                    },
                    {
                      label: 'News',
                      data: data?.newsSentiment || [70, 72, 75, 73, 78, 75],
                      borderColor: '#10B981',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      tension: 0.4,
                      borderWidth: 3,
                      pointRadius: 0,
                      pointHoverRadius: 6,
                      pointHoverBackgroundColor: '#10B981',
                      pointHoverBorderColor: '#fff',
                      pointHoverBorderWidth: 2,
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: {
                    mode: 'index',
                    intersect: false,
                  },
                  scales: {
                    x: { 
                      grid: { 
                        color: 'rgba(75, 85, 99, 0.2)',
                        drawBorder: false,
                      }, 
                      ticks: { 
                        color: '#9CA3AF',
                        font: {
                          size: 11
                        }
                      } 
                    },
                    y: { 
                      grid: { 
                        color: 'rgba(75, 85, 99, 0.2)',
                        drawBorder: false,
                      }, 
                      ticks: { 
                        color: '#9CA3AF',
                        font: {
                          size: 11
                        }
                      },
                      min: 0,
                      max: 100,
                      title: { 
                        display: true, 
                        text: 'Sentiment Score', 
                        color: '#6B7280',
                        font: {
                          size: 12
                        }
                      }
                    }
                  },
                  plugins: {
                    legend: { 
                      labels: { 
                        color: '#9CA3AF',
                        usePointStyle: true,
                        padding: 20,
                        font: {
                          size: 12
                        }
                      } 
                    },
                    tooltip: {
                      backgroundColor: 'rgba(17, 24, 39, 0.9)',
                      titleColor: '#F3F4F6',
                      bodyColor: '#D1D5DB',
                      borderColor: 'rgba(75, 85, 99, 0.3)',
                      borderWidth: 1,
                      padding: 12,
                      cornerRadius: 8,
                      displayColors: true,
                      usePointStyle: true,
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trending Topics */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gray-900/40 backdrop-blur-xl border-gray-800 rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-gray-800/50">
              <CardTitle className="text-lg font-semibold">Trending Topics</CardTitle>
              <CardDescription className="text-gray-500">Most discussed crypto topics</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {(data?.trendingTopics || mockTrendingTopics).map((topic, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ x: 4 }}
                    className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800/70 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{topic.emoji}</span>
                      <div>
                        <div className="font-medium text-white">{topic.name}</div>
                        <div className="text-sm text-gray-400">{topic.mentions} mentions</div>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-sm font-semibold ${
                      topic.sentiment > 0 
                        ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' 
                        : 'text-red-400 border-red-400/30 bg-red-400/10'
                    }`}>
                      {topic.sentiment > 0 ? '+' : ''}{topic.sentiment}%
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Influencer Sentiment */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gray-900/40 backdrop-blur-xl border-gray-800 rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-gray-800/50">
              <CardTitle className="text-lg font-semibold">Influencer Sentiment</CardTitle>
              <CardDescription className="text-gray-500">Key opinion leaders' market views</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {(data?.influencers || mockInfluencers).map((influencer, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-4 bg-gradient-to-r from-gray-800/50 to-gray-800/30 rounded-xl border border-gray-700/50 hover:border-pink-500/30 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                          {influencer.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-white">{influencer.name}</div>
                          <div className="text-xs text-gray-400">{influencer.followers} followers</div>
                        </div>
                      </div>
                      <Badge className={`font-semibold ${
                        influencer.stance === 'Bullish' 
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-400/30' 
                          : influencer.stance === 'Bearish'
                          ? 'bg-red-500/20 text-red-400 border-red-400/30'
                          : 'bg-gray-500/20 text-gray-400 border-gray-400/30'
                      }`}>
                        {influencer.stance}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-300 italic leading-relaxed">"{influencer.lastTweet}"</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

// Risk Management Component - Redesigned
function RiskManagement({ data }) {
  return (
    <div className="space-y-6">
      {/* Risk Alert */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Alert className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 backdrop-blur-xl border-yellow-500/30">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <AlertDescription className="text-gray-300">
            <span className="font-semibold text-white">Market Risk Level: </span>
            <Badge className="ml-2 bg-yellow-500/20 text-yellow-400 border-yellow-400/30 font-semibold">
              MODERATE
            </Badge>
            <span className="text-sm text-gray-400 ml-4">
              Increased volatility detected across major trading pairs
            </span>
          </AlertDescription>
        </Alert>
      </motion.div>

      {/* Risk Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <RiskMetricCard
          title="Volatility Index"
          value={data?.volatilityIndex || '68.5'}
          status="high"
          description="24h price volatility"
          gradient="from-red-500 to-rose-500"
        />
        <RiskMetricCard
          title="Correlation Risk"
          value={data?.correlationRisk || '0.82'}
          status="medium"
          description="Cross-asset correlation"
          gradient="from-yellow-500 to-orange-500"
        />
        <RiskMetricCard
          title="Liquidity Score"
          value={data?.liquidityScore || '7.2/10'}
          status="good"
          description="Market depth quality"
          gradient="from-emerald-500 to-green-500"
        />
        <RiskMetricCard
          title="Systemic Risk"
          value={data?.systemicRisk || '42%'}
          status="medium"
          description="Overall market risk"
          gradient="from-purple-500 to-violet-500"
        />
      </div>

      {/* Portfolio Risk Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-gray-900/40 backdrop-blur-xl border-gray-800 rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-gray-800/50">
            <CardTitle className="text-xl font-semibold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 bg-opacity-20">
                <Shield className="w-5 h-5 text-red-400" />
              </div>
              Portfolio Risk Analysis
            </CardTitle>
            <CardDescription className="text-gray-500">
              Risk metrics for a balanced crypto portfolio
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64">
                <h3 className="text-sm font-medium mb-3 text-gray-400">Risk Distribution</h3>
                <Radar
                  data={{
                    labels: ['Market Risk', 'Liquidity Risk', 'Credit Risk', 'Operational Risk', 'Regulatory Risk', 'Technical Risk'],
                    datasets: [{
                      label: 'Current Risk Level',
                      data: data?.riskLevels || [75, 45, 30, 55, 60, 40],
                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                      borderColor: '#EF4444',
                      pointBackgroundColor: '#EF4444',
                      pointBorderColor: '#fff',
                      pointHoverBackgroundColor: '#fff',
                      pointHoverBorderColor: '#EF4444',
                      borderWidth: 2,
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      r: {
                        angleLines: { color: 'rgba(75, 85, 99, 0.3)' },
                        grid: { color: 'rgba(75, 85, 99, 0.3)' },
                        pointLabels: { 
                          color: '#9CA3AF', 
                          font: { size: 10 } 
                        },
                        ticks: { 
                          color: '#6B7280', 
                          backdropColor: 'transparent',
                          font: { size: 9 }
                        },
                        suggestedMin: 0,
                        suggestedMax: 100
                      }
                    },
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.9)',
                        titleColor: '#F3F4F6',
                        bodyColor: '#D1D5DB',
                        borderColor: 'rgba(75, 85, 99, 0.3)',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                      }
                    }
                  }}
                />
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-400">Risk Mitigation Strategies</h3>
                <div className="space-y-2">
                  {(data?.strategies || mockStrategies).map((strategy, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-xl hover:bg-gray-800/70 transition-all duration-300"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium text-sm text-white">{strategy.title}</div>
                        <div className="text-xs text-gray-400 mt-1 leading-relaxed">{strategy.description}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Black Swan Event Monitor */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-gray-900/40 backdrop-blur-xl border-gray-800 rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-gray-800/50">
            <CardTitle className="text-xl font-semibold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 bg-opacity-20">
                <AlertTriangle className="w-5 h-5 text-purple-400" />
              </div>
              Black Swan Event Monitor
            </CardTitle>
            <CardDescription className="text-gray-500">
              Potential high-impact, low-probability events
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {(data?.blackSwanEvents || mockBlackSwanEvents).map((event, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 hover:border-purple-500/30 transition-all duration-300">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                          event.severity === 'high' ? 'text-red-400' : 
                          event.severity === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                        }`} />
                        <div>
                          <span className="font-semibold text-white">{event.title}</span>
                          <p className="text-sm text-gray-400 mt-1 leading-relaxed">{event.description}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          {event.probability}% chance
                        </Badge>
                        <Badge className={`text-xs whitespace-nowrap ${
                          event.impact === 'high' 
                            ? 'bg-red-500/20 text-red-400 border-red-400/30' 
                            : event.impact === 'medium' 
                            ? 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30' 
                            : 'bg-blue-500/20 text-blue-400 border-blue-400/30'
                        }`}>
                          {event.impact} impact
                        </Badge>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// Risk Metric Card Component - Redesigned
function RiskMetricCard({ title, value, status, description, gradient }) {
  const statusColors = {
    good: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
    medium: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
    high: 'text-red-400 border-red-400/30 bg-red-400/10'
  };

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative group"
    >
      <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl blur-xl`} />
      <Card className="relative bg-gray-900/60 backdrop-blur-xl border-gray-800 hover:border-gray-700 transition-colors duration-300 rounded-2xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <Shield className="w-5 h-5 text-gray-400" />
            <Badge variant="outline" className={`text-xs font-semibold ${statusColors[status]}`}>
              {status.toUpperCase()}
            </Badge>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              {value}
            </div>
            <div className="text-sm font-medium text-gray-300">{title}</div>
            <div className="text-xs text-gray-500">{description}</div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
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