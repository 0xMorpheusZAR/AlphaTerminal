# AlphaTerminal Bloomberg Pro - Startup Guide

## Quick Start

### Windows
```bash
# Option 1: Using batch file
cd alpha-terminal
run-bloomberg.bat

# Option 2: Direct command
cd alpha-terminal
set COINGECKO_PRO_API_KEY=CG-MVg68aVqeVyu8fzagC9E1hPj
set PORT=3337
node bloomberg-pro-server.js
```

### Access the Dashboard
Open your browser and navigate to:
- **http://localhost:3337/bloomberg**
- Or directly: **http://localhost:3337/bloomberg-pro.html**

## Features

### 1. Live Price Ticker
- Real-time price updates every 30 seconds
- 24h price changes with color coding
- Sparkline charts showing 7-day trends
- Customizable asset selection

### 2. Market Overview Cards
- **Total Market Cap**: Live global cryptocurrency market capitalization
- **24h Volume**: Total trading volume across all exchanges
- **BTC Dominance**: Bitcoin's market share percentage
- **ETH Dominance**: Ethereum's market share percentage
- **Fear & Greed Index**: Market sentiment indicator (0-100)

### 3. Top Movers
- **Top Gainers**: 10 best performing coins in last 24h
- **Top Losers**: 10 worst performing coins in last 24h
- Sortable by market cap, volume, or price change
- Click any coin for detailed view

### 4. Trending Section
- Coins trending on CoinGecko
- Real-time search volume data
- Community engagement metrics

### 5. Market Heatmap
- Visual representation of market performance
- Size = Market Cap
- Color = 24h Price Change (Green = Gains, Red = Losses)
- Interactive hover for details
- Categories: Layer 1, DeFi, Exchange, Meme, Stablecoin

## API Configuration

### CoinGecko Pro API Key
Current key: `CG-MVg68aVqeVyu8fzagC9E1hPj`

To change the API key:
1. Edit `.env` file
2. Add: `COINGECKO_PRO_API_KEY=your_new_key`
3. Restart the server

### Rate Limits
- 500 calls/minute
- 50,000 calls/month
- Automatic caching to minimize API usage

## Troubleshooting

### Server Won't Start
```bash
# Kill all node processes
taskkill /F /IM node.exe
# or
powershell -Command "Stop-Process -Name node -Force"
```

### Port Already in Use
```bash
# Check what's using port 3337
netstat -ano | findstr :3337
# Kill the process using that PID
taskkill /F /PID [process_id]
```

### Bloomberg Route Not Working
The server should redirect `/bloomberg` to `/bloomberg-pro.html`
If not working, access directly: `http://localhost:3337/bloomberg-pro.html`

### No Data Loading
1. Check console for API errors
2. Verify API key is valid
3. Check network connection
4. Look for rate limit errors

## Performance Tips

1. **Browser**: Use Chrome or Edge for best performance
2. **Resolution**: Optimized for 1920x1080 or higher
3. **Memory**: Close unnecessary browser tabs
4. **Updates**: Data refreshes every 30 seconds automatically

## Keyboard Shortcuts

- `Space`: Pause/Resume ticker
- `F`: Toggle fullscreen mode
- `R`: Refresh all data
- `Esc`: Exit fullscreen

## Customization

### Change Update Frequency
Edit `bloomberg-pro-server.js` line 224:
```javascript
}, 30000); // Change 30000 to desired milliseconds
```

### Add More Coins to Ticker
Edit `bloomberg-pro-server.js` line 91:
```javascript
const symbols = req.query.symbols || 'bitcoin,ethereum,binancecoin,ripple,cardano,solana,polkadot,dogecoin,avalanche-2,matic-network';
```

### Modify Color Scheme
Edit `bloomberg-pro.html` CSS variables:
```css
:root {
    --bloomberg-green: #00ff41;
    --bloomberg-red: #ff073a;
    --bloomberg-amber: #ffb000;
}
```

## Development

### File Structure
```
alpha-terminal/
├── bloomberg-pro-server.js    # Enhanced API server
├── public/
│   └── bloomberg-pro.html     # Bloomberg terminal UI
├── run-bloomberg.bat          # Windows startup script
└── COINGECKO_API_REFERENCE.md # API documentation
```

### Adding New Features
1. Update API endpoints in `bloomberg-pro-server.js`
2. Add UI components in `bloomberg-pro.html`
3. Test with live data
4. Update documentation

## Deployment

### Requirements
- Node.js 14+
- npm or yarn
- CoinGecko Pro API key

### Production Setup
1. Set environment variables
2. Use PM2 for process management
3. Configure reverse proxy (nginx)
4. Enable HTTPS
5. Set up monitoring

## Support

For issues or questions:
1. Check server logs
2. Verify API connectivity
3. Review browser console
4. Check this documentation

---

**AlphaTerminal Bloomberg Pro** - Professional cryptocurrency analytics at your fingertips.