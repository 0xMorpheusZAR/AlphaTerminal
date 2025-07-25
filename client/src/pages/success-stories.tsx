import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import HyperliquidSuccess from "@/components/widgets/hyperliquid-success";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function SuccessStories() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: hyperliquidMetrics } = useQuery({
    queryKey: ['/api/hyperliquid/metrics'],
    queryFn: api.hyperliquid.getMetrics,
  });

  const syncHyperliquidMutation = useMutation({
    mutationFn: api.hyperliquid.sync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hyperliquid/metrics'] });
      toast({
        title: "Hyperliquid Data Updated",
        description: "Latest metrics have been fetched from Dune Analytics.",
      });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Unable to update Hyperliquid data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/hyperliquid/metrics'] });
  };

  const successMetrics = [
    {
      title: "Market Dominance",
      value: "76%+",
      description: "Leading market share in derivatives trading",
      icon: "fas fa-crown",
      color: "text-warning"
    },
    {
      title: "Revenue Growth",
      value: "1,150%",
      description: "Year-over-year revenue increase",
      icon: "fas fa-chart-line",
      color: "text-success"
    },
    {
      title: "User Retention",
      value: "94%+",
      description: "High user retention rate",
      icon: "fas fa-users",
      color: "text-primary"
    },
    {
      title: "Product Innovation",
      value: "Leader",
      description: "First-mover advantage in key features",
      icon: "fas fa-rocket",
      color: "text-purple-400"
    }
  ];

  const keyLessons = [
    {
      title: "Product-Market Fit",
      description: "Hyperliquid identified and solved real problems in derivatives trading with superior UX and performance.",
      icon: "fas fa-bullseye"
    },
    {
      title: "Technical Excellence",
      description: "Built on custom L1 blockchain optimized for trading, providing unmatched speed and reliability.",
      icon: "fas fa-cogs"
    },
    {
      title: "Community Focus",
      description: "Strong emphasis on community governance and transparent communication with users.",
      icon: "fas fa-heart"
    },
    {
      title: "Sustainable Revenue",
      description: "Diversified revenue streams from trading fees, liquidations, and protocol-owned liquidity.",
      icon: "fas fa-coins"
    }
  ];

  return (
    <div className="flex-1 overflow-hidden">
      <Header 
        title="Success Stories"
        description="Deep dive analysis of successful crypto projects and their winning strategies"
        onRefresh={handleRefresh}
      />
      
      <div className="p-6 overflow-y-auto h-[calc(100vh-80px)]">
        {/* Hyperliquid Success Story */}
        <HyperliquidSuccess />

        {/* Success Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8 mb-8">
          {successMetrics.map((metric, index) => (
            <Card key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 bg-muted rounded-lg flex items-center justify-center`}>
                    <i className={`${metric.icon} ${metric.color}`}></i>
                  </div>
                  <Badge variant="outline">Success Factor</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <p className="text-sm font-medium">{metric.title}</p>
                  <p className="text-xs text-muted-foreground">{metric.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Key Lessons Learned */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-lightbulb text-warning mr-2"></i>
              Key Lessons from Hyperliquid's Success
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Strategic insights and best practices that contributed to exceptional performance
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {keyLessons.map((lesson, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 border border-border rounded-lg">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className={`${lesson.icon} text-primary`}></i>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">{lesson.title}</h4>
                    <p className="text-sm text-muted-foreground">{lesson.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Timeline */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Performance Timeline</CardTitle>
            <p className="text-sm text-muted-foreground">
              Key milestones in Hyperliquid's journey to market dominance
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-4 h-4 bg-success rounded-full"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Protocol Launch</h4>
                    <span className="text-sm text-muted-foreground">Q4 2023</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Initial launch with basic perpetual futures trading functionality
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-4 h-4 bg-warning rounded-full"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">User Growth Surge</h4>
                    <span className="text-sm text-muted-foreground">Q1 2024</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Reached 50K+ active users with superior trading experience
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-4 h-4 bg-primary rounded-full"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Market Leadership</h4>
                    <span className="text-sm text-muted-foreground">Q2 2024</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Achieved 76%+ market share in on-chain derivatives trading
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-4 h-4 bg-purple-400 rounded-full"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Revenue Milestone</h4>
                    <span className="text-sm text-muted-foreground">Q3 2024</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Reached $1.15B annual revenue run rate with sustainable growth
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Future Success Stories */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Future Success Stories to Watch</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Emerging projects with potential for exceptional performance
                </p>
              </div>
              <Button variant="outline">
                <i className="fas fa-plus mr-2"></i>
                Add Project
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <i className="fas fa-telescope text-4xl text-muted-foreground mb-4"></i>
              <p className="text-muted-foreground mb-4">
                We're actively monitoring emerging projects for the next success story
              </p>
              <p className="text-sm text-muted-foreground">
                Criteria: Strong fundamentals, growing user base, innovative technology, sustainable revenue model
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
