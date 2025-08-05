#!/bin/bash

# AlphaTerminal Bloomberg-Style Dashboard Deployment Script
# This script sets up and deploys the complete Bloomberg terminal

set -e

echo "
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   AlphaTerminal Bloomberg Deployment                          ║
║   Professional Crypto Analytics Platform                      ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOL
# CoinGecko Pro API Key
COINGECKO_PRO_API_KEY=CG-MVg68aVqeVyu8fzagC9E1hPj

# API Configuration
PORT=3001
FRONTEND_URL=http://localhost:3000

# Redis Configuration (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# Database Configuration (optional)
DATABASE_URL=postgresql://user:password@localhost:5432/alphaterminal

# Environment
NODE_ENV=development
EOL
    echo "✅ .env file created with default values"
else
    echo "✅ .env file already exists"
fi

# Build the project
echo "🔨 Building the project..."
npm run build

# Start services
echo "🚀 Starting services..."

# Function to start a service in the background
start_service() {
    local service_name=$1
    local service_cmd=$2
    
    echo "Starting $service_name..."
    $service_cmd &
    echo "$service_name started with PID $!"
}

# Start API server
start_service "API Server" "npm run start:api"

# Wait for API to be ready
echo "⏳ Waiting for API server to start..."
sleep 5

# Start web app
start_service "Web Application" "npm run start:web"

echo "
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ✅ AlphaTerminal Bloomberg Dashboard Deployed!              ║
║                                                               ║
║   🌐 Web App: http://localhost:3000                          ║
║   🔌 API Server: http://localhost:3001                       ║
║   📊 WebSocket: ws://localhost:3001                          ║
║                                                               ║
║   Press Ctrl+C to stop all services                          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
"

# Keep script running
wait