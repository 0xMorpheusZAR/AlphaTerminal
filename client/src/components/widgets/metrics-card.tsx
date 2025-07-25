import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: string;
  iconColor: string;
  delay?: number;
}

export default function MetricsCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon, 
  iconColor,
  delay = 0
}: MetricsCardProps) {
  const changeColorClass = {
    positive: 'text-success bg-success/10',
    negative: 'text-destructive bg-destructive/10',
    neutral: 'text-muted-foreground bg-muted/10'
  }[changeType];

  return (
    <Card 
      className="animate-fade-in" 
      style={{ animationDelay: `${delay}s` }}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconColor)}>
            <i className={cn(icon)}></i>
          </div>
          {change && (
            <div className={cn("text-xs px-2 py-1 rounded-full", changeColorClass)}>
              {change}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}
