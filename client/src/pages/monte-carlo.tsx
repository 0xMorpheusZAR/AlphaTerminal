import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function MonteCarlo() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedToken, setSelectedToken] = useState("bitcoin");
  const [timeHorizon, setTimeHorizon] = useState(1);
  const [simulationRuns, setSimulationRuns] = useState(10000);
  const [fundamentalFactors, setFundamentalFactors] = useState({
    marketSentiment: 0.1,
    adoptionRate: 0.7,
    competitionFactor: 0.3,
    regulatoryRisk: 0.2
  });
  
  const [simulationResult, setSimulationResult] = useState({
    bearishPrice: 42000,
    basePrice: 78500,
    bullishPrice: 125000,
    targetProbability: 16.8
  });

  const { data: tokens = [] } = useQuery({
    queryKey: ['/api/tokens'],
    queryFn: api.tokens.getAll,
  });

  const { data: simulations = [] } = useQuery({
    queryKey: ['/api/monte-carlo', selectedToken],
    queryFn: () => api.monteCarlo.getSimulations(selectedToken),
    enabled: !!selectedToken,
  });

  const runSimulationMutation = useMutation({
    mutationFn: (data: any) => api.monteCarlo.runSimulation(data),
    onSuccess: (data: any) => {
      if (data.result) {
        setSimulationResult({
          bearishPrice: Math.round(data.result.bearishPrice),
          basePrice: Math.round(data.result.basePrice),
          bullishPrice: Math.round(data.result.bullishPrice),
          targetProbability: Math.round(data.result.priceTargets?.[3]?.probability * 100 || 16.8)
        });
      }
      toast({
        title: "Simulation Complete",
        description: "Monte Carlo simulation has been updated with new results.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/monte-carlo', selectedToken] });
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
    if (!selectedToken) {
      toast({
        title: "Token Required",
        description: "Please select a token to run the simulation.",
        variant: "destructive",
      });
      return;
    }

    runSimulationMutation.mutate({
      tokenId: selectedToken,
      timeHorizon,
      simulationRuns,
      fundamentalFactors
    });
  };

  const updateFundamentalFactor = (key: string, value: number[]) => {
    setFundamentalFactors(prev => ({
      ...prev,
      [key]: value[0]
    }));
  };

  return (
    <div className="flex-1 overflow-hidden">
      <Header 
        title="Monte Carlo Simulations"
        description="Statistical price projections using Geometric Brownian Motion"
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ['/api/monte-carlo'] })}
      />
      
      <div className="p-6 overflow-y-auto h-[calc(100vh-80px)]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Simulation Parameters */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Simulation Parameters</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure the Monte Carlo simulation settings and fundamental factors
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="token-select">Select Token</Label>
                  <Select value={selectedToken} onValueChange={setSelectedToken}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a token" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bitcoin">Bitcoin (BTC)</SelectItem>
                      <SelectItem value="ethereum">Ethereum (ETH)</SelectItem>
                      <SelectItem value="solana">Solana (SOL)</SelectItem>
                      <SelectItem value="cardano">Cardano (ADA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="time-horizon">Time Horizon (Years)</Label>
                  <Input
                    id="time-horizon"
                    type="number"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={timeHorizon}
                    onChange={(e) => setTimeHorizon(parseFloat(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="simulation-runs">Simulation Runs</Label>
                  <Select value={simulationRuns.toString()} onValueChange={(value) => setSimulationRuns(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1000">1,000</SelectItem>
                      <SelectItem value="5000">5,000</SelectItem>
                      <SelectItem value="10000">10,000</SelectItem>
                      <SelectItem value="50000">50,000</SelectItem>
                      <SelectItem value="100000">100,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Fundamental Factors</h4>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Market Sentiment</Label>
                    <span className="text-sm text-muted-foreground">
                      {(fundamentalFactors.marketSentiment * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Slider
                    value={[fundamentalFactors.marketSentiment]}
                    onValueChange={(value) => updateFundamentalFactor('marketSentiment', value)}
                    min={-1}
                    max={1}
                    step={0.1}
                    className="mb-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    -100% (Very Bearish) to +100% (Very Bullish)
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Adoption Rate</Label>
                    <span className="text-sm text-muted-foreground">
                      {(fundamentalFactors.adoptionRate * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Slider
                    value={[fundamentalFactors.adoptionRate]}
                    onValueChange={(value) => updateFundamentalFactor('adoptionRate', value)}
                    min={0}
                    max={1}
                    step={0.1}
                    className="mb-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    0% (No Adoption) to 100% (High Adoption)
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Competition Factor</Label>
                    <span className="text-sm text-muted-foreground">
                      {(fundamentalFactors.competitionFactor * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Slider
                    value={[fundamentalFactors.competitionFactor]}
                    onValueChange={(value) => updateFundamentalFactor('competitionFactor', value)}
                    min={0}
                    max={1}
                    step={0.1}
                    className="mb-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    0% (No Competition) to 100% (High Competition)
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Regulatory Risk</Label>
                    <span className="text-sm text-muted-foreground">
                      {(fundamentalFactors.regulatoryRisk * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Slider
                    value={[fundamentalFactors.regulatoryRisk]}
                    onValueChange={(value) => updateFundamentalFactor('regulatoryRisk', value)}
                    min={0}
                    max={1}
                    step={0.1}
                    className="mb-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    0% (No Risk) to 100% (High Risk)
                  </p>
                </div>
              </div>

              <Button 
                onClick={handleRunSimulation}
                disabled={runSimulationMutation.isPending}
                className="w-full"
                size="lg"
              >
                <i className="fas fa-dice mr-2"></i>
                {runSimulationMutation.isPending ? 'Running Simulation...' : 'Run Monte Carlo Simulation'}
              </Button>
            </CardContent>
          </Card>

          {/* Simulation Results */}
          <Card>
            <CardHeader>
              <CardTitle>Simulation Results</CardTitle>
              <p className="text-sm text-muted-foreground">
                Price projections based on current parameters
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Bearish (15th %ile)</span>
                  <span className="text-sm font-medium text-destructive tabular-nums">
                    ${simulationResult.bearishPrice.toLocaleString()}
                  </span>
                </div>
                <Progress value={15} className="h-2" />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Base Case (50th %ile)</span>
                  <span className="text-sm font-medium tabular-nums">
                    ${simulationResult.basePrice.toLocaleString()}
                  </span>
                </div>
                <Progress value={50} className="h-2" />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Bullish (85th %ile)</span>
                  <span className="text-sm font-medium text-success tabular-nums">
                    ${simulationResult.bullishPrice.toLocaleString()}
                  </span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
              
              <div className="pt-4 border-t border-border">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-2">
                    End-of-year projection ({timeHorizon}Y)
                  </p>
                  <p className="text-lg font-bold tabular-nums">
                    ${simulationResult.basePrice.toLocaleString()}
                  </p>
                  <p className="text-xs text-success">
                    +{simulationResult.targetProbability}% probability
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Historical Simulations */}
        {simulations.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Historical Simulations</CardTitle>
              <p className="text-sm text-muted-foreground">
                Previous Monte Carlo simulation results for comparison
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {simulations.slice(0, 6).map((simulation) => (
                  <div key={simulation.id} className="p-4 border border-border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-2">
                      {new Date(simulation.createdAt || '').toLocaleDateString()}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs">Bearish:</span>
                        <span className="text-xs text-destructive">
                          ${parseFloat(simulation.bearishPrice || '0').toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs">Base:</span>
                        <span className="text-xs">
                          ${parseFloat(simulation.basePrice || '0').toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs">Bullish:</span>
                        <span className="text-xs text-success">
                          ${parseFloat(simulation.bullishPrice || '0').toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
