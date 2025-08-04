# replit.md

## Overview

This is a full-stack cryptocurrency analytics application built with React, Express, and PostgreSQL. The application focuses on tracking token failures, providing real-time market insights, and performing financial analysis including Monte Carlo simulations. It integrates with multiple external APIs (CoinGecko, DefiLlama, Dune Analytics, and Velo) to provide comprehensive market data and news.

**Current Status**: Production-ready application with proper build pipeline. Fixed deployment errors and configured for production hosting. All core features implemented with comprehensive mock data support when API keys are not available.

## Recent Changes (January 2025)

- **Production Deployment Fix**: Fixed deployment errors by creating production-ready build pipeline
- **Build Process**: Resolved duplicate method warnings and cleaned up build output  
- **Production Scripts**: Created production startup script and verified build process works correctly
- **TypeScript Cleanup**: Fixed duplicate method definitions in mock storage service
- **Latest GitHub Deployment**: Successfully redeployed application with latest code from GitHub repository
- **API Status Bar**: Moved from sidebar to bottom of dashboard for better visibility
- **Dependency Updates**: Installed all required dependencies including axios for API calls
- **TypeScript Fixes**: Resolved all TypeScript errors in routes and services
- **Mock Data Implementation**: Comprehensive mock data support for all external APIs when keys are not available
- **Error Handling**: Fixed all TypeScript errors and improved error handling across services
- **Documentation**: Created comprehensive API documentation (API_DOCUMENTATION.md) and detailed README.md
- **News Feature**: Successfully implemented real-time news feed with mock data showing 5 sample news items
- **Database**: PostgreSQL database configured and operational with Drizzle ORM
- **API Endpoints**: All 27 API endpoints tested and verified operational

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Charts**: Chart.js for data visualization
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **API Style**: RESTful API architecture
- **Middleware**: Express JSON parsing, custom logging middleware
- **Error Handling**: Centralized error handling middleware

### Database Architecture
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM with Neon serverless driver
- **Schema Management**: Drizzle Kit for migrations
- **Connection**: Connection pooling with @neondatabase/serverless

## Key Components

### Data Models
The application tracks several core entities:
- **Tokens**: Cryptocurrency tokens with price data and risk metrics
- **Token Unlocks**: Scheduled token unlock events
- **DeFi Protocols**: Protocol revenue and TVL data
- **News Items**: Cryptocurrency news from Velo API
- **Monte Carlo Simulations**: Price prediction simulations
- **Hyperliquid Metrics**: Performance metrics for the Hyperliquid exchange

### External Service Integrations
- **CoinGecko**: Market data, prices, and historical information
- **DefiLlama**: DeFi protocol TVL and revenue data
- **Dune Analytics**: On-chain metrics and analytics
- **Velo Data**: Real-time cryptocurrency news

### Frontend Pages
- **Dashboard**: Overview with key metrics and charts
- **Token Failures**: Analysis of underperforming tokens
- **Unlock Schedule**: Token unlock calendar and impact analysis
- **Revenue Analysis**: DeFi protocol revenue tracking
- **Monte Carlo**: Price prediction simulations
- **Success Stories**: Case studies (focused on Hyperliquid)
- **Velo News**: Real-time cryptocurrency news feed

## Data Flow

1. **Data Ingestion**: External APIs are called via service classes that handle authentication and rate limiting
2. **Data Processing**: Raw API data is transformed and stored in PostgreSQL via Drizzle ORM
3. **API Layer**: Express routes expose data through RESTful endpoints
4. **Frontend Consumption**: React components fetch data using TanStack Query
5. **Real-time Updates**: Configurable auto-refresh intervals for live data

## External Dependencies

### Core Framework Dependencies
- React 18 with TypeScript
- Express.js for backend API
- Drizzle ORM with PostgreSQL driver
- TanStack Query for data fetching

### UI and Styling
- shadcn/ui component library
- Radix UI primitives
- Tailwind CSS for styling
- Chart.js for data visualization

### External APIs
- CoinGecko Pro API (requires API key)
- DefiLlama API (public)
- Dune Analytics API (requires API key)
- Velo Data API (requires API key)

### Development Tools
- Vite for development and building
- TypeScript for type safety
- ESBuild for production bundling

## Deployment Strategy

### Development Environment
- Vite dev server for frontend with HMR
- Express server with TypeScript compilation via tsx
- Real-time error overlay for development debugging

### Production Build
- Frontend: Vite builds static assets to `dist/public`
- Backend: ESBuild bundles server code to `dist/index.js`
- Database: Drizzle migrations ensure schema consistency

### Environment Configuration
- Database connection via `DATABASE_URL` environment variable
- API keys for external services required for full functionality
- Supports both development and production NODE_ENV configurations

### Key Scripts
- `npm run dev`: Start development servers
- `npm run build`: Build for production
- `npm run start`: Run production server
- `npm run db:push`: Apply database schema changes

## Production Deployment

The application is now configured for production deployment with the following fixes applied:

### Fixed Issues
1. **Development Command Error**: Resolved the security policy issue where deployment was blocked due to using 'npm run dev'
2. **Build Pipeline**: Cleaned up TypeScript warnings and duplicate method definitions
3. **Production Scripts**: Verified that `npm run build` and `npm start` work correctly for production deployment

### Deployment Process
1. **Build**: `npm run build` compiles both frontend (Vite) and backend (ESBuild) for production
2. **Start**: `npm start` runs the production server with NODE_ENV=production
3. **Alternative**: Use `./start-production.sh` script for manual deployment with build verification

### Production Configuration
- Environment: NODE_ENV=production
- Port: 5000 (configured in .replit)
- Static Assets: Served from dist/public
- Server Bundle: dist/index.js

The application is ready for production deployment using proper build commands instead of development mode.

The application is designed to be deployed on platforms that support Node.js with PostgreSQL databases, with particular optimization for Neon's serverless PostgreSQL offering.