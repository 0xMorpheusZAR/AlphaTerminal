import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, Calendar, DollarSign } from "lucide-react";

export default function UnlockSchedule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: upcomingUnlocks = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/unlocks/upcoming'],
    queryFn: api.unlocks.getUpcoming,
  });

  const { data: allUnlocks = [] } = useQuery({
    queryKey: ['/api/unlocks'],
    queryFn: () => api.unlocks.getAll(),
  });

  // Fetch narrative performance data
  const { data: narrativePerformance = [] } = useQuery({
    queryKey: ['/api/narratives/performance'],
    queryFn: () => fetch('/api/narratives/performance').then(res => res.json()),
  });

  const { data: topPerformers = [] } = useQuery({
    queryKey: ['/api/narratives/top-performers'],
    queryFn: () => fetch('/api/narratives/top-performers?limit=10').then(res => res.json()),
  });

  const { data: worstPerformers = [] } = useQuery({
    queryKey: ['/api/narratives/worst-performers'],
    queryFn: () => fetch('/api/narratives/worst-performers?limit=5').then(res => res.json()),
  });

  const handleRefresh = () => {
    refetch();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (value: string | undefined) => {
    if (!value) return '$0';
    const num = parseFloat(value);
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num.toFixed(0)}`;
  };

  const getUnlockTypeBadge = (type: string | undefined) => {
    switch (type?.toLowerCase()) {
      case 'investor':
        return <Badge variant="destructive">Investor</Badge>;
      case 'team':
        return <Badge variant="secondary">Team</Badge>;
      case 'ecosystem':
        return <Badge variant="default">Ecosystem</Badge>;
      case 'public':
        return <Badge variant="outline">Public</Badge>;
      default:
        return <Badge variant="outline">Other</Badge>;
    }
  };

  const getDaysUntilUnlock = (dateString: string) => {
    const unlockDate = new Date(dateString);
    const now = new Date();
    const diffTime = unlockDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const totalUpcomingValue = upcomingUnlocks.reduce((sum, unlock) => 
    sum + parseFloat(unlock.unlockValue || '0'), 0
  );

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getPerformanceColor = (value: number) => {
    if (value > 0) return "text-green-600 dark:text-green-400";
    if (value < 0) return "text-red-600 dark:text-red-400";
    return "text-gray-600 dark:text-gray-400";
  };

  return (
    <div className="flex-1 overflow-hidden">
      <Header 
        title="Token Unlock Schedule & Narrative Tracker"
        description="Monitor upcoming token unlocks and their potential market impact"
        onRefresh={handleRefresh}
      />
      
      <div className="p-6 overflow-y-auto h-[calc(100vh-80px)]">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-warning">{upcomingUnlocks.length}</p>
                  <p className="text-sm text-muted-foreground">Upcoming Unlocks</p>
                </div>
                <i className="fas fa-unlock text-2xl text-warning"></i>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">${(totalUpcomingValue / 1e9).toFixed(1)}B</p>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                </div>
                <i className="fas fa-dollar-sign text-2xl text-success"></i>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-destructive">
                    {upcomingUnlocks.filter(u => getDaysUntilUnlock(u.unlockDate) <= 30).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Next 30 Days</p>
                </div>
                <i className="fas fa-calendar text-2xl text-destructive"></i>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {upcomingUnlocks.filter(u => u.unlockType === 'investor').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Investor Unlocks</p>
                </div>
                <i className="fas fa-users text-2xl text-primary"></i>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="unlocks" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="unlocks">Token Unlocks</TabsTrigger>
            <TabsTrigger value="narratives">Narrative Tracker</TabsTrigger>
            <TabsTrigger value="analysis">Market Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="unlocks">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Upcoming Token Unlocks</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Schedule of upcoming token unlock events with potential market impact
                    </p>
                  </div>
                  <Button variant="outline">
                    <Calendar className="w-4 h-4 mr-2" />
                    Calendar View
                  </Button>
                </div>
              </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
                ))}
              </div>
            ) : upcomingUnlocks.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-calendar-times text-4xl text-muted-foreground mb-4"></i>
                <p className="text-muted-foreground">No upcoming token unlocks found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Token</TableHead>
                      <TableHead>Unlock Date</TableHead>
                      <TableHead>Days Until</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingUnlocks.map((unlock) => {
                      const daysUntil = getDaysUntilUnlock(unlock.unlockDate);
                      const isUrgent = daysUntil <= 7;
                      const isNear = daysUntil <= 30;

                      return (
                        <TableRow key={unlock.id} className="hover:bg-muted/20">
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full"></div>
                              <div>
                                <p className="font-medium">Token #{unlock.tokenId.slice(-6)}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatDate(unlock.unlockDate)}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={isUrgent ? "destructive" : isNear ? "secondary" : "outline"}
                            >
                              {daysUntil > 0 ? `${daysUntil} days` : 'Today'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getUnlockTypeBadge(unlock.unlockType)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {unlock.unlockAmount ? parseFloat(unlock.unlockAmount).toLocaleString() : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(unlock.unlockValue)}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {unlock.description || 'No description'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="narratives">
          <div className="grid gap-6">
            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Top Performing Narratives
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Best performing crypto narratives from DeFiLlama Pro tracker
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {topPerformers.slice(0, 5).map((narrative, index) => (
                    <div key={narrative.name} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-400 flex items-center justify-center text-white text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{narrative.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            30d: <span className={getPerformanceColor(narrative.change30d || 0)}>
                              {formatPercentage(narrative.change30d || 0)}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{narrative.value.toFixed(2)}%</p>
                        <div className="flex items-center gap-1 text-sm">
                          <span className={getPerformanceColor(narrative.change1d || 0)}>
                            {formatPercentage(narrative.change1d || 0)}
                          </span>
                          <span className="text-muted-foreground">1d</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Worst Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  Underperforming Narratives
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Narratives requiring attention based on recent performance
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {worstPerformers.map((narrative, index) => (
                    <div key={narrative.name} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-orange-400 flex items-center justify-center text-white text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{narrative.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            30d: <span className={getPerformanceColor(narrative.change30d || 0)}>
                              {formatPercentage(narrative.change30d || 0)}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{narrative.value.toFixed(2)}%</p>
                        <div className="flex items-center gap-1 text-sm">
                          <span className={getPerformanceColor(narrative.change1d || 0)}>
                            {formatPercentage(narrative.change1d || 0)}
                          </span>
                          <span className="text-muted-foreground">1d</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                Market Impact Analysis
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Combined analysis of token unlocks and narrative performance
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {/* Market Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Unlock Impact Assessment</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">High Impact Events (Next 7 days)</span>
                        <Badge variant="destructive">
                          {upcomingUnlocks.filter(u => getDaysUntilUnlock(u.unlockDate) <= 7).length}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Investor Unlocks</span>
                        <Badge variant="secondary">
                          {upcomingUnlocks.filter(u => u.unlockType === 'investor').length}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total Value at Risk</span>
                        <span className="font-medium">{formatCurrency(totalUpcomingValue.toString())}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">Narrative Momentum</h4>
                    <div className="space-y-3">
                      {topPerformers.slice(0, 3).map((narrative) => (
                        <div key={narrative.name} className="flex justify-between items-center">
                          <span className="text-sm truncate">{narrative.name}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={Math.min(narrative.value, 100)} className="w-16 h-2" />
                            <span className="text-xs font-medium">{narrative.value.toFixed(0)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CSV Data Integration Note */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Data Integration Status
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Narrative performance data integrated from CSV dataset (2025-07-26). 
                    Real-time DeFiLlama Pro API integration available with API key.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
