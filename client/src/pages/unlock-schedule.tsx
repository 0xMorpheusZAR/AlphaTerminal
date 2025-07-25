import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

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

  return (
    <div className="flex-1 overflow-hidden">
      <Header 
        title="Token Unlock Schedule"
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

        {/* Upcoming Unlocks Table */}
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
                <i className="fas fa-calendar-alt mr-2"></i>
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
      </div>
    </div>
  );
}
