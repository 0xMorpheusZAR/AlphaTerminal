const fetch = require('node-fetch');

async function checkDashboard() {
    console.log('🔍 Checking AlphaTerminal Dashboard Status...\n');
    
    try {
        // Check health endpoint
        const healthResponse = await fetch('http://localhost:3000/api/health');
        const health = await healthResponse.json();
        console.log('✅ Server Health:', health);
        
        console.log('\n📊 Available Dashboards:');
        console.log('- Original Dashboard: http://localhost:3000');
        console.log('- Bloomberg Terminal: http://localhost:3000/dashboard');
        console.log('- API Documentation: http://localhost:3000/api-docs');
        
        console.log('\n🤖 Persona Integration Status:');
        console.log('- Architect: System design and architecture');
        console.log('- Frontend: Bloomberg-style UI components');
        console.log('- Backend: CoinGecko MCP integration');
        console.log('- Analyzer: Market data analysis');
        console.log('- Performance: Real-time optimization');
        
        console.log('\n📡 CoinGecko MCP Endpoints:');
        console.log('- POST /api/coingecko/market - Get market data');
        console.log('- GET /api/coingecko/trending - Get trending coins');
        console.log('- GET /api/coingecko/global - Get global stats');
        console.log('- GET /api/dashboard/live-ticker - Get live ticker data');
        
        console.log('\n🚀 WebSocket Features:');
        console.log('- Real-time price updates');
        console.log('- Live persona status');
        console.log('- Market alerts');
        console.log('- Dashboard synchronization');
        
    } catch (error) {
        console.error('❌ Error checking dashboard:', error.message);
        console.log('\n💡 Make sure the server is running with:');
        console.log('   npm start');
    }
}

checkDashboard();