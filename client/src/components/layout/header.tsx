import { Button } from "@/components/ui/button";
import { useRealTimeUpdates } from "@/hooks/use-real-time";

interface HeaderProps {
  title: string;
  description: string;
  onRefresh?: () => void;
}

export default function Header({ title, description, onRefresh }: HeaderProps) {
  const { isActive, lastUpdate, toggleUpdates } = useRealTimeUpdates();

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-success animate-pulse' : 'bg-muted'}`}></div>
            <span className="text-muted-foreground">
              {isActive ? 'Live Data' : 'Paused'}
            </span>
          </div>
          <Button 
            onClick={handleRefresh}
            variant="default"
            size="sm"
          >
            <i className="fas fa-sync-alt mr-2"></i>
            Refresh
          </Button>
        </div>
      </div>
    </header>
  );
}
