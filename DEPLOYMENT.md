# AlphaTerminal Deployment Guide

This guide covers deployment options for AlphaTerminal on various platforms.

## 🚀 Deployment Platforms

### 1. Replit (Recommended for Quick Start)

[![Run on Replit](https://replit.com/badge/github/0xMorpheusZAR/AlphaTerminal)](https://replit.com/new/github/0xMorpheusZAR/AlphaTerminal)

#### Automatic Deployment
1. Click the "Run on Replit" button above
2. Replit will automatically import the repository
3. Add your API keys in the Secrets tab:
   - `COINGECKO_PRO_API_KEY`: Your CoinGecko Pro API key
   - `VELO_API_KEY`: Your Velo API key (optional)
4. Click "Run" to start the application

#### Manual Deployment
1. Go to [Replit](https://replit.com)
2. Click "+ Create Repl"
3. Choose "Import from GitHub"
4. Enter: `https://github.com/0xMorpheusZAR/AlphaTerminal`
5. Configure secrets and run

### 2. Heroku

#### Prerequisites
- Heroku CLI installed
- Heroku account

#### Steps
```bash
# Clone the repository
git clone https://github.com/0xMorpheusZAR/AlphaTerminal.git
cd AlphaTerminal

# Create Heroku app
heroku create your-alphaterminal-app

# Set environment variables
heroku config:set COINGECKO_PRO_API_KEY=your_api_key
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# Open the app
heroku open
```

### 3. Railway

#### One-Click Deploy
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/alphaterminal)

#### Manual Deploy
1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Initialize: `railway init`
4. Add environment variables in Railway dashboard
5. Deploy: `railway up`

### 4. Vercel

#### Deploy with Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add COINGECKO_PRO_API_KEY
```

### 5. DigitalOcean App Platform

1. Fork the repository to your GitHub
2. Go to DigitalOcean App Platform
3. Create new app from GitHub
4. Select the forked repository
5. Configure environment variables
6. Deploy

### 6. Google Cloud Run

```bash
# Build container
docker build -t gcr.io/YOUR_PROJECT_ID/alphaterminal .

# Push to Container Registry
docker push gcr.io/YOUR_PROJECT_ID/alphaterminal

# Deploy to Cloud Run
gcloud run deploy alphaterminal \
  --image gcr.io/YOUR_PROJECT_ID/alphaterminal \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### 7. AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p node.js alphaterminal

# Create environment
eb create alphaterminal-env

# Set environment variables
eb setenv COINGECKO_PRO_API_KEY=your_api_key

# Deploy
eb deploy
```

## 🔧 Configuration

### Environment Variables

All platforms require these environment variables:

```env
# Required
COINGECKO_PRO_API_KEY=your_coingecko_pro_api_key

# Optional
VELO_API_KEY=your_velo_api_key
PORT=3337
NODE_ENV=production
REDIS_URL=redis://your-redis-url
DATABASE_URL=postgresql://your-database-url
```

### Port Configuration

Most platforms automatically assign ports. The application uses:
```javascript
const PORT = process.env.PORT || 3337;
```

### Health Checks

The application provides health check endpoints:
- `/api/health` - Basic health check
- `/api/metrics` - Performance metrics

Configure your platform to use these endpoints.

## 📊 Performance Considerations

### Memory Requirements
- Minimum: 512MB RAM
- Recommended: 1GB RAM
- For high traffic: 2GB+ RAM

### CPU Requirements
- Minimum: 0.5 vCPU
- Recommended: 1 vCPU
- For high traffic: 2+ vCPU

### Scaling
- Horizontal scaling supported
- WebSocket sticky sessions required
- Redis recommended for multi-instance deployments

## 🔒 Security

### SSL/TLS
- Always use HTTPS in production
- Most platforms provide automatic SSL
- Configure WebSocket to use WSS

### API Keys
- Never commit API keys to repository
- Use platform-specific secret management
- Rotate keys regularly

### CORS Configuration
Update `ALLOWED_ORIGINS` in your environment:
```env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## 🐛 Troubleshooting

### Common Deployment Issues

#### Build Failures
```bash
# Error: TypeScript compilation failed
# Solution: Ensure all TypeScript errors are fixed
npm run build

# Test locally before deploying
npm start
```

#### Memory Errors
```bash
# Error: JavaScript heap out of memory
# Solution: Increase memory limit
NODE_OPTIONS="--max-old-space-size=1024" npm start
```

#### WebSocket Issues
```bash
# Error: WebSocket connection failed
# Solution: Ensure WebSocket support is enabled
# Some platforms require specific configuration
```

### Platform-Specific Issues

#### Replit
- Use Secrets instead of .env
- May have WebSocket limitations on free tier
- Monitor memory usage

#### Heroku
- Requires `Procfile` for custom start command
- WebSocket requires sticky sessions
- Free tier has sleep mode

#### Vercel
- Primarily for static sites
- Use Vercel Functions for API
- WebSocket not fully supported

## 📈 Monitoring

### Recommended Monitoring Tools
1. **Uptime Monitoring**: UptimeRobot, Pingdom
2. **Error Tracking**: Sentry, Rollbar
3. **Performance**: New Relic, DataDog
4. **Logs**: LogDNA, Papertrail

### Key Metrics to Monitor
- API response times
- WebSocket connection count
- Memory usage
- CPU utilization
- Error rates
- Cache hit rates

## 🆘 Support

### Getting Help
1. Check the [troubleshooting section](#troubleshooting)
2. Review [GitHub Issues](https://github.com/0xMorpheusZAR/AlphaTerminal/issues)
3. Join our Discord community (coming soon)
4. Contact support@alphaterminal.com

### Reporting Issues
When reporting deployment issues, include:
- Deployment platform
- Error messages
- Environment configuration (without secrets)
- Steps to reproduce

---

## Quick Start Commands

```bash
# Clone repository
git clone https://github.com/0xMorpheusZAR/AlphaTerminal.git
cd AlphaTerminal

# Install dependencies
npm install

# Build application
npm run build

# Start locally
npm start

# Access dashboard
open http://localhost:3337
```

For platform-specific deployment, refer to the sections above.

---

**Need help?** Open an issue on [GitHub](https://github.com/0xMorpheusZAR/AlphaTerminal/issues) or contact us.