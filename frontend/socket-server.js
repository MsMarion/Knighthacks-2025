const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ port: 3001 });

wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log('WebSocket server started on port 3001');

// Function to broadcast messages to all clients
wss.broadcast = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(data);
    }
  });
};

// We need a way for the /api/predict route to send data to this server.
// We can do this by creating another server (an HTTP server) on another port (e.g. 3002)
// that will receive the data and then broadcast it.

const http = require('http');

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const parsedBody = JSON.parse(body);
        if (parsedBody.type === 'clear') {
          wss.broadcast(JSON.stringify(parsedBody)); // Broadcast the clear message as JSON
        } else {
          wss.broadcast(body); // Broadcast other messages as is
        }
      } catch (e) {
        wss.broadcast(body); // If not JSON, broadcast as is (e.g., SSE chunks)
      }
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK');
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(3002, () => {
  console.log('HTTP server for WebSocket broadcasting started on port 3002');
});
