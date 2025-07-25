import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import MetricsCard from "@/components/widgets/metrics-card";
import FailureTimelineChart from "@/components/charts/failure-timeline-chart";
import SectorBreakdownChart from "@/components/charts/sector-breakdown-chart";
import VeloNewsWidget from "@/components/widgets/velo-news-widget";
import MonteCarloWidget from "@/components/widgets/monte-carlo-widget";
import HyperliquidSuccess from "@/components/widgets/hyperliquid-success";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: api.dashboard.getStats,
  });

  const handleRefresh = () => {
    refetch();
  };

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatNumber = (value: number) => {
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return value.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-hidden">
        <Header 
          title="Analytics Dashboard"
          description="Real-time cryptocurrency failure analytics and market insights"
          onRefresh={handleRefresh}
        />
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-16 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden">
      <Header 
        title="Analytics Dashboard"
        description="Real-time cryptocurrency failure analytics and market insights"
        onRefresh={handleRefresh}
      />
      
      <div className="p-6 overflow-y-auto h-[calc(100vh-80px)]">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricsCard
            title="Failed Tokens (90%+ decline)"
            value={stats?.failedTokens || 0}
            change="-2.3%"
            changeType="negative"
            icon="fas fa-exclamation-triangle"
            iconColor="bg-destructive/10 text-destructive"
            delay={0}
          />
          
          <MetricsCard
            title="Pending Token Unlocks"
            value={stats?.pendingUnlocks || 0}
            change={formatCurrency(stats?.totalUnlockValue || 155000000000)}
            changeType="neutral"
            icon="fas fa-unlock"
            iconColor="bg-warning/10 text-warning"
            delay={0.1}
          />
          
          <MetricsCard
            title="DeFi Protocol Revenue"
            value={formatCurrency(stats?.totalRevenue || 2800000000)}
            change="+12.4%"
            changeType="positive"
            icon="fas fa-money-bill-wave"
            iconColor="bg-success/10 text-success"
            delay={0.2}
          />
          
          <MetricsCard
            title="Tokens Tracked"
            value={formatNumber(stats?.activeTracking || 10847)}
            change="Live"
            changeType="neutral"
            icon="fas fa-chart-line"
            iconColor="bg-primary/10 text-primary"
            delay={0.3}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Token Failure Timeline</CardTitle>
                  <p className="text-sm text-muted-foreground">90%+ decline from ATH over time</p>
                </div>
                <select className="bg-input border border-border rounded-lg px-3 py-1 text-sm">
                  <option value="1h">1H</option>
                  <option value="24h">24H</option>
                  <option value="7d">7D</option>
                  <option value="30d">30D</option>
                  <option value="1y">1Y</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <FailureTimelineChart />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sector Breakdown</CardTitle>
              <p className="text-sm text-muted-foreground">Failed tokens by category</p>
            </CardHeader>
            <CardContent>
              <SectorBreakdownChart />
            </CardContent>
          </Card>
        </div>

        {/* News and Monte Carlo Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <VeloNewsWidget />
          <MonteCarloWidget />
        </div>

        {/* Hyperliquid Success Story */}
        <HyperliquidSuccess />
      </div>
    </div>
  );
}
