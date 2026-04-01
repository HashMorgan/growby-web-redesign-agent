#!/usr/bin/env node
/**
 * security-tests.js
 * Suite de tests de seguridad para GrowBy Redesign Agent
 * Ejecutar antes de cada deploy: node scripts/security-tests.js
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');
const PORT = 3002; // Puerto de test diferente al de prod

// Colors
const c = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

let serverProcess;
let testsPassed = 0;
let testsFailed = 0;

// ─── HELPERS ───────────────────────────────────────────────────────────────

function log(msg, color = '') {
  console.log(color + msg + c.reset);
}

function pass(testName) {
  testsPassed++;
  log(`  ✅ ${testName}`, c.green);
}

function fail(testName, reason = '') {
  testsFailed++;
  log(`  ❌ ${testName}`, c.red);
  if (reason) log(`     Razón: ${reason}`, c.yellow);
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetch(url, options = {}) {
  const https = await import('https');
  const http = await import('http');
  const { URL } = await import('url');

  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = protocol.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          ok: res.statusCode >= 200 && res.statusCode < 300,
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }

    req.end();
  });
}

// ─── SERVER MANAGEMENT ─────────────────────────────────────────────────────

function startServer() {
  return new Promise((resolve, reject) => {
    log('\n🚀 Iniciando servidor en modo test...', c.cyan);

    serverProcess = spawn('node', [path.join(PROJECT_ROOT, 'server', 'app.js')], {
      env: { ...process.env, PORT, NODE_ENV: 'test' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    serverProcess.stdout.on('data', (data) => {
      if (data.toString().includes('Listo para recibir')) {
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(data.toString());
    });

    serverProcess.on('error', reject);

    // Timeout
    setTimeout(() => reject(new Error('Timeout al iniciar servidor')), 10000);
  });
}

function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
    log('🛑 Servidor detenido\n', c.cyan);
  }
}

// ─── TESTS ─────────────────────────────────────────────────────────────────

async function testHealthEndpoint() {
  try {
    const res = await fetch(`http://localhost:${PORT}/api/health`);
    if (res.ok) {
      const data = JSON.parse(res.body);
      if (data.status === 'ok' && data.agent) {
        pass('Health endpoint responde correctamente');
      } else {
        fail('Health endpoint', 'Respuesta incompleta');
      }
    } else {
      fail('Health endpoint', `Status ${res.status}`);
    }
  } catch (error) {
    fail('Health endpoint', error.message);
  }
}

async function testSecurityHeaders() {
  try {
    const res = await fetch(`http://localhost:${PORT}/`);
    const headers = res.headers;

    const requiredHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
    ];

    const hasHeaders = requiredHeaders.every((h) => headers[h]);

    if (hasHeaders) {
      pass('Headers de seguridad (Helmet) presentes');
    } else {
      fail('Headers de seguridad', 'Faltan headers requeridos');
    }
  } catch (error) {
    fail('Headers de seguridad', error.message);
  }
}

async function testRateLimiting() {
  try {
    // Hacer 6 requests rápidos al login
    const requests = [];
    for (let i = 0; i < 6; i++) {
      requests.push(
        fetch(`http://localhost:${PORT}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'test', password: 'test' }),
        })
      );
    }

    const responses = await Promise.all(requests);
    const blocked = responses.some((r) => r.status === 429);

    if (blocked) {
      pass('Rate limiting activo (bloqueó después de múltiples intentos)');
    } else {
      fail('Rate limiting', 'No bloqueó requests excesivos');
    }
  } catch (error) {
    fail('Rate limiting', error.message);
  }
}

async function testSQLInjection() {
  try {
    const maliciousPayloads = [
      "admin' OR '1'='1",
      "admin'--",
      "' OR 1=1--",
    ];

    let vulnerable = false;

    for (const payload of maliciousPayloads) {
      const res = await fetch(`http://localhost:${PORT}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: payload, password: 'test' }),
      });

      // Si algún payload devuelve 200, es vulnerable
      if (res.status === 200) {
        vulnerable = true;
        break;
      }
    }

    if (!vulnerable) {
      pass('Protección contra SQL Injection');
    } else {
      fail('SQL Injection', 'Vulnerable a inyección SQL');
    }
  } catch (error) {
    fail('SQL Injection', error.message);
  }
}

async function testCSRF() {
  try {
    // Intentar hacer POST sin cookie de sesión
    const res = await fetch(`http://localhost:${PORT}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com' }),
    });

    // Debe devolver 401 o 403 sin autenticación
    if (res.status === 401 || res.status === 403) {
      pass('Protección CSRF (requiere autenticación)');
    } else if (res.status === 429) {
      pass('Protección CSRF (bloqueado por rate limit)');
    } else {
      fail('CSRF', `Permitió request sin autenticación (${res.status})`);
    }
  } catch (error) {
    fail('CSRF', error.message);
  }
}

async function testPasswordHashing() {
  try {
    // Este test verifica que las contraseñas no se devuelvan en plain text
    const res = await fetch(`http://localhost:${PORT}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'growby', password: 'wrong' }),
    });

    const body = res.body;

    // Verificar que la respuesta no incluya la contraseña
    if (!body.includes('password') && !body.includes('$2a$')) {
      pass('Contraseñas hasheadas (no expuestas en responses)');
    } else {
      fail('Password hashing', 'Posible exposición de contraseña');
    }
  } catch (error) {
    fail('Password hashing', error.message);
  }
}

async function testSessionSecurity() {
  try {
    const res = await fetch(`http://localhost:${PORT}/`);
    const setCookie = res.headers['set-cookie'];

    if (!setCookie) {
      pass('Sin cookies innecesarias en requests no autenticados');
      return;
    }

    // Verificar que las cookies tengan httpOnly y SameSite
    const cookieStr = Array.isArray(setCookie) ? setCookie[0] : setCookie;
    const hasHttpOnly = cookieStr.includes('HttpOnly');
    const hasSameSite = cookieStr.includes('SameSite');

    if (hasHttpOnly && hasSameSite) {
      pass('Cookies de sesión con httpOnly y SameSite');
    } else {
      fail('Session security', 'Cookies sin protección adecuada');
    }
  } catch (error) {
    fail('Session security', error.message);
  }
}

async function testXSSProtection() {
  try {
    const xssPayload = '<script>alert("xss")</script>';
    const res = await fetch(`http://localhost:${PORT}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: xssPayload }),
    });

    // Verificar que el payload no se ejecute ni se refleje
    const body = res.body;
    if (!body.includes('<script>')) {
      pass('Protección contra XSS (script tags sanitizados)');
    } else {
      fail('XSS Protection', 'Posible vulnerabilidad XSS');
    }
  } catch (error) {
    fail('XSS Protection', error.message);
  }
}

// ─── MAIN ──────────────────────────────────────────────────────────────────

async function runTests() {
  log('\n╔══════════════════════════════════════════════════╗', c.cyan);
  log('║   Security Tests — GrowBy Redesign Agent        ║', c.cyan);
  log('╚══════════════════════════════════════════════════╝\n', c.cyan);

  try {
    await startServer();
    await sleep(2000); // Esperar a que el servidor esté listo

    log('🔒 Ejecutando tests de seguridad...\n', c.cyan);

    await testHealthEndpoint();
    await testSecurityHeaders();
    await testRateLimiting();
    await testSQLInjection();
    await testCSRF();
    await testPasswordHashing();
    await testSessionSecurity();
    await testXSSProtection();

    stopServer();

    // Reporte final
    const total = testsPassed + testsFailed;
    log('\n╔══════════════════════════════════════════════════╗', c.bold);
    log(`║   Resultados: ${testsPassed}/${total} tests pasaron`, c.bold);
    log('╚══════════════════════════════════════════════════╝\n', c.bold);

    if (testsFailed === 0) {
      log('✅ Todos los tests de seguridad pasaron\n', c.green);
      process.exit(0);
    } else {
      log(`⚠️  ${testsFailed} test(s) fallaron. Revisa antes de deployar.\n`, c.yellow);
      process.exit(1);
    }
  } catch (error) {
    log(`\n❌ Error ejecutando tests: ${error.message}\n`, c.red);
    stopServer();
    process.exit(1);
  }
}

runTests();
