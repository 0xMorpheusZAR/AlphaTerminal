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
    <div className="flex-1 overflow-hidden bg-gray-950 text-white">
      <Header 
        title="MCap-Weighted Category Performance"
        description="Real-time cryptocurrency narrative performance tracking"
      />
      
      <div className="p-6 overflow-y-auto h-[calc(100vh-80px)]">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-white">
                MCap-Weighted Category Performance
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Activity className="w-4 h-4" />
                DefiLlama
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
                <div className="text-gray-400">Loading narrative data...</div>
              </div>
            ) : (
              <div className="bg-gray-950 rounded-lg p-4">
                {renderChart()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Top Performer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData[0] && (
                <div>
                  <p className="text-lg font-bold text-white">{chartData[0].fullName}</p>
                  <p className="text-2xl font-bold text-green-400">{chartData[0].value.toFixed(2)}%</p>
                  <p className="text-sm text-gray-400">
                    24h: <span className="text-green-400">+{chartData[0].change1d.toFixed(2)}%</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">
                Average Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">
                {chartData.length > 0 ? (chartData.reduce((acc: number, item: any) => acc + item.value, 0) / chartData.length).toFixed(2) : '0.00'}%
              </p>
              <p className="text-sm text-gray-400">Across {chartData.length} categories</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">
                Data Source
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium text-white">DeFiLlama Pro</p>
              <p className="text-sm text-gray-400">Real-time market cap weighted</p>
              <Badge variant="outline" className="mt-2 text-green-400 border-green-400">
                Live Data
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}