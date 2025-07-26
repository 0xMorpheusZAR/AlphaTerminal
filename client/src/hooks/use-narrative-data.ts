import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

interface NarrativeData {
  name: string;
  value: number;
  change1d?: number;
  change7d?: number;
  change30d?: number;
  category: string;
}

const REFRESH_INTERVAL = 2 * 60 * 1000; // 2 minutes
const STALE_TIME = 1 * 60 * 1000; // Consider data stale after 1 minute
const CACHE_TIME = 5 * 60 * 1000; // Keep in cache for 5 minutes

export function useNarrativeData() {
  const queryClient = useQueryClient();
  const lastUpdateRef = useRef<number>(Date.now());

  const { data: narrativeData = [], isLoading, error, refetch } = useQuery({
    queryKey: ['/api/narratives/performance'],
    queryFn: async (): Promise<NarrativeData[]> => {
      const response = await fetch('/api/narratives/performance', {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      lastUpdateRef.current = Date.now();
      return data;
    },
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    refetchInterval: REFRESH_INTERVAL,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Manual refresh function with rate limiting
  const refreshData = async () => {
    const timeSinceLastUpdate = Date.now() - lastUpdateRef.current;
    const minTimeBetweenRequests = 30 * 1000; // 30 seconds minimum between manual refreshes

    if (timeSinceLastUpdate < minTimeBetweenRequests) {
      console.log(`Rate limited: Please wait ${Math.ceil((minTimeBetweenRequests - timeSinceLastUpdate) / 1000)} more seconds`);
      return;
    }

    try {
      await refetch();
    } catch (error) {
      console.error('Failed to refresh narrative data:', error);
    }
  };

  // Preload related data
  useEffect(() => {
    const preloadData = async () => {
      // Prefetch top and worst performers
      queryClient.prefetchQuery({
        queryKey: ['/api/narratives/top-performers'],
        queryFn: () => fetch('/api/narratives/top-performers?limit=10').then(res => res.json()),
        staleTime: STALE_TIME,
      });

      queryClient.prefetchQuery({
        queryKey: ['/api/narratives/worst-performers'],
        queryFn: () => fetch('/api/narratives/worst-performers?limit=5').then(res => res.json()),
        staleTime: STALE_TIME,
      });
    };

    preloadData();
  }, [queryClient]);

  // Get last update time
  const getLastUpdateTime = () => {
    const timeSinceUpdate = Date.now() - lastUpdateRef.current;
    const minutes = Math.floor(timeSinceUpdate / 60000);
    const seconds = Math.floor((timeSinceUpdate % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s ago`;
    }
    return `${seconds}s ago`;
  };

  // Check if data is fresh (less than 2 minutes old)
  const isDataFresh = () => {
    return (Date.now() - lastUpdateRef.current) < REFRESH_INTERVAL;
  };

  return {
    narrativeData,
    isLoading,
    error,
    refreshData,
    getLastUpdateTime,
    isDataFresh,
    lastUpdateTime: lastUpdateRef.current,
  };
}

export function useTopPerformers(limit: number = 10) {
  return useQuery({
    queryKey: ['/api/narratives/top-performers', limit],
    queryFn: () => fetch(`/api/narratives/top-performers?limit=${limit}`).then(res => res.json()),
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    refetchInterval: REFRESH_INTERVAL,
  });
}

export function useWorstPerformers(limit: number = 5) {
  return useQuery({
    queryKey: ['/api/narratives/worst-performers', limit],
    queryFn: () => fetch(`/api/narratives/worst-performers?limit=${limit}`).then(res => res.json()),
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    refetchInterval: REFRESH_INTERVAL,
  });
}