import 'dotenv/config';
import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import connectSqlite3 from 'connect-sqlite3';
import crypto from 'crypto';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

import {
  requireAuth,
  requireNoAuth,
  loginRateLimiter,
  loginHandler,
  logoutHandler,
} from './middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const SQLiteStore = connectSqlite3(session);

// ── Trust proxy (Nginx in Docker sits in front) ───────────────────────────────
app.set('trust proxy', 1);

// ── Helmet — security headers ────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "'unsafe-inline'", "cdn.tailwindcss.com", "unpkg.com"],
      styleSrc:    ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc:     ["'self'", "fonts.gstatic.com"],
      imgSrc:      ["'self'", "data:", "*.netlify.app", "*"],
      connectSrc:  ["'self'", "ws:", "wss:"],
      frameSrc:    ["'self'", "*.netlify.app"],
    },
  },
  crossOriginEmbedderPolicy: false, // needed for iframe previews
}));

// ── Global API rate limiter ───────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta en 15 minutos.' },
});
app.use('/api/', globalLimiter);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(cors({ origin: false }));

// ── Express session with SQLite store ────────────────────────────────────────
app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: './db' }),
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
  },
  name: 'growby.sid',
}));

// ── Auth routes (public) ─────────────────────────────────────────────────────
app.post('/api/auth/login', loginRateLimiter, loginHandler);
app.post('/api/auth/logout', requireAuth, logoutHandler);
app.get('/api/auth/me', requireAuth, (req, res) =>
  res.json({ username: req.session.username }),
);

// ── Login page (public, redirect if already logged in) ───────────────────────
app.get('/login', requireNoAuth, (req, res) =>
  res.sendFile('login.html', { root: path.join(__dirname, 'client') }),
);

// ── Root — protected SPA ──────────────────────────────────────────────────────
app.get('/', requireAuth, (req, res) =>
  res.sendFile('index.html', { root: path.join(__dirname, 'client') }),
);

// ── HTTP server + WebSocket ───────────────────────────────────────────────────
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

export const activeConnections = new Map();
export const activeJobs = new Map();

wss.on('connection', (ws) => {
  const clientId = crypto.randomBytes(5).toString('hex');
  activeConnections.set(clientId, ws);
  console.log(`📡 WS conectado: ${clientId} (total: ${activeConnections.size})`);

  ws.on('close', () => {
    activeConnections.delete(clientId);
    console.log(`📡 WS desconectado: ${clientId} (total: ${activeConnections.size})`);
  });

  ws.on('error', (err) => console.error('⚠️  WS error:', err.message));
});

export function broadcast(data) {
  const message = JSON.stringify(data);
  activeConnections.forEach((ws) => {
    if (ws.readyState === ws.OPEN) ws.send(message);
  });
}

// ── Protected API routes ─────────────────────────────────────────────────────
import generateRoute from './routes/generate.js';
import adjustRoute   from './routes/adjust.js';
import approveRoute  from './routes/approve.js';

app.use('/api/generate', requireAuth, generateRoute);
app.use('/api/adjust',   requireAuth, adjustRoute);
app.use('/api/approve',  requireAuth, approveRoute);

// ── Health check (public — infra monitoring) ─────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({
    status: 'ok',
    version: '1.0.0',
    agent: 'GrowBy Web Redesign Agent',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    activeJobs: activeJobs.size,
    activeConnections: activeConnections.size,
  }),
);

// ── Static assets (css, js, images) — after auth routes ──────────────────────
app.use(express.static(path.join(__dirname, 'client')));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'No encontrado' }));

// ── Start ─────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║   🚀 GrowBy Redesign Agent — v1.0.0              ║');
  console.log('║   Auth + Security hardening active               ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  console.log(`🌐 URL:         http://localhost:${PORT}`);
  console.log(`🔒 Auth:        bcrypt + sessions + helmet + rate-limit`);
  console.log(`📡 WebSocket:   ws://localhost:${PORT}`);
  console.log(`🔗 Subdominio:  agent-redesign.growby.tech\n`);
});

export default app;
