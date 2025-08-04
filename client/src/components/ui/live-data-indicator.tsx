import React from 'react';
import { motion } from 'framer-motion';
import { WifiIcon, WifiOffIcon, AlertCircle, Clock, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

export interface LiveDataStatus {
  service: string;
  status: 'live' | 'cached' | 'mock' | 'error';
  lastUpdate: Date;
  latency?: number;
  apiKeyValid: boolean;
  message?: string;
}

interface LiveDataIndicatorProps {
  status: LiveDataStatus;
  showDetails?: boolean;
  compact?: boolean;
}

export function LiveDataIndicator({ status, showDetails = true, compact = false }: LiveDataIndicatorProps) {
  const getStatusConfig = () => {
    switch (status.status) {
      case 'live':
        return {
          color: 'text-green-500',
          bgColor: 'bg-green-500',
          icon: WifiIcon,
          label: 'Live',
          description: 'Real-time data'
        };
      case 'cached':
        return {
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500',
          icon: Clock,
          label: 'Cached',
          description: 'Using cached data'
        };
      case 'mock':
        return {
          color: 'text-gray-500',
          bgColor: 'bg-gray-500',
          icon: AlertCircle,
          label: 'Mock',
          description: 'Using sample data'
        };
      case 'error':
        return {
          color: 'text-red-500',
          bgColor: 'bg-red-500',
          icon: WifiOffIcon,
          label: 'Error',
          description: status.message || 'Connection failed'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center gap-1">
              <motion.div
                className={`w-2 h-2 rounded-full ${config.bgColor}`}
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <Icon className={`w-3 h-3 ${config.color}`} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              <div className="font-semibold">{status.service}</div>
              <div>{config.description}</div>
              <div className="text-gray-400">
                Updated {formatDistanceToNow(status.lastUpdate)} ago
              </div>
              {status.latency && (
                <div className="text-gray-400">
                  Latency: {status.latency}ms
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${showDetails ? 'p-2 rounded-lg bg-gray-800/50 border border-gray-700' : ''}`}>
      <div className="flex items-center gap-2">
        <motion.div
          className={`w-2 h-2 rounded-full ${config.bgColor}`}
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <Icon className={`w-4 h-4 ${config.color}`} />
        <span className={`text-sm font-medium ${config.color}`}>
          {config.label}
        </span>
      </div>
      
      {showDetails && (
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span>{status.service}</span>
          <span>{formatDistanceToNow(status.lastUpdate)} ago</span>
          {status.latency && (
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span>{status.latency}ms</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface MultiServiceIndicatorProps {
  services: LiveDataStatus[];
  layout?: 'horizontal' | 'vertical';
}

export function MultiServiceIndicator({ services, layout = 'horizontal' }: MultiServiceIndicatorProps) {
  const allLive = services.every(s => s.status === 'live');
  const hasErrors = services.some(s => s.status === 'error');
  
  const overallStatus = hasErrors ? 'error' : allLive ? 'live' : 'partial';
  
  const statusConfig = {
    live: {
      label: 'All Systems Operational',
      color: 'text-green-500',
      bgColor: 'bg-green-500/20'
    },
    partial: {
      label: 'Partial Service',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/20'
    },
    error: {
      label: 'Service Disruption',
      color: 'text-red-500',
      bgColor: 'bg-red-500/20'
    }
  };
  
  const config = statusConfig[overallStatus];
  
  return (
    <div className={`space-y-2 p-3 rounded-lg ${config.bgColor} border border-gray-700`}>
      <div className={`text-sm font-semibold ${config.color}`}>
        {config.label}
      </div>
      <div className={`${layout === 'horizontal' ? 'flex flex-wrap gap-4' : 'space-y-2'}`}>
        {services.map((service, index) => (
          <LiveDataIndicator
            key={index}
            status={service}
            showDetails={false}
            compact={true}
          />
        ))}
      </div>
    </div>
  );
}

// Hook to track API status
export function useApiStatus(serviceName: string, endpoint: string) {
  const [status, setStatus] = React.useState<LiveDataStatus>({
    service: serviceName,
    status: 'mock',
    lastUpdate: new Date(),
    apiKeyValid: false
  });

  React.useEffect(() => {
    const checkStatus = async () => {
      const start = Date.now();
      
      try {
        const response = await fetch(endpoint);
        const latency = Date.now() - start;
        
        if (response.ok) {
          setStatus({
            service: serviceName,
            status: 'live',
            lastUpdate: new Date(),
            latency,
            apiKeyValid: true
          });
        } else if (response.status === 401) {
          setStatus({
            service: serviceName,
            status: 'error',
            lastUpdate: new Date(),
            latency,
            apiKeyValid: false,
            message: 'Invalid API key'
          });
        } else {
          setStatus({
            service: serviceName,
            status: 'error',
            lastUpdate: new Date(),
            latency,
            apiKeyValid: true,
            message: `HTTP ${response.status}`
          });
        }
      } catch (error) {
        setStatus({
          service: serviceName,
          status: 'mock',
          lastUpdate: new Date(),
          apiKeyValid: false,
          message: 'Network error'
        });
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [serviceName, endpoint]);

  return status;
}