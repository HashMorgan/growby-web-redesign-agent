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

// ── Root — Dashboard (protected) ─────────────────────────────────────────────
app.get('/', requireAuth, (req, res) =>
  res.sendFile('dashboard.html', { root: path.join(__dirname, 'client') }),
);

// ── Web Redesign Agent — protected SPA ───────────────────────────────────────
app.get('/web-redesign', requireAuth, (req, res) =>
  res.sendFile('agents/web-redesign/index.html', { root: path.join(__dirname, 'client') }),
);

// ── HTTP server + WebSocket ───────────────────────────────────────────────────
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

import { activeConnections, broadcast, activeJobs } from './lib/broadcast.js';
export { broadcast, activeJobs };

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

// ── Protected API routes — Web Redesign Agent ────────────────────────────────
import generateRoute from './routes/generate.js';
import adjustRoute   from './routes/adjust.js';
import approveRoute  from './routes/approve.js';

app.use('/web-redesign/api/generate', requireAuth, generateRoute);
app.use('/web-redesign/api/adjust',   requireAuth, adjustRoute);
app.use('/web-redesign/api/approve',  requireAuth, approveRoute);

// ── Health check (public — infra monitoring) ─────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({
    status: 'ok',
    version: '0.5.0',
    platform: 'GrowBy Agents',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    activeJobs: activeJobs.size,
    activeConnections: activeConnections.size,
  }),
);

// ── Preview route — serves generated redesigns (auth-protected) ──────────────
app.use('/preview', requireAuth, express.static(path.join(__dirname, '../outputs')));

// ── Static assets (css, js, images) — after auth routes ──────────────────────
app.use(express.static(path.join(__dirname, 'client')));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'No encontrado' }));

// ── Start ─────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║   🚀 GrowBy Agents Platform — v0.5.0             ║');
  console.log('║   Auth + Security hardening active               ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  console.log(`🌐 Dashboard:   http://localhost:${PORT}/`);
  console.log(`🎨 Redesign:    http://localhost:${PORT}/web-redesign`);
  console.log(`🔒 Auth:        bcrypt + sessions + helmet + rate-limit`);
  console.log(`📡 WebSocket:   ws://localhost:${PORT}`);
  console.log(`🔗 Dominio:     agents.growby.digital\n`);
});

export default app;
