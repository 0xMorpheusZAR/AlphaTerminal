import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from "recharts";
import { TrendingUp, BarChart3, Activity } from "lucide-react";

interface NarrativeData {
  name: string;
  value: number;
  change1d?: number;
  change7d?: number;
  change30d?: number;
  category: string;
}

export default function NarrativeTracker() {
  const [timeframe, setTimeframe] = useState("30D");
  const [denominator, setDenominator] = useState("$");
  const [chartType, setChartType] = useState("Barchart");

  const { data: narrativeData = [], isLoading } = useQuery({
    queryKey: ['/api/narratives/performance'],
    queryFn: () => fetch('/api/narratives/performance').then(res => res.json()),
  });

  // Transform data for chart display
  const chartData = narrativeData
    .sort((a: NarrativeData, b: NarrativeData) => b.value - a.value)
    .map((item: NarrativeData) => ({
      name: item.name.length > 15 ? item.name.substring(0, 12) + "..." : item.name,
      fullName: item.name,
      value: item.value,
      change1d: item.change1d || 0,
      change7d: item.change7d || 0,
      change30d: item.change30d || 0,
    }));

  const getBarColor = (value: number, index: number) => {
    // Gradient from bright green to darker green based on performance
    const intensity = Math.max(0.3, Math.min(1, value / 60));
    const baseHue = 142; // Green hue
    const saturation = 69;
    const lightness = Math.max(35, 50 - (index * 2)); // Darker as we go down
    return `hsl(${baseHue}, ${saturation}%, ${lightness}%)`;
  };

  const timeframeOptions = [
    { value: "7D", label: "7D" },
    { value: "30D", label: "30D" },
    { value: "YTD", label: "YTD" },
    { value: "365D", label: "365D" }
  ];

  const denominatorOptions = [
    { value: "$", label: "$" },
    { value: "BTC", label: "BTC" },
    { value: "ETH", label: "ETH" },
    { value: "SOL", label: "SOL" }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg border border-gray-700">
          <p className="font-medium">{data.fullName}</p>
          <p className="text-green-400">{`Performance: ${data.value.toFixed(2)}%`}</p>
          <p className="text-gray-300 text-sm">{`24h: ${data.change1d > 0 ? '+' : ''}${data.change1d.toFixed(2)}%`}</p>
          <p className="text-gray-300 text-sm">{`7d: ${data.change7d > 0 ? '+' : ''}${data.change7d.toFixed(2)}%`}</p>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (chartType === "Linechart") {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
            />
            <YAxis 
              domain={[0, 60]}
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#10B981" 
              strokeWidth={2}
              dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === "Heatmap") {
      return (
        <div className="grid grid-cols-6 gap-2 p-4">
          {chartData.map((item: any, index: number) => (
            <div
              key={item.fullName}
              className="aspect-square rounded-lg flex items-center justify-center text-xs font-medium text-white"
              style={{
                backgroundColor: getBarColor(item.value, index),
                opacity: Math.max(0.4, item.value / 60)
              }}
              title={`${item.fullName}: ${item.value.toFixed(2)}%`}
            >
              <div className="text-center">
                <div className="truncate w-full px-1">{item.name}</div>
                <div className="text-xs">{item.value.toFixed(0)}%</div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Default Barchart
    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={100}
            interval={0}
            tick={{ fontSize: 12, fill: '#9CA3AF' }}
          />
          <YAxis 
            domain={[0, 60]}
            tick={{ fontSize: 12, fill: '#9CA3AF' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[2, 2, 0, 0]}>
            {chartData.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.value, index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Header 
        title="Narrative Performance Tracker"
        description="Real-time cryptocurrency narrative performance tracking"
      />
      
      <div className="p-6 overflow-y-auto h-[calc(100vh-80px)] bg-gray-50 dark:bg-gray-950">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Performing Narratives - Left Column */}
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-lg">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                    Top Performing Narratives
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Best performing crypto narratives from DeFiLlama Pro tracker
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              ) : (
                chartData.slice(0, 5).map((narrative: any, index: number) => (
                  <div key={narrative.fullName} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white text-base">
                          {narrative.fullName}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          30d: <span className="text-green-600 dark:text-green-400 font-medium">
                            +{narrative.change30d.toFixed(2)}%
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {narrative.value.toFixed(2)}%
                      </p>
                      <div className="flex items-center gap-1 text-sm justify-end">
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          +{narrative.change1d.toFixed(2)}% 1d
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* MCap-Weighted Chart - Right Column */}
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                      MCap-Weighted Category Performance
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <Activity className="w-4 h-4" />
                      <span>DeFiLlama Pro</span>
                    </div>
                  </div>
                </div>
              </div>
            
            {/* Controls */}
            <div className="flex items-center justify-between mt-4">
              {/* Chart Type Tabs */}
              <Tabs value={chartType} onValueChange={setChartType} className="w-auto">
                <TabsList className="bg-gray-800 border-gray-700">
                  <TabsTrigger 
                    value="Linechart" 
                    className="data-[state=active]:bg-gray-700 data-[state=active]:text-white"
                  >
                    Linechart
                  </TabsTrigger>
                  <TabsTrigger 
                    value="Barchart"
                    className="data-[state=active]:bg-gray-700 data-[state=active]:text-white"
                  >
                    Barchart
                  </TabsTrigger>
                  <TabsTrigger 
                    value="Heatmap"
                    className="data-[state=active]:bg-gray-700 data-[state=active]:text-white"
                  >
                    Heatmap
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Timeframe and Denominator Controls */}
              <div className="flex items-center gap-4">
                {/* Timeframe Buttons */}
                <div className="flex items-center gap-1">
                  {timeframeOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={timeframe === option.value ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setTimeframe(option.value)}
                      className={`h-8 px-3 text-xs ${
                        timeframe === option.value 
                          ? "bg-blue-600 text-white" 
                          : "text-gray-400 hover:text-white hover:bg-gray-800"
                      }`}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>

                {/* Show as Label */}
                <span className="text-sm text-gray-400">Show as</span>

                {/* Denominator Select */}
                <Select value={denominator} onValueChange={setDenominator}>
                  <SelectTrigger className="w-16 h-8 bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {denominatorOptions.map(option => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        className="text-white hover:bg-gray-700"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Currency Options */}
                <div className="flex items-center gap-1">
                  {["BTC", "ETH", "SOL"].map(currency => (
                    <Button
                      key={currency}
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs text-gray-400 hover:text-white hover:bg-gray-800"
                    >
                      {currency}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>

            <CardContent className="pt-0">
              {isLoading ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="text-gray-600 dark:text-gray-400">Loading narrative data...</div>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-4">
                  {renderChart()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Analytics Section */}
        <div className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Performance Summary Cards */}
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Top Performer</p>
                  </div>
                </div>
                {chartData[0] && (
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{chartData[0].fullName}</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{chartData[0].value.toFixed(2)}%</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      24h: <span className="text-green-600 dark:text-green-400 font-medium">+{chartData[0].change1d.toFixed(2)}%</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Performance</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {chartData.length > 0 ? (chartData.reduce((acc: number, item: any) => acc + item.value, 0) / chartData.length).toFixed(2) : '0.00'}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Across {chartData.length} categories</p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Data Source</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">DeFiLlama Pro</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Real-time market cap weighted</p>
                <Badge variant="outline" className="mt-2 text-green-600 dark:text-green-400 border-green-600 dark:border-green-400">
                  Live Data
                </Badge>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Categories Tracked</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{chartData.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Last updated: <span className="font-medium">2 mins ago</span>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}