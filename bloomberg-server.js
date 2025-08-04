const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001; // Different port to avoid conflict

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve the Bloomberg dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'bloomberg-terminal-enhanced.html'));
});

// Also serve original dashboard
app.get('/original', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'bloomberg-dashboard.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`
✨ Bloomberg Dashboard Server
🌐 Dashboard: http://localhost:${PORT}

The Bloomberg-style dashboard is now accessible!
  `);
});