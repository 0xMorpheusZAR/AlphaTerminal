import { useState, useEffect, useRef, useCallback } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { 
  RefreshCw, 
  Clock, 
  ExternalLink, 
  AlertCircle, 
  Loader2,
  ArrowDown,
  Wifi,
  WifiOff,
  Calendar
} from "lucide-react";
import { format, formatDistanceToNow, isWithinInterval, subHours } from "date-fns";
import type { NewsItem } from "@/types";

export default function VeloNewsEnhanced() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  
  // State
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [coinFilter, setCoinFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(false);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [newItemsCount, setNewItemsCount] = useState(0);

  // WebSocket ref
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch news
  const { data: news = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/news'],
    queryFn: () => api.news.getAll(1000), // Get more items for 48 hours
    refetchInterval: isAutoRefresh ? 30000 : false, // Refresh every 30 seconds
  });

  // Load historical news
  const loadHistoricalNews = useCallback(async () => {
    setIsLoadingHistorical(true);
    try {
      const response = await fetch('/api/news/historical');
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message);
      
      toast({
        title: "Historical Data Loaded",
        description: data.message,
      });
      
      await queryClient.invalidateQueries({ queryKey: ['/api/news'] });
    } catch (error) {
      toast({
        title: "Failed to Load Historical Data",
        description: "Could not fetch past 48 hours of news",
        variant: "destructive",
      });
    } finally {
      setIsLoadingHistorical(false);
    }
  }, [queryClient, toast]);

  // Setup WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    const connectWebSocket = () => {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('Connected to news stream');
        setWsStatus('connected');
        ws.send(JSON.stringify({ type: 'subscribe', channel: 'news' }));
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'news_update' && message.data) {
            queryClient.setQueryData(['/api/news'], (oldData: NewsItem[] | undefined) => {
              if (!oldData) return [message.data];
              
              // Add new item at the beginning
              const newData = [message.data, ...oldData];
              
              // If user is not at bottom, increment new items count
              if (!isAtBottom) {
                setNewItemsCount(prev => prev + 1);
              }
              
              return newData;
            });
            
            // Show notification if user is at bottom
            if (isAtBottom) {
              toast({
                title: "New Story",
                description: message.data.title,
              });
            }
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsStatus('disconnected');
      };
      
      ws.onclose = () => {
        console.log('WebSocket connection closed');
        setWsStatus('disconnected');
        
        // Attempt reconnection after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };
      
      wsRef.current = ws;
    };
    
    connectWebSocket();
    
    return () => {
      wsRef.current?.close();
    };
  }, [queryClient, toast, isAtBottom]);

  // Load historical data on mount
  useEffect(() => {
    loadHistoricalNews();
  }, [loadHistoricalNews]);

  // Sync mutation
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

  // Handle scroll
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const scrollContainer = event.currentTarget;
    const scrollPosition = scrollContainer.scrollTop + scrollContainer.clientHeight;
    const scrollHeight = scrollContainer.scrollHeight;
    
    // Check if user is at bottom (within 100px threshold)
    const atBottom = scrollHeight - scrollPosition < 100;
    setIsAtBottom(atBottom);
    
    // Clear new items count if scrolled to top
    if (scrollContainer.scrollTop < 100 && newItemsCount > 0) {
      setNewItemsCount(0);
    }
  }, [newItemsCount]);

  // Scroll to top
  const scrollToTop = () => {
    scrollAreaRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    setNewItemsCount(0);
  };

  // Filter news
  const filteredNews = news.filter((item) => {
    // Priority filter
    if (priorityFilter !== "all" && item.priority !== parseInt(priorityFilter)) {
      return false;
    }
    
    // Coin filter
    if (coinFilter && !item.coins.some(coin => 
      coin.toLowerCase().includes(coinFilter.toLowerCase())
    )) {
      return false;
    }
    
    // Search filter
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.content?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Group news by time periods
  const groupNewsByPeriod = (newsItems: NewsItem[]) => {
    const now = new Date();
    const oneHourAgo = subHours(now, 1);
    const sixHoursAgo = subHours(now, 6);
    const twentyFourHoursAgo = subHours(now, 24);
    const fortyEightHoursAgo = subHours(now, 48);
    
    const groups: { [key: string]: NewsItem[] } = {
      'Last Hour': [],
      'Last 6 Hours': [],
      'Last 24 Hours': [],
      'Last 48 Hours': [],
      'Older': []
    };
    
    newsItems.forEach(item => {
      const publishedAt = new Date(item.publishedAt);
      
      if (publishedAt > oneHourAgo) {
        groups['Last Hour'].push(item);
      } else if (publishedAt > sixHoursAgo) {
        groups['Last 6 Hours'].push(item);
      } else if (publishedAt > twentyFourHoursAgo) {
        groups['Last 24 Hours'].push(item);
      } else if (publishedAt > fortyEightHoursAgo) {
        groups['Last 48 Hours'].push(item);
      } else {
        groups['Older'].push(item);
      }
    });
    
    return groups;
  };

  const groupedNews = groupNewsByPeriod(filteredNews);

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
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Velo News Feed</h1>
          <p className="text-muted-foreground">
            Real-time cryptocurrency news from Velo Data API - Last 48 hours
          </p>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search news..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="1">High Priority</SelectItem>
                    <SelectItem value="2">Normal Priority</SelectItem>
                    <SelectItem value="3">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
                
                <Input
                  placeholder="Filter by coin..."
                  value={coinFilter}
                  onChange={(e) => setCoinFilter(e.target.value)}
                  className="w-full sm:w-[180px]"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={isAutoRefresh}
                    onCheckedChange={setIsAutoRefresh}
                    id="auto-refresh"
                  />
                  <Label htmlFor="auto-refresh">Auto-refresh</Label>
                </div>
                
                <div className="flex items-center gap-2">
                  {wsStatus === 'connected' ? (
                    <Badge variant="outline" className="gap-1">
                      <Wifi className="h-3 w-3" />
                      Live
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <WifiOff className="h-3 w-3" />
                      Offline
                    </Badge>
                  )}
                </div>
                
                <Button
                  onClick={() => refetch()}
                  disabled={isLoading}
                  size="sm"
                  variant="outline"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                
                <Button
                  onClick={() => loadHistoricalNews()}
                  disabled={isLoadingHistorical}
                  size="sm"
                  variant="outline"
                >
                  {isLoadingHistorical ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Calendar className="h-4 w-4 mr-2" />
                  )}
                  Load 48h
                </Button>
                
                <Button
                  onClick={() => syncNewsMutation.mutate()}
                  disabled={syncNewsMutation.isPending}
                  size="sm"
                >
                  {syncNewsMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Sync
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New items indicator */}
        {newItemsCount > 0 && (
          <div className="mb-4 flex justify-center">
            <Button
              onClick={scrollToTop}
              variant="secondary"
              size="sm"
              className="gap-2"
            >
              <ArrowDown className="h-4 w-4" />
              {newItemsCount} new {newItemsCount === 1 ? 'story' : 'stories'}
            </Button>
          </div>
        )}

        {/* News List */}
        <Card>
          <CardHeader>
            <CardTitle>News Feed ({filteredNews.length} items)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading || isLoadingHistorical ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                ))}
              </div>
            ) : filteredNews.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No news items found matching your filters.</p>
              </div>
            ) : (
              <ScrollArea 
                className="h-[600px]" 
                ref={scrollAreaRef}
                onScroll={handleScroll}
              >
                <div className="p-6 space-y-6">
                  {Object.entries(groupedNews).map(([period, items]) => {
                    if (items.length === 0) return null;
                    
                    return (
                      <div key={period}>
                        <h3 className="text-lg font-semibold mb-3 text-muted-foreground">
                          {period} ({items.length})
                        </h3>
                        <div className="space-y-4">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2">
                                    {getPriorityBadge(item.priority)}
                                    <span className="text-sm text-muted-foreground">
                                      {item.source}
                                    </span>
                                    <span className="text-sm text-muted-foreground">•</span>
                                    <span className="text-sm text-muted-foreground">
                                      {formatTimeAgo(item.publishedAt)}
                                    </span>
                                  </div>
                                  
                                  <h4 className="font-semibold text-lg">{item.title}</h4>
                                  
                                  {item.content && (
                                    <p className="text-muted-foreground line-clamp-2">
                                      {item.content}
                                    </p>
                                  )}
                                  
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {item.coins.map((coin) => (
                                      <Badge key={coin} variant="secondary" className="text-xs">
                                        {coin}
                                      </Badge>
                                    ))}
                                    
                                    {item.effectivePrice && (
                                      <Badge variant="outline" className="text-xs">
                                        ${item.effectivePrice}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                {item.sourceUrl && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    asChild
                                  >
                                    <a
                                      href={item.sourceUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}