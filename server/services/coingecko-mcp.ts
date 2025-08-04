import { spawn, ChildProcess } from 'child_process';
import { CoinGeckoPrice, CoinGeckoHistorical } from './coingecko';

export class CoinGeckoMCPService {
  private mcpProcess: ChildProcess | null = null;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.COINGECKO_PRO_API_KEY || process.env.COINGECKO_API_KEY || '';
  }

  async initialize(): Promise<void> {
    if (!this.apiKey) {
      console.warn('⚠️  CoinGecko API key not found. MCP server will not be started.');
      return;
    }

    try {
      console.log('🚀 Starting CoinGecko MCP server...');
      
      this.mcpProcess = spawn('npx', ['-y', '@coingecko/coingecko-mcp', '--client=claude-code'], {
        env: {
          ...process.env,
          COINGECKO_PRO_API_KEY: this.apiKey,
          COINGECKO_ENVIRONMENT: 'pro'
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.mcpProcess.stdout?.on('data', (data) => {
        console.log(`MCP: ${data.toString()}`);
      });

      this.mcpProcess.stderr?.on('data', (data) => {
        console.error(`MCP Error: ${data.toString()}`);
      });

      this.mcpProcess.on('close', (code) => {
        console.log(`MCP server exited with code ${code}`);
      });

      // Give the server time to start
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('✅ CoinGecko MCP server started successfully');
    } catch (error) {
      console.error('Failed to start MCP server:', error);
    }
  }

  async shutdown(): Promise<void> {
    if (this.mcpProcess) {
      this.mcpProcess.kill();
      this.mcpProcess = null;
    }
  }

  // MCP communication methods would go here
  // For now, we'll continue using the direct API approach
  // since MCP requires a more complex integration
}

export const coinGeckoMCPService = new CoinGeckoMCPService();