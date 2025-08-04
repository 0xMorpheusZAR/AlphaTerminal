#!/usr/bin/env node

import './server';
import { alphaTerminal } from './AlphaTerminal';

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║     █████╗ ██╗     ██████╗ ██╗  ██╗ █████╗                      ║
║    ██╔══██╗██║     ██╔══██╗██║  ██║██╔══██╗                     ║
║    ███████║██║     ██████╔╝███████║███████║                     ║
║    ██╔══██║██║     ██╔═══╝ ██╔══██║██╔══██║                     ║
║    ██║  ██║███████╗██║     ██║  ██║██║  ██║                     ║
║    ╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝                     ║
║                                                                   ║
║         ████████╗███████╗██████╗ ███╗   ███╗██╗███╗   ██╗       ║
║         ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██║████╗  ██║       ║
║            ██║   █████╗  ██████╔╝██╔████╔██║██║██╔██╗ ██║       ║
║            ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██║██║╚██╗██║       ║
║            ██║   ███████╗██║  ██║██║ ╚═╝ ██║██║██║ ╚████║       ║
║            ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝       ║
║                                                                   ║
║           Bloomberg-Style Crypto Market Dashboard                 ║
║              Powered by SuperClaude Framework v3.0                ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝

Starting AlphaTerminal...
`);

// Initialize and start
alphaTerminal.initialize()
  .then(() => {
    console.log('✓ AlphaTerminal initialized successfully');
    console.log('✓ Access the dashboard at http://localhost:3000');
    console.log('✓ WebSocket endpoint available at ws://localhost:3000');
    console.log('\nAvailable API endpoints:');
    console.log('  GET  /api/market/overview     - Market overview');
    console.log('  GET  /api/market/data         - Market data');
    console.log('  GET  /api/market/metrics      - Market metrics');
    console.log('  POST /api/analyze/token       - Analyze specific token');
    console.log('  POST /api/command             - Execute terminal command');
    console.log('  GET  /api/system/metrics      - System metrics');
    console.log('  GET  /api/system/diagnostics  - Run diagnostics');
    console.log('\nPress Ctrl+C to exit');
  })
  .catch((error) => {
    console.error('✗ Failed to initialize AlphaTerminal:', error);
    process.exit(1);
  });