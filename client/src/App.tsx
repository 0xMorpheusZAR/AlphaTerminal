import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import TokenFailures from "@/pages/token-failures";
import UnlockSchedule from "@/pages/unlock-schedule";
import NarrativeTracker from "@/pages/narrative-tracker";
import RevenueAnalysis from "@/pages/revenue-analysis";
import MonteCarlo from "@/pages/monte-carlo";
import SuccessStories from "@/pages/success-stories";
import VeloNews from "@/pages/velo-news-live";
import CoinGeckoProShowcase from "@/pages/coingecko-pro-showcase";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/layout/sidebar";

function Router() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/failures" component={TokenFailures} />
          <Route path="/unlocks" component={UnlockSchedule} />
          <Route path="/narratives" component={NarrativeTracker} />
          <Route path="/revenue" component={RevenueAnalysis} />
          <Route path="/monte-carlo" component={MonteCarlo} />
          <Route path="/success-stories" component={SuccessStories} />
          <Route path="/news" component={VeloNews} />
          <Route path="/coingecko-pro" component={CoinGeckoProShowcase} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
