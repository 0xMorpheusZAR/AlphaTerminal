import { Router } from 'express';

export function registerApiHealthRoutes(app: Router) {
  // API health check endpoint
  app.get('/api/health/defillama', async (req, res) => {
    try {
      console.log('🏥 Running DefiLlama API health check...');
      
      // Quick health check for main endpoints
      const endpoints = [
        { name: 'All Protocols', url: 'https://api.llama.fi/protocols' },
        { name: 'TVL Historical', url: 'https://api.llama.fi/v2/historicalChainTvl' },
        { name: 'DEX Overview', url: 'https://api.llama.fi/overview/dexs' }
      ];
      
      const results = await Promise.all(
        endpoints.map(async (endpoint) => {
          try {
            const response = await fetch(endpoint.url, { timeout: 5000 });
            return {
              name: endpoint.name,
              url: endpoint.url,
              status: response.ok ? 'healthy' : 'error',
              statusCode: response.status
            };
          } catch (error) {
            return {
              name: endpoint.name,
              url: endpoint.url,
              status: 'error',
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        })
      );
      
      const healthy = results.filter(r => r.status === 'healthy').length;
      const failed = results.filter(r => r.status === 'error').length;
      
      res.json({
        timestamp: new Date().toISOString(),
        status: failed === 0 ? 'healthy' : 'degraded',
        summary: {
          total: results.length,
          healthy,
          failed
        },
        endpoints: results,
        proApiStatus: process.env.DEFILLAMA_API_KEY ? 'configured' : 'not_configured'
      });
    } catch (error) {
      console.error('❌ API health check failed:', error);
      res.status(500).json({
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get current API configuration
  app.get('/api/health/config', async (req, res) => {
    res.json({
      defiLlama: {
        freeApi: {
          baseUrl: 'https://api.llama.fi',
          status: 'active',
          workingEndpoints: [
            '/protocols',
            '/v2/historicalChainTvl', 
            '/overview/dexs'
          ]
        },
        proApi: {
          baseUrl: 'https://pro-api.llama.fi',
          status: process.env.DEFILLAMA_API_KEY ? 'configured' : 'not_configured',
          hasApiKey: !!process.env.DEFILLAMA_API_KEY
        }
      },
      other: {
        coinGecko: {
          status: process.env.COINGECKO_API_KEY ? 'configured' : 'not_configured'
        },
        dune: {
          status: process.env.DUNE_API_KEY ? 'configured' : 'not_configured'
        },
        velo: {
          status: process.env.VELO_API_KEY ? 'configured' : 'not_configured'
        }
      }
    });
  });
}