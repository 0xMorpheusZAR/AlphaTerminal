/**
 * Simple startup script for bloomberg-pro server
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('Starting AlphaTerminal Bloomberg Pro Server...\n');

// Set environment variables
const env = {
  ...process.env,
  COINGECKO_PRO_API_KEY: 'CG-MVg68aVqeVyu8fzagC9E1hPj',
  PORT: '3337'
};

// Start the server
const server = spawn('node', ['bloomberg-pro-server.js'], {
  cwd: __dirname,
  env: env,
  stdio: 'inherit'
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
});

server.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  server.kill();
  process.exit();
});