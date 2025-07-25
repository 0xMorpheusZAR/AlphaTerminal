import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: "fas fa-tachometer-alt" },
  { name: "Token Failures", href: "/failures", icon: "fas fa-exclamation-triangle" },
  { name: "Unlock Schedule", href: "/unlocks", icon: "fas fa-unlock" },
  { name: "Revenue Analysis", href: "/revenue", icon: "fas fa-money-bill-wave" },
  { name: "Monte Carlo", href: "/monte-carlo", icon: "fas fa-dice" },
  { name: "Success Stories", href: "/success-stories", icon: "fas fa-trophy" },
  { name: "Velo News", href: "/news", icon: "fas fa-newspaper", badge: true },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-card border-r border-border flex-shrink-0">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <i className="fas fa-chart-line text-primary-foreground text-sm"></i>
          </div>
          <div>
            <h1 className="text-lg font-bold">TokenTracker2</h1>
            <p className="text-xs text-muted-foreground">Professional Analytics</p>
          </div>
        </div>
        
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href === "/dashboard" && location === "/");
            
            return (
              <Link key={item.name} href={item.href}>
                <div className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary border border-primary/20" 
                    : "hover:bg-muted"
                )}>
                  <i className={cn(item.icon, "w-4")}></i>
                  <span className={cn("font-medium", isActive && "font-medium")}>
                    {item.name}
                  </span>
                  {item.badge && (
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse ml-auto"></div>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-muted rounded-lg p-3 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-muted-foreground">API Status</span>
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-success rounded-full" title="CoinGecko Pro"></div>
              <div className="w-2 h-2 bg-success rounded-full" title="Velo Data"></div>
              <div className="w-2 h-2 bg-warning rounded-full" title="Dune Analytics"></div>
            </div>
          </div>
          <p className="text-muted-foreground">
            Last update: <span>2 mins ago</span>
          </p>
        </div>
      </div>
    </aside>
  );
}
