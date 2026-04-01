import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');
const DB_DIR = path.join(PROJECT_ROOT, 'db');
const DB_PATH = path.join(DB_DIR, 'agent.db');

// Ensure db/ directory exists
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY,
    username      TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login    DATETIME
  );

  CREATE TABLE IF NOT EXISTS sessions (
    sid     TEXT PRIMARY KEY,
    sess    TEXT NOT NULL,
    expired DATETIME NOT NULL
  );
`);

// Check if user already exists
const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('growby');
if (existing) {
  console.log('⚠️  Usuario "growby" ya existe. Sin cambios.');
  console.log('   Para resetear el password, elimina db/agent.db y ejecuta de nuevo.');
  db.close();
  process.exit(0);
}

// Generate secure random password: 12 chars, letters + numbers
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
const rawPassword = Array.from(crypto.randomBytes(12))
  .map(b => CHARSET[b % CHARSET.length])
  .join('');

// Hash with bcrypt rounds 12
const passwordHash = bcrypt.hashSync(rawPassword, 12);

// Insert user
db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('growby', passwordHash);

db.close();

console.log('\n╔══════════════════════════════════════════════════╗');
console.log('║   ✅  Auth Setup — GrowBy Redesign Agent         ║');
console.log('╚══════════════════════════════════════════════════╝\n');
console.log(`✅ BD creada en db/agent.db`);
console.log(`👤 Usuario:  growby`);
console.log(`🔑 Password: ${rawPassword}`);
console.log('\n⚠️  Guarda este password — no se puede recuperar');
console.log('   Agrégalo al .env como AGENT_PASSWORD para referencia:\n');
console.log(`   AGENT_PASSWORD=${rawPassword}\n`);
