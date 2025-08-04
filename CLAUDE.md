# SuperClaude Integration for AlphaTerminal

This project integrates SuperClaude v3 framework to enhance development workflows.

## Available Commands

### Development Commands
- `/sc:implement` - Implement new features
- `/sc:build` - Build and compile the project
- `/sc:design` - Design system architecture

### Analysis Commands
- `/sc:analyze` - Analyze code structure and patterns
- `/sc:troubleshoot` - Debug and fix issues
- `/sc:explain` - Explain complex code sections

### Quality Commands
- `/sc:improve` - Refactor and optimize code
- `/sc:test` - Create and run tests
- `/sc:cleanup` - Clean up code and remove technical debt

### Other Commands
- `/sc:document` - Generate documentation
- `/sc:git` - Git operations and workflows
- `/sc:estimate` - Estimate task complexity
- `/sc:task` - Task management
- `/sc:index` - Index project structure
- `/sc:load` - Load context from files
- `/sc:spawn` - Create new components

## Project-Specific Context

### AlphaTerminal Overview
AlphaTerminal is a comprehensive cryptocurrency analytics platform featuring:
- Real-time market data tracking
- Token failure analysis (90%+ decline)
- DeFi protocol revenue analytics
- Monte Carlo price simulations
- Advanced analytics with CoinGecko Pro integration

### Key Technologies
- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, PostgreSQL/Mock Storage
- **APIs**: CoinGecko Pro, Velo, DefiLlama, Dune Analytics
- **MCP**: CoinGecko MCP server integration

### Development Guidelines
1. Always run tests before committing: `npm run check`
2. Use mock data mode for development (no DB required)
3. Follow TypeScript best practices
4. Maintain component consistency with existing patterns
5. Update documentation when adding features

### API Endpoints
- `/api/analytics/*` - Advanced analytics endpoints
- `/api/tokens/*` - Token management
- `/api/news` - Real-time news feed
- `/api/monte-carlo/*` - Price simulations
- `/api/dashboard/*` - Dashboard statistics

### Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Install dependencies
npm install

# Start development server (Windows)
set NODE_ENV=development && npx tsx server/index.ts

# Start development server (Linux/Mac)
npm run dev
```

## Quick Start Commands

### Common Development Tasks
```bash
# Implement new feature
/sc:implement add user authentication

# Analyze current codebase
/sc:analyze server/services

# Generate tests
/sc:test server/services/advanced-analytics.ts

# Improve code quality
/sc:improve server/routes.ts

# Document API endpoints
/sc:document API endpoints
```

## MCP Servers Available
1. **CoinGecko MCP** - Cryptocurrency market data
2. **Context7** - Documentation retrieval
3. **Sequential** - Complex reasoning
4. **Magic** - UI component generation
5. **Playwright** - Browser automation

## Project Structure
```
AlphaTerminal/
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types/schemas
├── superclaude/     # SuperClaude framework
└── .mcp.json        # MCP configuration
```