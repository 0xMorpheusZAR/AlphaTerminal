import { alphaTerminal } from '../src/AlphaTerminal';

async function demonstrateSupeClaudeFramework() {
  console.log('🎭 SuperClaude AlphaTerminal - Usage Example');
  console.log('============================================\n');

  try {
    // Initialize the system
    await alphaTerminal.initialize();

    // Subscribe to persona activity updates
    alphaTerminal.subscribeToPersonaUpdates((update) => {
      console.log(`📢 Persona Update: ${JSON.stringify(update)}`);
    });

    console.log('\n1. Analyzing Token Failures (Automatic Persona Selection)');
    console.log('----------------------------------------------------------');
    const failures = await alphaTerminal.analyzeTokenFailures(90);
    console.log('Result:', JSON.stringify(failures, null, 2));

    console.log('\n2. Creating Trading Dashboard (Multi-Persona Coordination)');
    console.log('-----------------------------------------------------------');
    const dashboard = await alphaTerminal.createTradingDashboard({
      components: ['market-heatmap', 'defi-metrics', 'real-time-news'],
      theme: 'dark',
      realtime: true
    });
    console.log('Result:', JSON.stringify(dashboard, null, 2));

    console.log('\n3. Direct Framework Task Processing');
    console.log('------------------------------------');
    const customTask = await alphaTerminal.framework.processTask({
      input: `Build a DeFi yield aggregator with:
        - Multi-protocol integration (Aave, Compound, Curve)
        - Automatic rebalancing strategies
        - Gas optimization
        - Risk assessment dashboard
        - Secure vault implementation`,
      context: {
        projectType: 'defi-aggregator',
        security: 'critical',
        performance: 'high'
      }
    });
    console.log('Result:', JSON.stringify(customTask, null, 2));

    console.log('\n4. Command Execution Examples');
    console.log('------------------------------');
    
    // Build command
    const buildResult = await alphaTerminal.framework.executeCommand('/build', {
      feature: 'portfolio-tracker'
    });
    console.log('Build Result:', JSON.stringify(buildResult, null, 2));

    // Analyze command
    const analyzeResult = await alphaTerminal.framework.executeCommand('/analyze', {
      data: 'market-sentiment'
    });
    console.log('Analyze Result:', JSON.stringify(analyzeResult, null, 2));

    // Security command
    const securityResult = await alphaTerminal.framework.executeCommand('/secure', {
      component: 'api-endpoints'
    });
    console.log('Security Result:', JSON.stringify(securityResult, null, 2));

    console.log('\n5. Advanced Analytics Examples');
    console.log('-------------------------------');
    
    // Monte Carlo simulation
    const simulation = await alphaTerminal.runMonteCarloSimulation('BTC', 10000);
    console.log('Simulation Result:', JSON.stringify(simulation, null, 2));

    // Liquidity spike detection
    const spikes = await alphaTerminal.detectLiquiditySpikes();
    console.log('Liquidity Spikes:', JSON.stringify(spikes, null, 2));

    console.log('\n6. System Status');
    console.log('----------------');
    const status = alphaTerminal.getStatus();
    console.log('Status:', JSON.stringify(status, null, 2));

    console.log('\n✨ SuperClaude AlphaTerminal demonstration completed!');
    console.log('This showcases systematic AI persona invocation for crypto analytics.');

  } catch (error) {
    console.error('❌ Error during demonstration:', error);
  }
}

// Event handling example
function setupEventHandling() {
  alphaTerminal.on('task:completed', (task) => {
    console.log(`🎯 Task completed: ${task.id}`);
  });

  alphaTerminal.on('persona:activated', (data) => {
    console.log(`🤖 ${data.persona} persona activated`);
  });

  alphaTerminal.on('data:updated', (data) => {
    console.log(`📊 Market data updated: ${data.length} assets`);
  });
}

// Run the demonstration
if (require.main === module) {
  setupEventHandling();
  demonstrateSupeClaudeFramework()
    .then(() => {
      console.log('\n🏁 Demonstration finished. Press Ctrl+C to exit.');
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}