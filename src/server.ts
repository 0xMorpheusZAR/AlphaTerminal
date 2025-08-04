import * as express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import * as path from 'path';
import { alphaTerminal } from './AlphaTerminal';
import { CryptoDataService } from './services/CryptoDataService';
import { superclaude } from './core/SuperClaudeFramework';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Initialize services
let cryptoDataService: CryptoDataService;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    activePersonas: alphaTerminal.getActivePersonas(),
    cacheStats: alphaTerminal.getCacheStats()
  });
});

app.post('/api/analyze/token-failures', async (req, res) => {
  try {
    const { threshold = 90 } = req.body;
    const result = await alphaTerminal.analyzeTokenFailures(threshold);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.post('/api/analyze/defi-protocols', async (req, res) => {
  try {
    const result = await alphaTerminal.analyzeDeFiProtocols();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.post('/api/analyze/liquidity-spikes', async (req, res) => {
  try {
    const result = await alphaTerminal.detectLiquiditySpikes();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.post('/api/simulate/monte-carlo', async (req, res) => {
  try {
    const { token, timeframe, simulations } = req.body;
    const result = await alphaTerminal.runMonteCarloSimulation({
      token,
      timeframe,
      simulations
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/api/commands', (req, res) => {
  const commands = superclaude.getAvailableCommands();
  res.json({ commands });
});

app.post('/api/execute-command', async (req, res) => {
  try {
    const { command, input, options } = req.body;
    const result = await superclaude.executeCommand(command, { input, options });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/api/history', (req, res) => {
  const history = alphaTerminal.getExecutionHistory();
  res.json({ history });
});

// WebSocket connections
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Subscribe to persona updates
  alphaTerminal.subscribeToPersonaUpdates((update) => {
    socket.emit('persona:update', update);
  });

  // Subscribe to market data updates
  alphaTerminal.subscribeToAlerts((alert) => {
    socket.emit('market:alert', alert);
  });

  // Handle custom task requests
  socket.on('task:execute', async (data) => {
    try {
      const result = await superclaude.processTask(data);
      socket.emit('task:result', result);
    } catch (error) {
      socket.emit('task:error', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
async function startServer() {
  try {
    console.log('🚀 Initializing AlphaTerminal...');
    await alphaTerminal.initialize();

    console.log('📊 Initializing Crypto Data Service...');
    cryptoDataService = new CryptoDataService(superclaude);
    await cryptoDataService.initialize();

    httpServer.listen(PORT, () => {
      console.log(`
✨ SuperClaude AlphaTerminal is running!
🌐 Server: http://localhost:${PORT}
📡 WebSocket: ws://localhost:${PORT}

Available endpoints:
- GET  /api/health
- POST /api/analyze/token-failures
- POST /api/analyze/defi-protocols
- POST /api/analyze/liquidity-spikes
- POST /api/simulate/monte-carlo
- POST /api/execute-command
- GET  /api/commands
- GET  /api/history

Visit http://localhost:${PORT} to access the web interface.
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();