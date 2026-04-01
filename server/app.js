import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client')));

// Create HTTP server
const server = http.createServer(app);

// WebSocket server
const wss = new WebSocketServer({ server });

// Store active connections and jobs
export const activeConnections = new Map();
export const activeJobs = new Map();

wss.on('connection', (ws) => {
  const clientId = Math.random().toString(36).slice(2, 11);
  activeConnections.set(clientId, ws);

  console.log(`📡 Cliente conectado: ${clientId} (Total: ${activeConnections.size})`);

  ws.on('close', () => {
    activeConnections.delete(clientId);
    console.log(`📡 Cliente desconectado: ${clientId} (Total: ${activeConnections.size})`);
  });

  ws.on('error', (err) => {
    console.error(`⚠️  Error WebSocket:`, err.message);
  });
});

// Broadcast to all connected clients
export function broadcast(data) {
  const message = JSON.stringify(data);
  activeConnections.forEach((ws) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(message);
    }
  });
}

// Import routes
import generateRoute from './routes/generate.js';
import adjustRoute from './routes/adjust.js';
import approveRoute from './routes/approve.js';

// Mount routes
app.use('/api/generate', generateRoute);
app.use('/api/adjust', adjustRoute);
app.use('/api/approve', approveRoute);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    agent: 'GrowBy Web Redesign Agent',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    activeJobs: activeJobs.size,
    activeConnections: activeConnections.size
  });
});

// Start server
server.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║   🚀 GrowBy Redesign Agent                       ║');
  console.log('║   Server Running                                 ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  console.log(`🌐 URL:         http://localhost:${PORT}`);
  console.log(`📡 WebSocket:   ws://localhost:${PORT}`);
  console.log(`🔗 Subdominio:  agent-redesign.growby.tech`);
  console.log(`\n✅ Listo para recibir rediseños\n`);
});

export default app;
