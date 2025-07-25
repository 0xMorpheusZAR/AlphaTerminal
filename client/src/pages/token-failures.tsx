import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import TokenFailuresTable from "@/components/tables/token-failures-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function TokenFailures() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: failedTokens = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/tokens/failed'],
    queryFn: api.tokens.getFailed,
  });

  const syncTokensMutation = useMutation({
    mutationFn: api.tokens.sync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tokens/failed'] });
      toast({
        title: "Tokens Synced",
        description: "Latest token data has been fetched from CoinGecko.",
      });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Unable to sync token data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRefresh = () => {
    refetch();
  };

  const handleSync = () => {
    syncTokensMutation.mutate();
  };

  const handleExport = () => {
    const csvContent = [
      ['Token', 'Symbol', 'Current Price', 'ATH', 'Decline %', 'Market Cap', '24h Change', 'Risk Level'].join(','),
      ...failedTokens.map(token => [
        token.name,
        token.symbol,
        token.currentPrice || '0',
        token.allTimeHigh || '0',
        token.declineFromAth || '0',
        token.marketCap || '0',
        token.priceChange24h || '0',
        token.riskLevel || 'UNKNOWN'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'token-failures.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredTokens = failedTokens.filter(token =>
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-hidden">
      <Header 
        title="Token Failure Analysis"
        description="Comprehensive tracking of tokens with 90%+ decline from all-time high"
        onRefresh={handleRefresh}
      />
      
      <div className="p-6 overflow-y-auto h-[calc(100vh-80px)]">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-destructive">{failedTokens.length}</p>
                  <p className="text-sm text-muted-foreground">Total Failed Tokens</p>
                </div>
                <i className="fas fa-exclamation-triangle text-2xl text-destructive"></i>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-destructive">
                    {failedTokens.filter(t => t.riskLevel === 'EXTREME').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Extreme Risk</p>
                </div>
                <Badge variant="destructive">EXTREME</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-warning">
                    {failedTokens.filter(t => t.riskLevel === 'HIGH' || t.riskLevel === 'VERY_HIGH').length}
                  </p>
                  <p className="text-sm text-muted-foreground">High Risk</p>
                </div>
                <Badge variant="secondary">HIGH</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    ${failedTokens.reduce((sum, token) => 
                      sum + parseFloat(token.marketCap || '0'), 0
                    ).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Market Cap</p>
                </div>
                <i className="fas fa-dollar-sign text-2xl text-muted-foreground"></i>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Token Failures Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Failed Tokens Analysis</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Real-time tracking of underperforming assets
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search tokens..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 pl-10"
                  />
                  <i className="fas fa-search absolute left-3 top-2.5 text-muted-foreground text-sm"></i>
                </div>
                <Button 
                  onClick={handleSync}
                  disabled={syncTokensMutation.isPending}
                  variant="outline"
                >
                  <i className="fas fa-sync-alt mr-2"></i>
                  {syncTokensMutation.isPending ? 'Syncing...' : 'Sync'}
                </Button>
                <Button onClick={handleExport}>
                  <i className="fas fa-download mr-2"></i>
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TokenFailuresTable 
              tokens={filteredTokens} 
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
