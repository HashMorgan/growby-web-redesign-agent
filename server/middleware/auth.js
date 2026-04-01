import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', '..', 'db', 'agent.db');

function getDb() {
  return new Database(DB_PATH);
}

// ── requireAuth ───────────────────────────────────────────────────────────────
export function requireAuth(req, res, next) {
  if (req.session?.userId) return next();
  // API requests → 401 JSON; page requests → redirect
  if (req.path.startsWith('/api/') || req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(401).json({ error: 'No autenticado', redirect: '/login' });
  }
  return res.redirect('/login');
}

// ── requireNoAuth ─────────────────────────────────────────────────────────────
export function requireNoAuth(req, res, next) {
  if (req.session?.userId) return res.redirect('/');
  next();
}

// ── Rate limiter for login endpoint (5 attempts / 15 min per IP) ──────────────
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de login. Espera 15 minutos.' },
  // Default keyGenerator uses req.ip with proper IPv6 handling
});

// ── loginHandler ──────────────────────────────────────────────────────────────
export async function loginHandler(req, res) {
  const { username, password } = req.body || {};

  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }

  // Clamp input length to prevent DoS via bcrypt on huge strings
  if (username.length > 64 || password.length > 128) {
    await new Promise(r => setTimeout(r, 1000));
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  let user;
  try {
    const db = getDb();
    // Use parameterized query → SQL injection safe
    user = db.prepare('SELECT id, username, password_hash FROM users WHERE username = ?').get(username);
    db.close();
  } catch (err) {
    console.error('DB error during login:', err.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }

  // Always run bcrypt compare to prevent timing attacks (even if user not found)
  const dummyHash = '$2a$12$invalidhashpaddingtomakethisconstanttimexxx';
  const hashToCheck = user?.password_hash || dummyHash;
  const valid = await bcrypt.compare(password, hashToCheck);

  if (!user || !valid) {
    // Extra 1-second delay to further blunt brute force
    await new Promise(r => setTimeout(r, 1000));
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  // Regenerate session to prevent session fixation
  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: 'Error al iniciar sesión' });

    req.session.userId = user.id;
    req.session.username = user.username;

    // Update last_login
    try {
      const db = getDb();
      db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
      db.close();
    } catch (_) { /* non-fatal */ }

    return res.json({ success: true, username: user.username });
  });
}

// ── logoutHandler ─────────────────────────────────────────────────────────────
export function logoutHandler(req, res) {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Error al cerrar sesión' });
    res.clearCookie('growby.sid');
    return res.json({ success: true });
  });
}
