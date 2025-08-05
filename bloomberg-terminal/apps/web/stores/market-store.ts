import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { wsManager, MarketData, OrderBookData, TradeData } from '@alphaterminal/core';

interface MarketState {
  // Market data
  marketData: Map<string, MarketData>;
  orderBooks: Map<string, OrderBookData>;
  trades: Map<string, TradeData[]>;
  
  // Top assets for ticker
  topAssets: MarketData[];
  
  // Selected symbol
  selectedSymbol: string;
  
  // Loading states
  isLoading: boolean;
  isConnected: boolean;
  
  // Actions
  setSelectedSymbol: (symbol: string) => void;
  updateMarketData: (data: MarketData) => void;
  updateOrderBook: (data: OrderBookData) => void;
  addTrade: (trade: TradeData) => void;
  
  // WebSocket subscriptions
  subscribeToSymbol: (symbol: string) => void;
  unsubscribeFromSymbol: (symbol: string) => void;
  subscribeToTicker: (callback: (data: MarketData[]) => void) => () => void;
  
  // Initialize
  initialize: () => void;
  cleanup: () => void;
}

export const useMarketStore = create<MarketState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    marketData: new Map(),
    orderBooks: new Map(),
    trades: new Map(),
    topAssets: [],
    selectedSymbol: 'BTC-USD',
    isLoading: false,
    isConnected: false,

    // Actions
    setSelectedSymbol: (symbol) => {
      const state = get();
      
      // Unsubscribe from previous symbol
      if (state.selectedSymbol !== symbol) {
        state.unsubscribeFromSymbol(state.selectedSymbol);
      }
      
      // Subscribe to new symbol
      state.subscribeToSymbol(symbol);
      
      set({ selectedSymbol: symbol });
    },

    updateMarketData: (data) => {
      set((state) => {
        const newMarketData = new Map(state.marketData);
        newMarketData.set(data.symbol, data);
        
        // Update top assets if this is one of them
        const topAssets = state.topAssets.map(asset => 
          asset.symbol === data.symbol ? data : asset
        );
        
        return { marketData: newMarketData, topAssets };
      });
    },

    updateOrderBook: (data) => {
      set((state) => {
        const newOrderBooks = new Map(state.orderBooks);
        newOrderBooks.set(data.symbol, data);
        return { orderBooks: newOrderBooks };
      });
    },

    addTrade: (trade) => {
      set((state) => {
        const newTrades = new Map(state.trades);
        const symbolTrades = newTrades.get(trade.symbol) || [];
        
        // Keep only last 100 trades per symbol
        const updatedTrades = [trade, ...symbolTrades].slice(0, 100);
        newTrades.set(trade.symbol, updatedTrades);
        
        return { trades: newTrades };
      });
    },

    // WebSocket subscriptions
    subscribeToSymbol: (symbol) => {
      // Subscribe to all channels for this symbol
      wsManager.subscribe('market', [symbol]);
      wsManager.subscribe('orderbook', [symbol]);
      wsManager.subscribe('trades', [symbol]);
    },

    unsubscribeFromSymbol: (symbol) => {
      wsManager.unsubscribe('market', [symbol]);
      wsManager.unsubscribe('orderbook', [symbol]);
      wsManager.unsubscribe('trades', [symbol]);
    },

    subscribeToTicker: (callback) => {
      // Subscribe to top 20 assets for ticker
      const topSymbols = [
        'BTC-USD', 'ETH-USD', 'BNB-USD', 'XRP-USD', 'SOL-USD',
        'ADA-USD', 'AVAX-USD', 'DOGE-USD', 'DOT-USD', 'MATIC-USD',
        'SHIB-USD', 'DAI-USD', 'TRX-USD', 'UNI-USD', 'WBTC-USD',
        'LTC-USD', 'ATOM-USD', 'LINK-USD', 'ETC-USD', 'XLM-USD'
      ];
      
      wsManager.subscribe('market', topSymbols);
      
      // Listen for batch updates
      const handleBatch = (batch: MarketData[]) => {
        set({ topAssets: batch });
        callback(batch);
      };
      
      wsManager.on('market:batch', handleBatch);
      
      // Return cleanup function
      return () => {
        wsManager.off('market:batch', handleBatch);
        wsManager.unsubscribe('market', topSymbols);
      };
    },

    // Initialize
    initialize: () => {
      set({ isLoading: true });
      
      // Connect to WebSocket
      wsManager.connect();
      
      // Set up event listeners
      wsManager.on('connected', () => {
        set({ isConnected: true, isLoading: false });
      });
      
      wsManager.on('disconnected', () => {
        set({ isConnected: false });
      });
      
      // Listen for market updates
      wsManager.on('market:update', (data: MarketData) => {
        get().updateMarketData(data);
      });
      
      wsManager.on('orderbook:update', (data: OrderBookData) => {
        get().updateOrderBook(data);
      });
      
      wsManager.on('trades:update', (trade: TradeData) => {
        get().addTrade(trade);
      });
      
      // Subscribe to default symbol
      get().subscribeToSymbol(get().selectedSymbol);
    },

    cleanup: () => {
      wsManager.disconnect();
      set({
        marketData: new Map(),
        orderBooks: new Map(),
        trades: new Map(),
        topAssets: [],
        isConnected: false,
      });
    },
  }))
);