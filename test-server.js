const express = require('express');
const path = require('path');

const app = express();

// Serve static files
app.use(express.static('public'));

// Test route
app.get('/test', (req, res) => {
  res.send('Server is working!');
});

// Bloomberg route
app.get('/bloomberg', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'bloomberg-pro.html'));
});

const PORT = 3337;
app.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  console.log(`Bloomberg available at http://localhost:${PORT}/bloomberg`);
  console.log(`Direct file access at http://localhost:${PORT}/bloomberg-pro.html`);
});