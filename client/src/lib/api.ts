import { apiRequest } from "./queryClient";
import type { Token, TokenUnlock, DefiProtocol, NewsItem, MonteCarloSimulation, HyperliquidMetrics, DashboardStats } from "@/types";

export const api = {
  // Token endpoints
  tokens: {
    getAll: () => fetch('/api/tokens').then(res => res.json()) as Promise<Token[]>,
    getFailed: () => fetch('/api/tokens/failed').then(res => res.json()) as Promise<Token[]>,
    getById: (id: string) => fetch(`/api/tokens/${id}`).then(res => res.json()) as Promise<Token>,
    sync: () => apiRequest('POST', '/api/tokens/sync', {}),
  },

  // Token unlock endpoints
  unlocks: {
    getAll: (tokenId?: string) => {
      const url = tokenId ? `/api/unlocks?tokenId=${tokenId}` : '/api/unlocks';
      return fetch(url).then(res => res.json()) as Promise<TokenUnlock[]>;
    },
    getUpcoming: () => fetch('/api/unlocks/upcoming').then(res => res.json()) as Promise<TokenUnlock[]>,
  },

  // DeFi protocol endpoints
  defi: {
    getProtocols: () => fetch('/api/defi/protocols').then(res => res.json()) as Promise<DefiProtocol[]>,
    syncProtocols: () => apiRequest('POST', '/api/defi/protocols/sync', {}),
  },

  // News endpoints
  news: {
    getAll: (limit?: number, coins?: string[]) => {
      let url = '/api/news';
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (coins && coins.length > 0) params.append('coins', coins.join(','));
      if (params.toString()) url += `?${params}`;
      return fetch(url).then(res => res.json()) as Promise<NewsItem[]>;
    },
    sync: (limit?: number, coins?: string[]) => apiRequest('POST', '/api/news/sync', { limit, coins }),
  },

  // Monte Carlo endpoints
  monteCarlo: {
    getSimulations: (tokenId: string) => 
      fetch(`/api/monte-carlo/${tokenId}`).then(res => res.json()) as Promise<MonteCarloSimulation[]>,
    runSimulation: (data: {
      tokenId: string;
      timeHorizon?: number;
      simulationRuns?: number;
      fundamentalFactors?: any;
    }) => apiRequest('POST', '/api/monte-carlo/run', data),
  },

  // Hyperliquid endpoints
  hyperliquid: {
    getMetrics: () => fetch('/api/hyperliquid/metrics').then(res => res.json()) as Promise<HyperliquidMetrics>,
    sync: () => apiRequest('POST', '/api/hyperliquid/sync', {}),
  },

  // Dashboard endpoints
  dashboard: {
    getStats: () => fetch('/api/dashboard/stats').then(res => res.json()) as Promise<DashboardStats>,
  },
};
