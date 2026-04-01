#!/usr/bin/env node
/**
 * change-password.js
 * CLI interactivo para cambiar la contraseña del usuario growby
 */

import readline from 'readline';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');
const DB_PATH = path.join(PROJECT_ROOT, 'db', 'agent.db');
const SESSIONS_DB_PATH = path.join(PROJECT_ROOT, 'db', 'sessions.db');

// Colors
const color = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(msg, colorCode = '') {
  console.log(colorCode + msg + color.reset);
}

function ask(rl, question, hidden = false) {
  return new Promise((resolve) => {
    if (hidden) {
      // Hide input for password
      const stdin = process.stdin;
      const onData = (char) => {
        char = char.toString();
        if (char === '\n' || char === '\r' || char === '\u0004') {
          stdin.pause();
          process.stdout.write('\n');
          stdin.removeListener('data', onData);
          resolve(input);
        } else if (char === '\u0003') {
          process.exit();
        } else if (char === '\u007f') {
          // Backspace
          input = input.slice(0, -1);
          process.stdout.clearLine();
          process.stdout.cursorTo(0);
          process.stdout.write(question);
        } else {
          input += char;
        }
      };

      let input = '';
      process.stdout.write(question);
      stdin.resume();
      stdin.setRawMode(true);
      stdin.setEncoding('utf8');
      stdin.on('data', onData);
    } else {
      rl.question(question, resolve);
    }
  });
}

async function main() {
  // Check if DB exists
  if (!fs.existsSync(DB_PATH)) {
    log('\n❌ Base de datos no encontrada en db/agent.db', color.red);
    log('   Ejecuta primero: node scripts/setup-auth.js\n', color.yellow);
    process.exit(1);
  }

  log('\n╔══════════════════════════════════════════════════╗', color.cyan);
  log('║   Cambiar Contraseña — GrowBy Redesign Agent    ║', color.cyan);
  log('╚══════════════════════════════════════════════════╝\n', color.cyan);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    // Step 1: Ask for current password
    const currentPassword = await ask(rl, '  Contraseña actual: ', true);

    // Connect to DB
    const db = new Database(DB_PATH);

    // Get user from DB
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get('growby');

    if (!user) {
      log('\n❌ Usuario no encontrado en la base de datos.', color.red);
      db.close();
      rl.close();
      process.exit(1);
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      log('\n❌ Contraseña incorrecta. Abortando.\n', color.red);
      db.close();
      rl.close();
      process.exit(1);
    }

    log('  ✅ Contraseña actual correcta\n', color.green);

    // Step 2: Ask for new password
    let newPassword;
    while (true) {
      newPassword = await ask(rl, '  Nueva contraseña (mín. 8 caracteres): ', true);
      if (newPassword.length >= 8) break;
      log('  ⚠️  La contraseña debe tener al menos 8 caracteres\n', color.yellow);
    }

    // Step 3: Confirm new password
    const confirmPassword = await ask(rl, '  Confirmar nueva contraseña: ', true);

    if (newPassword !== confirmPassword) {
      log('\n❌ Las contraseñas no coinciden.\n', color.red);
      db.close();
      rl.close();
      process.exit(1);
    }

    // Step 4: Hash new password
    log('\n  🔐 Encriptando nueva contraseña...', color.cyan);
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Step 5: Update in DB
    db.prepare('UPDATE users SET password = ? WHERE username = ?').run(
      hashedPassword,
      'growby'
    );

    // Step 6: Invalidate all active sessions
    log('  🔄 Invalidando sesiones activas...', color.cyan);

    if (fs.existsSync(SESSIONS_DB_PATH)) {
      const sessionsDb = new Database(SESSIONS_DB_PATH);
      const result = sessionsDb.prepare('DELETE FROM sessions').run();
      sessionsDb.close();
      log(`  ✅ ${result.changes} sesión(es) cerrada(s)`, color.green);
    }

    db.close();

    log('\n╔══════════════════════════════════════════════════╗', color.green);
    log('║   ✅ Contraseña actualizada correctamente       ║', color.green);
    log('║   Todas las sesiones activas han sido cerradas  ║', color.green);
    log('╚══════════════════════════════════════════════════╝\n', color.green);

    rl.close();
    process.exit(0);
  } catch (error) {
    log(`\n❌ Error: ${error.message}\n`, color.red);
    rl.close();
    process.exit(1);
  }
}

main();
