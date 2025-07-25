import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNewsAutoRefresh } from "@/hooks/use-real-time";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { NewsItem } from "@/types";

export default function VeloNews() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAutoRefresh, toggleAutoRefresh } = useNewsAutoRefresh();
  
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [coinFilter, setCoinFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: news = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/news'],
    queryFn: () => api.news.getAll(100),
    refetchInterval: isAutoRefresh ? 10000 : false,
  });

  const syncNewsMutation = useMutation({
    mutationFn: () => api.news.sync(50),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/news'] });
      toast({
        title: "News Synced",
        description: "Latest news has been fetched from Velo Data API.",
      });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Unable to fetch latest news. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRefresh = () => {
    refetch();
  };

  const handleSync = () => {
    syncNewsMutation.mutate();
  };

  const getPriorityBadge = (priority: number) => {
    switch (priority) {
      case 1:
        return <Badge variant="destructive">HIGH</Badge>;
      case 2:
        return <Badge variant="secondary">NORMAL</Badge>;
      default:
        return <Badge variant="outline">LOW</Badge>;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getBloFinTradingUrl = (coin: string) => {
    return `https://www.blofin.com/en/futures/${coin.toLowerCase()}usdt`;
  };

  // Filter news based on criteria
  const filteredNews = news.filter((item: NewsItem) => {
    const matchesPriority = priorityFilter === "all" || item.priority?.toString() === priorityFilter;
    const matchesCoin = !coinFilter || (item.coins && item.coins.some(coin => 
      coin.toLowerCase().includes(coinFilter.toLowerCase())
    ));
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.source?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesPriority && matchesCoin && matchesSearch;
  });

  // Get unique coins for filter dropdown
  const allCoins = Array.from(new Set(news.flatMap((item: NewsItem) => item.coins || []))).sort();

  return (
    <div className="flex-1 overflow-hidden">
      <Header 
        title="Velo News Dashboard"
        description="Real-time cryptocurrency news with ultra-fast 10-second refresh rate"
        onRefresh={handleRefresh}
      />
      
      <div className="p-6 overflow-y-auto h-[calc(100vh-80px)]">
        {/* News Controls */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  Real-Time Crypto News
                  <div className={`w-2 h-2 rounded-full ml-2 ${isAutoRefresh ? 'bg-success animate-pulse' : 'bg-muted'}`}></div>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Live news feed with BloFin trading integration and priority filtering
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-refresh"
                    checked={isAutoRefresh}
                    onCheckedChange={toggleAutoRefresh}
                  />
                  <Label htmlFor="auto-refresh" className="text-sm">
                    Auto-refresh {isAutoRefresh ? '(10s)' : '(OFF)'}
                  </Label>
                </div>
                <Button 
                  onClick={handleSync}
                  disabled={syncNewsMutation.isPending}
                  variant="outline"
                >
                  <i className="fas fa-sync-alt mr-2"></i>
                  {syncNewsMutation.isPending ? 'Syncing...' : 'Sync'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search news by title or source..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="1">High Priority</SelectItem>
                  <SelectItem value="2">Normal Priority</SelectItem>
                  <SelectItem value="3">Low Priority</SelectItem>
                </SelectContent>
              </Select>
              <Select value={coinFilter} onValueChange={setCoinFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by coin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Coins</SelectItem>
                  {allCoins.slice(0, 20).map((coin) => (
                    <SelectItem key={coin} value={coin}>{coin}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* News Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{news.length}</p>
                  <p className="text-sm text-muted-foreground">Total News Items</p>
                </div>
                <i className="fas fa-newspaper text-2xl text-primary"></i>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-destructive">
                    {news.filter((item: NewsItem) => item.priority === 1).length}
                  </p>
                  <p className="text-sm text-muted-foreground">High Priority</p>
                </div>
                <Badge variant="destructive">HIGH</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-success">{allCoins.length}</p>
                  <p className="text-sm text-muted-foreground">Tracked Coins</p>
                </div>
                <i className="fas fa-coins text-2xl text-success"></i>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-warning">
                    {news.filter((item: NewsItem) => {
                      const publishedTime = new Date(item.publishedAt).getTime();
                      const now = new Date().getTime();
                      return (now - publishedTime) < 3600000; // Last hour
                    }).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Last Hour</p>
                </div>
                <i className="fas fa-clock text-2xl text-warning"></i>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* News Feed */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Live News Feed</CardTitle>
              <Badge variant={isAutoRefresh ? "default" : "secondary"}>
                {isAutoRefresh ? 'LIVE' : 'MANUAL'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="border border-border rounded-lg p-4 animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : filteredNews.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-newspaper text-4xl text-muted-foreground mb-4"></i>
                  <p className="text-muted-foreground mb-4">
                    {news.length === 0 ? 'No news items available' : 'No news items match your filters'}
                  </p>
                  {news.length === 0 && (
                    <Button 
                      onClick={handleSync}
                      variant="outline"
                    >
                      Fetch Latest News
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredNews.map((item: NewsItem) => (
                    <div key={item.id} className="border border-border rounded-lg p-4 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getPriorityBadge(item.priority || 2)}
                          <span className="text-sm text-muted-foreground">
                            {formatTimeAgo(item.publishedAt)}
                          </span>
                          {item.source && (
                            <Badge variant="outline" className="text-xs">
                              {item.source}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {item.coins && item.coins.length > 0 && (
                            <>
                              <div className="flex space-x-1">
                                {item.coins.slice(0, 3).map((coin) => (
                                  <Badge key={coin} variant="secondary" className="text-xs">
                                    {coin}
                                  </Badge>
                                ))}
                                {item.coins.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{item.coins.length - 3}
                                  </Badge>
                                )}
                              </div>
                              <Button 
                                size="sm"
                                onClick={() => window.open(getBloFinTradingUrl(item.coins?.[0] || 'BTC'), '_blank')}
                                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                              >
                                <i className="fas fa-chart-line mr-1"></i>
                                Trade
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <h4 className="font-medium mb-2 text-foreground leading-relaxed">
                        {item.title}
                      </h4>
                      
                      {item.content && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {item.content}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {item.sourceUrl && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => window.open(item.sourceUrl, '_blank')}
                            >
                              <i className="fas fa-external-link-alt mr-2"></i>
                              View Source
                            </Button>
                          )}
                        </div>
                        {item.effectivePrice && (
                          <div className="text-right">
                            <span className="text-xs text-muted-foreground">Effective Price</span>
                            <p className="text-sm font-mono text-success">
                              ${parseFloat(item.effectivePrice).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
