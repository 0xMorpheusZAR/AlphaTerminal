import { AlphaTerminal } from '../src/AlphaTerminal';
import { CryptoDataService } from '../src/services/CryptoDataService';
import { DashboardConfig } from '../src/types';

async function demonstrateAlphaTerminal() {
  console.log('=== AlphaTerminal Usage Examples ===\n');

  // Initialize AlphaTerminal
  const terminal = new AlphaTerminal({
    logLevel: 'info',
    enableMockData: true
  });

  await terminal.initialize();

  // Example 1: Get Market Overview
  console.log('1. Getting Market Overview...');
  const overview = await terminal.getMarketOverview();
  console.log(`Total Market Cap: $${(overview.metrics.totalMarketCap / 1e9).toFixed(2)}B`);
  console.log(`BTC Dominance: ${overview.metrics.btcDominance.toFixed(2)}%`);
  console.log(`Market Anomalies: ${overview.anomalies.length} detected\n`);

  // Example 2: Analyze Specific Token
  console.log('2. Analyzing Bitcoin (BTC)...');
  const btcAnalysis = await terminal.analyzeToken('BTC');
  console.log(`Current Price: $${btcAnalysis.token.price.toFixed(2)}`);
  console.log(`24h Change: ${btcAnalysis.token.priceChange24h.toFixed(2)}%`);
  console.log(`Prediction: ${btcAnalysis.prediction.direction}`);
  console.log(`Confidence: ${(btcAnalysis.prediction.confidence * 100).toFixed(0)}%\n`);

  // Example 3: Execute Commands
  console.log('3. Executing Terminal Commands...');
  const helpResult = await terminal.executeCommand('help');
  console.log(`Available commands: ${helpResult.commands.length}`);
  
  const marketCommand = await terminal.executeCommand('market overview');
  console.log('Market overview command executed successfully\n');

  // Example 4: Token Failure Analysis
  console.log('4. Analyzing Token Failures...');
  const failures = await terminal.analyzeTokenFailures(90);
  console.log(`Analyzed failures over ${failures.timeframe}`);
  console.log(`Failure patterns detected: ${failures.failurePatterns.length}`);
  failures.failurePatterns.forEach(pattern => {
    console.log(`  - ${pattern.pattern}: ${pattern.frequency} occurrences (${pattern.severity})`);
  });
  console.log('');

  // Example 5: Create Trading Strategy
  console.log('5. Creating Trading Strategy...');
  const strategy = await terminal.createTradingStrategy({
    type: 'momentum',
    pairs: ['BTC/USDT', 'ETH/USDT'],
    riskLevel: 'medium'
  });
  console.log('Trading strategy created successfully\n');

  // Example 6: Dashboard Configuration
  console.log('6. Creating Dashboard Configuration...');
  const dashboardConfig: DashboardConfig = {
    layout: 'bloomberg',
    theme: 'dark',
    refreshInterval: 5000,
    dataProviders: ['coingecko', 'binance'],
    widgets: [
      {
        id: 'market-overview',
        type: 'table',
        position: { x: 0, y: 0, w: 6, h: 4 },
        dataSource: 'market-data'
      },
      {
        id: 'price-chart',
        type: 'chart',
        position: { x: 6, y: 0, w: 6, h: 4 },
        dataSource: 'price-history'
      },
      {
        id: 'market-heatmap',
        type: 'heatmap',
        position: { x: 0, y: 4, w: 12, h: 3 },
        dataSource: 'market-performance'
      },
      {
        id: 'news-feed',
        type: 'news',
        position: { x: 0, y: 7, w: 6, h: 3 },
        dataSource: 'crypto-news'
      },
      {
        id: 'portfolio',
        type: 'analytics',
        position: { x: 6, y: 7, w: 6, h: 3 },
        dataSource: 'portfolio-data'
      }
    ]
  };
  
  const dashboard = await terminal.createDashboard(dashboardConfig);
  console.log('Bloomberg-style dashboard created successfully\n');

  // Example 7: System Metrics
  console.log('7. Getting System Metrics...');
  const metrics = terminal.getSystemMetrics();
  console.log(`Active Personas: ${metrics.activePersonas.length}`);
  console.log(`Tasks Processed: ${metrics.framework.tasksProcessed}`);
  console.log(`Success Rate: ${(metrics.framework.successRate * 100).toFixed(0)}%`);
  console.log(`Uptime: ${(metrics.uptime / 60).toFixed(1)} minutes\n`);

  // Example 8: Run Diagnostics
  console.log('8. Running System Diagnostics...');
  const diagnostics = await terminal.runDiagnostics();
  console.log(`Framework Status: ${diagnostics.framework}`);
  console.log(`Data Service Status: ${diagnostics.dataService}`);
  console.log(`Overall Health: ${diagnostics.overall}\n`);

  // Example 9: Direct Data Service Usage
  console.log('9. Using Data Service Directly...');
  const dataService = new CryptoDataService();
  
  // Get top 5 cryptocurrencies
  const top5 = await dataService.getMarketData(['BTC', 'ETH', 'BNB', 'SOL', 'ADA']);
  console.log('Top 5 Cryptocurrencies:');
  top5.forEach(coin => {
    console.log(`  ${coin.symbol}: $${coin.price.toFixed(2)} (${coin.priceChange24h > 0 ? '+' : ''}${coin.priceChange24h.toFixed(2)}%)`);
  });
  console.log('');

  // Detect anomalies
  const anomalies = await dataService.detectMarketAnomalies();
  console.log(`Market Anomalies Detected: ${anomalies.length}`);
  anomalies.slice(0, 3).forEach(anomaly => {
    console.log(`  - ${anomaly.message} (${anomaly.severity})`);
  });
  console.log('');

  // Example 10: Price Predictions
  console.log('10. Getting Price Predictions...');
  const ethPrediction = await dataService.predictPriceMovements('ETH', '24h');
  console.log(`ETH Price Prediction (24h):`);
  console.log(`  Current: $${ethPrediction.currentPrice.toFixed(2)}`);
  console.log(`  Predicted: $${ethPrediction.predictedPrice.toFixed(2)}`);
  console.log(`  Direction: ${ethPrediction.direction}`);
  console.log(`  RSI: ${ethPrediction.indicators.rsi.toFixed(2)}`);
  console.log(`  Volume: ${ethPrediction.indicators.volume}`);

  // Cleanup
  terminal.shutdown();
  console.log('\n=== Demo Complete ===');
}

// Run the demonstration
demonstrateAlphaTerminal().catch(console.error);