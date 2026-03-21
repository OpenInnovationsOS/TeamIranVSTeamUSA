const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.url === '/' || req.url === '/mini-app') {
    // Serve the mini app HTML file
    const filePath = path.join(__dirname, '../frontend/mini-app.html');
    
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - Mini App Not Found</h1>');
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else if (req.url === '/api/mini-app/status') {
    // API endpoint for mini app status
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'Mini app is running',
      features: {
        weapons: true,
        battles: true,
        collectibles: true,
        achievements: true,
        shop: true,
        profile: true
      }
    }));
  } else {
    // 404 for other routes
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('<h1>404 - Page Not Found</h1><p><a href="/">Go to Mini App</a></p>');
  }
});

server.listen(PORT, () => {
  console.log(`🎮 Mini App Server running on port ${PORT}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
  console.log(`📱 Mini App: http://localhost:${PORT}/mini-app`);
  console.log(`🎮 Team Iran vs USA - Mobile Experience`);
});

console.log('Starting mini app server...');
