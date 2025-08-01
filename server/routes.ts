import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { coinGeckoService } from "./services/coingecko";
import { veloService } from "./services/velo";
import { duneService } from "./services/dune";
import { defiLlamaService } from "./services/defillama";
import { defiLlamaNarrativesService } from "./services/defillama-narratives";
import { monteCarloService } from "./services/monte-carlo";
import { insertTokenSchema, insertNewsItemSchema, insertDefiProtocolSchema, insertHyperliquidMetricsSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Token routes
  app.get("/api/tokens", async (req, res) => {
    try {
      const tokens = await storage.getTokens();
      res.json(tokens);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tokens" });
    }
  });

  app.get("/api/tokens/failed", async (req, res) => {
    try {
      const failedTokens = await storage.getFailedTokens();
      res.json(failedTokens);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch failed tokens" });
    }
  });

  app.get("/api/tokens/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const token = await storage.getToken(id);
      
      if (!token) {
        return res.status(404).json({ message: "Token not found" });
      }
      
      res.json(token);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch token" });
    }
  });

  // Sync tokens from CoinGecko
  app.post("/api/tokens/sync", async (req, res) => {
    try {
      const coinsData = await coinGeckoService.getTopCoins(250);
      const syncedTokens = [];

      for (const coin of coinsData) {
        const declineFromAth = coinGeckoService.calculateDeclineFromATH(coin.current_price, coin.ath);
        const riskLevel = coinGeckoService.determineRiskLevel(declineFromAth);
        
        // Get existing token or create new one
        let token = await storage.getTokenBySymbol(coin.symbol.toUpperCase());
        
        const tokenData = {
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          coingeckoId: coin.id,
          currentPrice: coin.current_price.toString(),
          allTimeHigh: coin.ath.toString(),
          allTimeHighDate: new Date(coin.ath_date),
          marketCap: coin.market_cap?.toString(),
          volume24h: coin.total_volume?.toString(),
          priceChange1h: "0", // 1h data not available in basic CoinGecko API
          priceChange24h: coin.price_change_percentage_24h?.toString(),
          priceChange7d: coin.price_change_percentage_7d_in_currency?.toString(),
          priceChange30d: coin.price_change_percentage_30d_in_currency?.toString(),
          priceChange1y: coin.price_change_percentage_1y_in_currency?.toString(),
          declineFromAth: declineFromAth.toString(),
          riskLevel,
          isActive: true,
        };

        if (token) {
          token = await storage.updateToken(token.id, tokenData);
        } else {
          token = await storage.createToken(tokenData);
        }
        
        syncedTokens.push(token);
      }

      res.json({ message: `Synced ${syncedTokens.length} tokens`, tokens: syncedTokens });
    } catch (error) {
      console.error("Token sync error:", error);
      res.status(500).json({ message: "Failed to sync tokens" });
    }
  });

  // Token unlock routes
  app.get("/api/unlocks", async (req, res) => {
    try {
      const { tokenId } = req.query;
      const unlocks = await storage.getTokenUnlocks(tokenId as string);
      res.json(unlocks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch token unlocks" });
    }
  });

  app.get("/api/unlocks/upcoming", async (req, res) => {
    try {
      const upcomingUnlocks = await storage.getUpcomingUnlocks();
      res.json(upcomingUnlocks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch upcoming unlocks" });
    }
  });

  // DeFi protocol routes
  app.get("/api/defi/protocols", async (req, res) => {
    try {
      const protocols = await storage.getDefiProtocols();
      res.json(protocols);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch DeFi protocols" });
    }
  });

  app.post("/api/defi/protocols/sync", async (req, res) => {
    try {
      const cashCowProtocols = await defiLlamaService.getCashCowProtocols();
      const syncedProtocols = [];

      for (const protocol of cashCowProtocols) {
        const protocolData = defiLlamaService.formatProtocolForStorage(protocol);
        
        // Try to find existing protocol
        const protocols = await storage.getDefiProtocols();
        const existing = protocols.find(p => p.defillama === protocol.slug);
        
        let savedProtocol;
        if (existing) {
          savedProtocol = await storage.updateDefiProtocol(existing.id, protocolData);
        } else {
          savedProtocol = await storage.createDefiProtocol(protocolData);
        }
        
        syncedProtocols.push(savedProtocol);
      }

      res.json({ message: `Synced ${syncedProtocols.length} protocols`, protocols: syncedProtocols });
    } catch (error) {
      console.error("Protocol sync error:", error);
      res.status(500).json({ message: "Failed to sync protocols" });
    }
  });

  // News routes
  app.get("/api/news", async (req, res) => {
    try {
      const { limit = 50, coins } = req.query;
      
      // Get data directly from Velo API
      const coinArray = coins ? (coins as string).split(',') : undefined;
      const veloNews = await veloService.getNews(Number(limit), coinArray);
      
      // Transform to frontend format
      const formattedNews = veloNews.map(item => ({
        id: item.id.toString(),
        title: item.headline,
        content: item.summary,
        source: item.source,
        sourceUrl: item.link,
        priority: item.priority,
        coins: item.coins,
        publishedAt: new Date(item.time).toISOString(),
        createdAt: new Date(item.effectiveTime).toISOString()
      }));
      
      res.json(formattedNews);
    } catch (error) {
      console.error("News fetch error:", error);
      res.status(500).json({ message: "Failed to fetch news" });
    }
  });

  app.post("/api/news/sync", async (req, res) => {
    try {
      const { limit = 50, coins } = req.body;
      const veloNews = await veloService.getNews(limit, coins);
      const syncedNews = [];

      for (const newsItem of veloNews) {
        const formattedNews = veloService.formatNewsForStorage(newsItem);
        const savedNews = await storage.createNewsItem(formattedNews);
        syncedNews.push(savedNews);
      }

      res.json({ message: `Synced ${syncedNews.length} news items`, news: syncedNews });
    } catch (error) {
      console.error("News sync error:", error);
      res.status(500).json({ message: "Failed to sync news" });
    }
  });

  // Get historical news (past 48 hours)
  app.get("/api/news/historical", async (req, res) => {
    try {
      const historicalNews = await veloService.getHistoricalNews(48);
      
      // Transform to frontend format
      const formattedNews = historicalNews.map(item => ({
        id: item.id.toString(),
        title: item.headline,
        content: item.summary,
        source: item.source,
        sourceUrl: item.link,
        priority: item.priority,
        coins: item.coins,
        publishedAt: new Date(item.time).toISOString(),
        createdAt: new Date(item.effectiveTime).toISOString()
      }));
      
      res.json({ 
        message: `Loaded ${formattedNews.length} news items from past 48 hours`,
        news: formattedNews 
      });
    } catch (error) {
      console.error("Historical news fetch error:", error);
      res.status(500).json({ message: "Failed to fetch historical news" });
    }
  });

  // Narrative tracker routes for DeFiLlama
  app.get("/api/narratives/performance", async (req, res) => {
    try {
      const narratives = await defiLlamaNarrativesService.getNarrativePerformance();
      res.json(narratives);
    } catch (error) {
      console.error("Narrative performance fetch error:", error);
      res.status(500).json({ message: "Failed to fetch narrative performance" });
    }
  });

  app.get("/api/narratives/top-performers", async (req, res) => {
    try {
      const { limit = 5 } = req.query;
      const topPerformers = defiLlamaNarrativesService.getTopPerformers(Number(limit));
      res.json(topPerformers);
    } catch (error) {
      console.error("Top performers fetch error:", error);
      res.status(500).json({ message: "Failed to fetch top performers" });
    }
  });

  app.get("/api/narratives/worst-performers", async (req, res) => {
    try {
      const { limit = 5 } = req.query;
      const worstPerformers = defiLlamaNarrativesService.getWorstPerformers(Number(limit));
      res.json(worstPerformers);
    } catch (error) {
      console.error("Worst performers fetch error:", error);
      res.status(500).json({ message: "Failed to fetch worst performers" });
    }
  });

  // Force refresh narratives (bypass cache)
  app.post("/api/narratives/refresh", async (req, res) => {
    try {
      const freshData = await defiLlamaNarrativesService.forceRefreshNarrativePerformance();
      res.json({ 
        message: `Refreshed ${freshData.length} narratives`,
        timestamp: new Date().toISOString(),
        data: freshData
      });
    } catch (error) {
      console.error("Force refresh error:", error);
      res.status(500).json({ message: "Failed to force refresh narratives" });
    }
  });

  // Get cache statistics
  app.get("/api/narratives/cache-stats", (req, res) => {
    try {
      const stats = defiLlamaNarrativesService.getCacheStats();
      res.json({
        ...stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Cache stats error:", error);
      res.status(500).json({ message: "Failed to get cache statistics" });
    }
  });

  app.get("/api/narratives/history", async (req, res) => {
    try {
      const { days = 30 } = req.query;
      const history = await defiLlamaNarrativesService.getNarrativeHistory(Number(days));
      res.json(history);
    } catch (error) {
      console.error("Narrative history fetch error:", error);
      res.status(500).json({ message: "Failed to fetch narrative history" });
    }
  });

  // Start Velo news streaming - Disabled for now due to WebSocket 404 errors
  // veloService.startNewsStream(async (message) => {
  //   try {
  //     if (message.type === 'news' && message.data) {
  //       // Save new news item to database
  //       const newsData = veloService.formatNewsForStorage(message.data);
  //       const savedNews = await storage.createNewsItem(newsData);
  //       
  //       // Broadcast to all connected WebSocket clients
  //       if ((app as any).veloStreamClients) {
  //         const broadcast = JSON.stringify({
  //           type: 'news_update',
  //           data: savedNews
  //         });
  //         
  //         (app as any).veloStreamClients.forEach((ws: any) => {
  //           if (ws.readyState === 1) { // WebSocket.OPEN
  //             ws.send(broadcast);
  //           }
  //         });
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error processing stream message:', error);
  //   }
  // });

  // Monte Carlo simulation routes
  app.get("/api/monte-carlo/:tokenId", async (req, res) => {
    try {
      const { tokenId } = req.params;
      const simulations = await storage.getMonteCarloSimulations(tokenId);
      res.json(simulations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Monte Carlo simulations" });
    }
  });

  app.post("/api/monte-carlo/run", async (req, res) => {
    try {
      const { tokenId, timeHorizon = 1, simulationRuns = 10000, fundamentalFactors } = req.body;
      
      const token = await storage.getToken(tokenId);
      if (!token || !token.coingeckoId) {
        return res.status(404).json({ message: "Token not found or missing CoinGecko ID" });
      }

      // Get historical data from CoinGecko
      const historicalData = await coinGeckoService.getCoinHistory(token.coingeckoId, 365);
      const currentPrice = parseFloat(token.currentPrice || "0");

      // Run Monte Carlo simulation
      const result = await monteCarloService.createTokenSimulation(
        token.coingeckoId,
        currentPrice,
        historicalData.prices,
        timeHorizon,
        simulationRuns,
        fundamentalFactors
      );

      // Save simulation to database
      const simulation = await storage.createMonteCarloSimulation({
        tokenId,
        bearishPrice: result.bearishPrice.toString(),
        basePrice: result.basePrice.toString(),
        bullishPrice: result.bullishPrice.toString(),
        targetDate: new Date(Date.now() + timeHorizon * 365 * 24 * 60 * 60 * 1000),
        volatility: "0", // Would need to extract from result
        driftRate: "0",  // Would need to extract from result
        simulationRuns,
        parameters: fundamentalFactors,
      });

      res.json({ simulation, result });
    } catch (error) {
      console.error("Monte Carlo simulation error:", error);
      res.status(500).json({ message: "Failed to run Monte Carlo simulation" });
    }
  });

  // Hyperliquid success story routes
  app.get("/api/hyperliquid/metrics", async (req, res) => {
    try {
      const metrics = await storage.getHyperliquidMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Hyperliquid metrics" });
    }
  });

  app.post("/api/hyperliquid/sync", async (req, res) => {
    try {
      // Fetch latest data from Dune Analytics
      const allMetrics = await duneService.getHyperliquidAllMetrics();
      
      if (allMetrics.length === 0) {
        return res.status(404).json({ message: "No Hyperliquid data available" });
      }

      const latest = allMetrics[0];
      const metricsData = {
        marketShare: latest.market_share.toString(),
        annualRevenue: (latest.revenue * 365).toString(), // Convert daily to annual
        activeUsers: latest.daily_active_users,
        volume30d: latest.volume_24h.toString(), // Would need 30d data
        tvl: latest.tvl.toString(),
        date: new Date(),
      };

      const savedMetrics = await storage.createHyperliquidMetrics(metricsData);
      res.json(savedMetrics);
    } catch (error) {
      console.error("Hyperliquid sync error:", error);
      res.status(500).json({ message: "Failed to sync Hyperliquid metrics" });
    }
  });

  // Analytics dashboard data
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const [tokens, failedTokens, upcomingUnlocks, protocols, hyperliquidMetrics] = await Promise.all([
        storage.getTokens(),
        storage.getFailedTokens(),
        storage.getUpcomingUnlocks(),
        storage.getDefiProtocols(),
        storage.getHyperliquidMetrics(),
      ]);

      const totalRevenue = protocols.reduce((sum, p) => sum + parseFloat(p.revenue1y || "0"), 0);
      const totalUnlockValue = upcomingUnlocks.reduce((sum, u) => sum + parseFloat(u.unlockValue || "0"), 0);

      const stats = {
        failedTokens: failedTokens.length,
        pendingUnlocks: upcomingUnlocks.length,
        totalRevenue: totalRevenue,
        totalUnlockValue: totalUnlockValue,
        activeTracking: tokens.length,
        hyperliquid: hyperliquidMetrics ? {
          marketShare: parseFloat(hyperliquidMetrics.marketShare || "0"),
          annualRevenue: parseFloat(hyperliquidMetrics.annualRevenue || "0"),
          activeUsers: hyperliquidMetrics.activeUsers || 0,
          volume30d: parseFloat(hyperliquidMetrics.volume30d || "0"),
          tvl: parseFloat(hyperliquidMetrics.tvl || "0"),
        } : null,
      };

      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
