const http = require('http');
const url = require('url');

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (path === '/health' || path === '/api/app1/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'app1-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }));
    return;
  }

  // Users API endpoint
  if (path === '/api/app1/users') {
    const users = [
      { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user' },
      { id: 3, name: 'Bob Wilson', email: 'bob@example.com', role: 'moderator' }
    ];
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: users,
      total: users.length
    }));
    return;
  }

  // Status endpoint
  if (path === '/api/app1/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      application: 'User Management System',
      version: '1.0.0',
      status: 'running',
      features: [
        'User Registration & Authentication',
        'Profile Management',
        'Role-based Access Control',
        'API Integration'
      ],
      endpoints: [
        'GET /api/app1/health',
        'GET /api/app1/status',
        'GET /api/app1/users'
      ]
    }));
    return;
  }

  // Root endpoint
  if (path === '/' || path === '/api/app1') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'App1 Backend API is running',
      service: 'User Management System',
      version: '1.0.0',
      endpoints: {
        health: '/api/app1/health',
        status: '/api/app1/status',
        users: '/api/app1/users'
      }
    }));
    return;
  }

  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    available_endpoints: ['/api/app1/health', '/api/app1/status', '/api/app1/users']
  }));
});

server.listen(port, () => {
  console.log(`App1 Backend server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/api/app1/health`);
  console.log(`Status: http://localhost:${port}/api/app1/status`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
