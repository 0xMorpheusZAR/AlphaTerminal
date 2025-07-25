import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface MonteCarloWidgetProps {
  tokenId?: string;
}

export default function MonteCarloWidget({ tokenId = "bitcoin" }: MonteCarloWidgetProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [simulationData, setSimulationData] = useState({
    bearish: 42000,
    base: 78500,
    bullish: 125000,
    probability: 16.8
  });

  const runSimulationMutation = useMutation({
    mutationFn: (data: any) => api.monteCarlo.runSimulation(data),
    onSuccess: (data: any) => {
      if (data.result) {
        setSimulationData({
          bearish: Math.round(data.result.bearishPrice),
          base: Math.round(data.result.basePrice),
          bullish: Math.round(data.result.bullishPrice),
          probability: Math.round(data.result.priceTargets?.[3]?.probability * 100 || 16.8)
        });
      }
      toast({
        title: "Simulation Complete",
        description: "Monte Carlo simulation has been updated with new results.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/monte-carlo', tokenId] });
    },
    onError: () => {
      toast({
        title: "Simulation Failed",
        description: "Unable to run Monte Carlo simulation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRunSimulation = () => {
    runSimulationMutation.mutate({
      tokenId,
      timeHorizon: 1,
      simulationRuns: 10000,
      fundamentalFactors: {
        marketSentiment: 0.1,
        adoptionRate: 0.7,
        competitionFactor: 0.3,
        regulatoryRisk: 0.2
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Monte Carlo Simulation</CardTitle>
        <p className="text-sm text-muted-foreground">Price projections using GBM</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Bearish (15th %ile)</span>
            <span className="text-sm font-medium text-destructive tabular-nums">
              ${simulationData.bearish.toLocaleString()}
            </span>
          </div>
          <Progress value={15} className="h-2" />
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Base Case (50th %ile)</span>
            <span className="text-sm font-medium tabular-nums">
              ${simulationData.base.toLocaleString()}
            </span>
          </div>
          <Progress value={50} className="h-2" />
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Bullish (85th %ile)</span>
            <span className="text-sm font-medium text-success tabular-nums">
              ${simulationData.bullish.toLocaleString()}
            </span>
          </div>
          <Progress value={85} className="h-2" />
        </div>
        
        <div className="pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-2">End-of-year projection</p>
            <p className="text-lg font-bold tabular-nums">
              ${simulationData.base.toLocaleString()}
            </p>
            <p className="text-xs text-success">+{simulationData.probability}% probability</p>
          </div>
        </div>
        
        <Button 
          onClick={handleRunSimulation}
          disabled={runSimulationMutation.isPending}
          className="w-full"
        >
          <i className="fas fa-dice mr-2"></i>
          {runSimulationMutation.isPending ? 'Running...' : 'Run New Simulation'}
        </Button>
      </CardContent>
    </Card>
  );
}
