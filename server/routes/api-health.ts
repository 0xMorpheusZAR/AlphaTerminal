import { Router } from 'express';
import { testDefiLlamaEndpoints } from '../services/defillama-test';

export function registerApiHealthRoutes(app: Router) {
  // API health check endpoint
  app.get('/api/health/defillama', async (req, res) => {
    try {
      console.log('🏥 Running DefiLlama API health check...');
      const results = await testDefiLlamaEndpoints();
      
      res.json({
        timestamp: new Date().toISOString(),
        status: results.summary.failed === 0 ? 'healthy' : 'degraded',
        summary: results.summary,
        endpoints: {
          free: results.freeEndpoints.map(e => ({
            name: e.name,
            endpoint: e.endpoint,
            status: e.status,
            error: e.error
          })),
          pro: results.proEndpoints.map(e => ({
            name: e.name,
            endpoint: e.endpoint,
            status: e.status,
            error: e.error
          }))
        }
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
          status: process.env.DEFILLAMA_PRO_API_KEY ? 'configured' : 'not_configured',
          hasApiKey: !!process.env.DEFILLAMA_PRO_API_KEY
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