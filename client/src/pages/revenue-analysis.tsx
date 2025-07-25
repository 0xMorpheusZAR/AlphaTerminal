import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function RevenueAnalysis() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: protocols = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/defi/protocols'],
    queryFn: api.defi.getProtocols,
  });

  const syncProtocolsMutation = useMutation({
    mutationFn: api.defi.syncProtocols,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/defi/protocols'] });
      toast({
        title: "Protocols Synced",
        description: "Latest DeFi protocol data has been fetched from DefiLlama.",
      });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Unable to sync protocol data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRefresh = () => {
    refetch();
  };

  const handleSync = () => {
    syncProtocolsMutation.mutate();
  };

  const formatCurrency = (value: string | undefined) => {
    if (!value) return '$0';
    const num = parseFloat(value);
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num.toFixed(0)}`;
  };

  const formatPercentage = (value: string | undefined) => {
    if (!value) return 'N/A';
    return `${parseFloat(value).toFixed(1)}x`;
  };

  const getCategoryBadge = (category: string | undefined) => {
    switch (category?.toLowerCase()) {
      case 'dex':
        return <Badge variant="default">DEX</Badge>;
      case 'lending':
        return <Badge variant="secondary">Lending</Badge>;
      case 'yield':
        return <Badge variant="outline">Yield</Badge>;
      case 'derivatives':
        return <Badge className="bg-purple-100 text-purple-800">Derivatives</Badge>;
      default:
        return <Badge variant="outline">{category || 'Other'}</Badge>;
    }
  };

  const totalTVL = protocols.reduce((sum, protocol) => 
    sum + parseFloat(protocol.tvl || '0'), 0
  );

  const totalRevenue = protocols.reduce((sum, protocol) => 
    sum + parseFloat(protocol.revenue1y || '0'), 0
  );

  const topProtocolsByRevenue = protocols
    .sort((a, b) => parseFloat(b.revenue1y || '0') - parseFloat(a.revenue1y || '0'))
    .slice(0, 20);

  return (
    <div className="flex-1 overflow-hidden">
      <Header 
        title="DeFi Revenue Analysis"
        description="Cash cow protocols with P/E ratios and revenue metrics"
        onRefresh={handleRefresh}
      />
      
      <div className="p-6 overflow-y-auto h-[calc(100vh-80px)]">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-success">{protocols.length}</p>
                  <p className="text-sm text-muted-foreground">Tracked Protocols</p>
                </div>
                <i className="fas fa-building text-2xl text-success"></i>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">${(totalTVL / 1e9).toFixed(1)}B</p>
                  <p className="text-sm text-muted-foreground">Total TVL</p>
                </div>
                <i className="fas fa-lock text-2xl text-primary"></i>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-warning">${(totalRevenue / 1e9).toFixed(1)}B</p>
                  <p className="text-sm text-muted-foreground">Annual Revenue</p>
                </div>
                <i className="fas fa-money-bill-wave text-2xl text-warning"></i>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-destructive">
                    {protocols.filter(p => parseFloat(p.peRatio || '0') > 0 && parseFloat(p.peRatio || '0') < 20).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Profitable P/E &lt; 20x</p>
                </div>
                <i className="fas fa-chart-pie text-2xl text-destructive"></i>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Analysis Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>DeFi Cash Cow Analysis</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Revenue comparison and P/E ratios for top performing protocols
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  onClick={handleSync}
                  disabled={syncProtocolsMutation.isPending}
                  variant="outline"
                >
                  <i className="fas fa-sync-alt mr-2"></i>
                  {syncProtocolsMutation.isPending ? 'Syncing...' : 'Sync'}
                </Button>
                <Button variant="outline">
                  <i className="fas fa-download mr-2"></i>
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
                ))}
              </div>
            ) : protocols.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-chart-bar text-4xl text-muted-foreground mb-4"></i>
                <p className="text-muted-foreground">No protocol data available</p>
                <Button 
                  onClick={handleSync}
                  className="mt-4"
                  variant="outline"
                >
                  Fetch Protocol Data
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Protocol</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">TVL</TableHead>
                      <TableHead className="text-right">24h Revenue</TableHead>
                      <TableHead className="text-right">30d Revenue</TableHead>
                      <TableHead className="text-right">Annual Revenue</TableHead>
                      <TableHead className="text-right">P/E Ratio</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProtocolsByRevenue.map((protocol) => {
                      const peRatio = parseFloat(protocol.peRatio || '0');
                      const annualRevenue = parseFloat(protocol.revenue1y || '0');
                      const isProfitable = annualRevenue > 0;
                      const isGoodPE = peRatio > 0 && peRatio < 50;

                      return (
                        <TableRow key={protocol.id} className="hover:bg-muted/20">
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-400 rounded-full"></div>
                              <div>
                                <p className="font-medium">{protocol.name}</p>
                                <p className="text-xs text-muted-foreground">{protocol.defillama}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getCategoryBadge(protocol.category)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(protocol.tvl)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(protocol.revenue24h)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(protocol.revenue30d)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(protocol.revenue1y)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {peRatio > 0 ? formatPercentage(protocol.peRatio) : 'N/A'}
                          </TableCell>
                          <TableCell className="text-center">
                            {isProfitable ? (
                              isGoodPE ? (
                                <Badge variant="default">Cash Cow</Badge>
                              ) : (
                                <Badge variant="secondary">Profitable</Badge>
                              )
                            ) : (
                              <Badge variant="outline">Growth</Badge>
                            )}
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
      </div>
    </div>
  );
}
