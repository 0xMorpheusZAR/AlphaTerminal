import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNewsAutoRefresh } from "@/hooks/use-real-time";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { NewsItem } from "@/types";

export default function VeloNewsWidget() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAutoRefresh, toggleAutoRefresh } = useNewsAutoRefresh();

  const { data: news = [], isLoading } = useQuery({
    queryKey: ['/api/news'],
    queryFn: () => api.news.getAll(20),
    refetchInterval: isAutoRefresh ? 10000 : false,
  });

  const syncNewsMutation = useMutation({
    mutationFn: () => api.news.sync(20),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/news'] });
      toast({
        title: "News Synced",
        description: "Latest news has been fetched from Velo Data.",
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

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              Velo News Dashboard
              <div className={`w-2 h-2 rounded-full ml-2 ${isAutoRefresh ? 'bg-success animate-pulse' : 'bg-muted'}`}></div>
            </CardTitle>
            <p className="text-sm text-muted-foreground">Real-time crypto news with 10-second refresh</p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant={isAutoRefresh ? "default" : "secondary"}>
              Auto-refresh {isAutoRefresh ? 'ON' : 'OFF'}
            </Badge>
            <Button 
              onClick={toggleAutoRefresh}
              variant="outline"
              size="sm"
            >
              <i className="fas fa-sync-alt mr-2"></i>
              {isAutoRefresh ? '10s' : 'Manual'}
            </Button>
            <Button 
              onClick={() => syncNewsMutation.mutate()}
              disabled={syncNewsMutation.isPending}
              size="sm"
            >
              <i className="fas fa-download mr-2"></i>
              Sync
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border border-border rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : news.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No news items available</p>
              <Button 
                onClick={() => syncNewsMutation.mutate()}
                className="mt-4"
                variant="outline"
              >
                Fetch Latest News
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {news.map((item: NewsItem) => (
                <div key={item.id} className="border border-border rounded-lg p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getPriorityBadge(item.priority || 2)}
                      <span className="text-sm text-muted-foreground">
                        {formatTimeAgo(item.publishedAt)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {item.coins && item.coins.length > 0 && (
                        <>
                          <Badge variant="outline">
                            {item.coins[0]}
                          </Badge>
                          <Button 
                            size="sm"
                            onClick={() => window.open(getBloFinTradingUrl(item.coins?.[0] || 'BTC'), '_blank')}
                          >
                            Trade
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <h4 className="font-medium mb-2">{item.title}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {item.source || 'Unknown Source'}
                    </span>
                    {item.effectivePrice && (
                      <span className="text-sm tabular-nums text-success">
                        ${parseFloat(item.effectivePrice).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
