import { alphaTerminal } from '../src/AlphaTerminal';

async function demonstrateSystematicPersonaInvocation() {
  console.log('=== AlphaTerminal with SuperClaude Framework ===\n');

  // Subscribe to persona updates to see systematic invocation
  alphaTerminal.subscribeToPersonaUpdates((update) => {
    console.log(`🤖 ${update.persona} is working on: ${update.task}`);
  });

  // Subscribe to completion events
  alphaTerminal.on('analysis:complete', (result) => {
    console.log('\n✅ Task completed successfully');
    console.log(`   Personas used: ${result.result.personasInvoked?.join(', ') || 'N/A'}`);
    console.log(`   Execution time: ${result.executionTime}ms`);
  });

  try {
    // Initialize the system
    console.log('🚀 Initializing AlphaTerminal...\n');
    await alphaTerminal.initialize();

    // Example 1: Complex task that requires multiple personas
    console.log('\n📊 Example 1: Building a Real-Time Trading Dashboard\n');
    console.log('This task will automatically invoke:');
    console.log('- Architect: For system design');
    console.log('- Frontend: For UI components');
    console.log('- Backend: For data services');
    console.log('- Performance: For optimization\n');

    const dashboardResult = await alphaTerminal.createTradingDashboard({
      components: [
        'market-heatmap',
        'token-failure-tracker',
        'defi-metrics',
        'liquidity-monitor',
        'real-time-news'
      ],
      theme: 'dark',
      realtime: true
    });

    console.log('\nDashboard creation result:', dashboardResult);

    // Example 2: Security-focused task
    console.log('\n\n🔒 Example 2: Securing Trading API\n');
    console.log('This task will automatically invoke:');
    console.log('- Security: For authentication and encryption');
    console.log('- Backend: For API implementation');
    console.log('- Performance: For rate limiting\n');

    const apiResult = await alphaTerminal.setupTradingAPI({
      endpoints: [
        '/api/market-data',
        '/api/execute-trade',
        '/api/portfolio',
        '/api/alerts'
      ],
      rateLimit: 100,
      authentication: true
    });

    console.log('\nAPI security result:', apiResult);

    // Example 3: Analysis task
    console.log('\n\n🔍 Example 3: Analyzing Token Failures\n');
    console.log('This task will automatically invoke:');
    console.log('- Analyzer: For data analysis');
    console.log('- Backend: For data fetching');
    console.log('- Performance: For handling large datasets\n');

    const analysisResult = await alphaTerminal.analyzeTokenFailures(90);
    console.log('\nToken failure analysis:', analysisResult);

    // Example 4: Performance optimization
    console.log('\n\n⚡ Example 4: Optimizing Data Pipeline\n');
    console.log('This task will automatically invoke:');
    console.log('- Performance: For optimization strategies');
    console.log('- Backend: For pipeline implementation');
    console.log('- Analyzer: For bottleneck identification\n');

    const optimizationResult = await alphaTerminal.optimizeDataPipeline();
    console.log('\nOptimization result:', optimizationResult);

    // Example 5: Testing and quality assurance
    console.log('\n\n🧪 Example 5: Running System Tests\n');
    console.log('This task will automatically invoke:');
    console.log('- QA: For test creation and execution');
    console.log('- Analyzer: For test coverage analysis');
    console.log('- Security: For security testing\n');

    const testResult = await alphaTerminal.runSystemTests();
    console.log('\nTest results:', testResult);

    // Show execution history
    console.log('\n\n📝 Execution History Summary\n');
    const history = alphaTerminal.getExecutionHistory();
    
    history.forEach((task, index) => {
      console.log(`Task ${index + 1}:`);
      console.log(`  Success: ${task.success}`);
      console.log(`  Personas: ${task.personasInvoked.join(', ')}`);
      console.log(`  Total time: ${task.metrics.totalTime}ms`);
      console.log(`  Suggestions: ${task.suggestions?.join('; ') || 'None'}`);
      console.log('');
    });

    // Show cache statistics
    const cacheStats = alphaTerminal.getCacheStats();
    console.log('\n💾 Cache Statistics:');
    console.log(`  Market data entries: ${cacheStats.marketDataEntries}`);
    console.log(`  Analysis entries: ${cacheStats.analysisEntries}`);
    console.log(`  Historical tasks: ${cacheStats.historicalTasks}`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Advanced example: Custom task with context
async function demonstrateCustomTaskProcessing() {
  console.log('\n\n=== Custom Task Processing ===\n');

  // Create a complex custom task that will trigger multiple personas
  const customTask = `
    Build a comprehensive crypto portfolio analyzer that:
    1. Tracks multiple portfolios across different wallets
    2. Calculates real-time P&L with gas fees included
    3. Provides tax reporting features
    4. Includes DeFi position tracking (LP tokens, staking, lending)
    5. Has a beautiful, responsive UI with dark/light themes
    6. Implements secure API key management
    7. Optimizes for handling 1000+ transactions per portfolio
    8. Includes comprehensive testing suite
  `;

  console.log('📋 Custom Task:', customTask);
  console.log('\nExpected persona invocations:');
  console.log('- Architect: For overall system design');
  console.log('- Frontend: For UI implementation');
  console.log('- Backend: For data processing and APIs');
  console.log('- Security: For API key management');
  console.log('- Performance: For handling large datasets');
  console.log('- QA: For testing suite');
  console.log('- Analyzer: For tax calculation logic\n');

  // Process the task using the framework directly
  const framework = (alphaTerminal as any).framework;
  const result = await framework.processTask({
    input: customTask,
    context: {
      projectType: 'crypto-analytics',
      features: ['portfolio-tracking', 'tax-reporting', 'defi-integration'],
      performance: 'high-volume',
      security: 'critical'
    }
  });

  console.log('\n🎯 Task Processing Results:');
  console.log(`Success: ${result.success}`);
  console.log(`Personas invoked: ${result.personasInvoked.join(', ')}`);
  console.log(`\nExecution path:`);
  result.executionPath.forEach((step, i) => {
    console.log(`  ${i + 1}. ${step}`);
  });
  
  console.log(`\nMetrics:`);
  console.log(`  Total time: ${result.metrics.totalTime}ms`);
  console.log(`  Context analysis: ${result.metrics.contextAnalysisTime}ms`);
  console.log(`  Persona execution times:`);
  Object.entries(result.metrics.personaTime).forEach(([persona, time]) => {
    console.log(`    - ${persona}: ${time}ms`);
  });

  if (result.suggestions && result.suggestions.length > 0) {
    console.log(`\n💡 Suggestions:`);
    result.suggestions.forEach(suggestion => {
      console.log(`  - ${suggestion}`);
    });
  }
}

// Run the demonstrations
async function main() {
  try {
    await demonstrateSystematicPersonaInvocation();
    await demonstrateCustomTaskProcessing();
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

// Execute if running directly
if (require.main === module) {
  main();
}