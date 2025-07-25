import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useRealTimeUpdates(intervalMs: number = 30000) {
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const startUpdates = () => {
    if (intervalRef.current) return;
    
    intervalRef.current = setInterval(() => {
      if (isActive) {
        // Invalidate and refetch key queries
        queryClient.invalidateQueries({ queryKey: ['/api/tokens'] });
        queryClient.invalidateQueries({ queryKey: ['/api/tokens/failed'] });
        queryClient.invalidateQueries({ queryKey: ['/api/news'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        setLastUpdate(new Date());
      }
    }, intervalMs);
  };

  const stopUpdates = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const toggleUpdates = () => {
    setIsActive(!isActive);
  };

  useEffect(() => {
    startUpdates();
    return () => stopUpdates();
  }, [intervalMs, isActive]);

  return {
    isActive,
    lastUpdate,
    toggleUpdates,
    startUpdates,
    stopUpdates,
  };
}

export function useNewsAutoRefresh(intervalMs: number = 10000) {
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  useEffect(() => {
    if (!isAutoRefresh) return;

    intervalRef.current = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/news'] });
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoRefresh, intervalMs, queryClient]);

  const toggleAutoRefresh = () => {
    setIsAutoRefresh(!isAutoRefresh);
  };

  return {
    isAutoRefresh,
    toggleAutoRefresh,
  };
}
