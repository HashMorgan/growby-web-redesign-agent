#!/usr/bin/env node
/**
 * feedback-cli.js
 * CLI interactivo para que Kevin dé feedback después de cada rediseño.
 * Uso: node scripts/feedback-cli.js <cliente-id>
 */

import readline from 'readline';
import { getEpisode, processFeedback } from './memory-manager.js';

// ─── HELPERS ───────────────────────────────────────────────────────────────

function color(code, text) {
  return `\x1b[${code}m${text}\x1b[0m`;
}

const bold  = t => color('1',  t);
const cyan  = t => color('36', t);
const green = t => color('32', t);
const yellow= t => color('33', t);
const red   = t => color('31', t);
const dim   = t => color('2',  t);

function ask(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

function printDivider() {
  console.log(dim('─'.repeat(56)));
}

// ─── MAIN ──────────────────────────────────────────────────────────────────

async function main() {
  const clienteId = process.argv[2];

  if (!clienteId) {
    console.error(red('\n❌  Uso: node scripts/feedback-cli.js <cliente-id>'));
    console.error(dim('   Ejemplo: node scripts/feedback-cli.js growby-tech\n'));
    process.exit(1);
  }

  // ── BANNER ─────────────────────────────────────────────────────────────
  console.log('\n' + bold('╔══════════════════════════════════════════════════════╗'));
  console.log(bold('║   GrowBy — Feedback Loop                             ║'));
  console.log(bold('║   Sistema de Memoria Auto-Mejorable                  ║'));
  console.log(bold('╚══════════════════════════════════════════════════════╝'));
  console.log();

  // ── CARGAR EPISODIO ────────────────────────────────────────────────────
  const episode = getEpisode(clienteId);

  if (!episode) {
    console.error(red(`❌  No se encontró episodio para: ${bold(clienteId)}`));
    console.error(dim('   Verifica que el cliente existe en memory/episodic/\n'));
    process.exit(1);
  }

  // ── MOSTRAR RESUMEN ────────────────────────────────────────────────────
  console.log(bold('📋  Resumen del rediseño'));
  printDivider();
  console.log(`  ${cyan('Cliente:')}         ${episode.cliente || clienteId}`);
  console.log(`  ${cyan('URL analizada:')}   ${episode.url || '—'}`);
  console.log(`  ${cyan('Industria:')}       ${episode.industria || '—'}`);
  console.log(`  ${cyan('CRO score orig:')}  ${episode.cro_score_original ?? '—'}/5`);
  if (episode.netlify_url) {
    console.log(`  ${cyan('Deploy Netlify:')}  ${episode.netlify_url}`);
  }
  if (episode.imagenes_generadas) {
    console.log(`  ${cyan('Imágenes gen.:')}   ${episode.imagenes_generadas}`);
  }
  if (episode.fecha) {
    console.log(`  ${cyan('Fecha:')}           ${episode.fecha}`);
  }
  printDivider();
  console.log();

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  // ── PREGUNTAS ──────────────────────────────────────────────────────────
  let visual_score, cambios_sugeridos_raw, copy_ok_raw, design_system_ok_raw;

  // 1. Score visual
  while (true) {
    const raw = await ask(rl, `  ${bold('1.')} ¿El output visual fue el esperado? ${dim('(1-5)')} › `);
    const n = parseInt(raw.trim(), 10);
    if (n >= 1 && n <= 5) { visual_score = n; break; }
    console.log(yellow('     Por favor ingresa un número del 1 al 5.'));
  }

  // 2. Cambios sugeridos
  cambios_sugeridos_raw = await ask(rl, `  ${bold('2.')} ¿Qué elementos cambiarías? ${dim('(texto libre, Enter para omitir)')} › `);

  // 3. Copy
  while (true) {
    const raw = await ask(rl, `  ${bold('3.')} ¿El copy capturó bien la propuesta de valor? ${dim('(s/n)')} › `);
    const v = raw.trim().toLowerCase();
    if (v === 's' || v === 'n') { copy_ok_raw = v === 's'; break; }
    console.log(yellow('     Ingresa s (sí) o n (no).'));
  }

  // 4. Design system
  while (true) {
    const raw = await ask(rl, `  ${bold('4.')} ¿El cliente reaccionó positivamente al design system? ${dim('(s/n)')} › `);
    const v = raw.trim().toLowerCase();
    if (v === 's' || v === 'n') { design_system_ok_raw = v === 's'; break; }
    console.log(yellow('     Ingresa s (sí) o n (no).'));
  }

  rl.close();

  // ── PROCESAR FEEDBACK ──────────────────────────────────────────────────
  const feedbackData = {
    visual_score,
    cambios_sugeridos: cambios_sugeridos_raw.trim() || null,
    copy_ok: copy_ok_raw,
    design_system_ok: design_system_ok_raw,
  };

  console.log();
  printDivider();
  console.log(bold('🧠  Procesando feedback y actualizando memoria...'));

  const result = processFeedback(clienteId, feedbackData);

  if (result.error) {
    console.error(red(`\n❌  ${result.error}`));
    process.exit(1);
  }

  // ── MOSTRAR RESULTADOS ─────────────────────────────────────────────────
  console.log();
  const scoreLabel = visual_score >= 4 ? green(`${visual_score}/5 ✓`) :
                     visual_score === 3 ? yellow(`${visual_score}/5`) :
                     red(`${visual_score}/5`);
  console.log(`  Score registrado:   ${scoreLabel}`);

  if (result.aprendizajes.length === 0) {
    console.log(dim('\n  Sin nuevos patrones generalizables en este ciclo.'));
  } else {
    console.log(`\n  ${bold('Aprendizajes registrados:')}`);
    result.aprendizajes.forEach(a => {
      console.log(`  🧠  ${cyan(a.pattern)}`);
    });
  }

  if (result.patrones_actualizados.length > 0) {
    console.log(`\n  ${bold('Patrones actualizados en memoria semántica:')}`);
    result.patrones_actualizados.forEach(p => {
      const conf = parseFloat(p.confidence.toFixed(3));
      const bar = conf >= 0.8 ? green('●●●') : conf >= 0.7 ? yellow('●●○') : dim('●○○');
      const tag = p.reforzado ? dim(' (reforzado)') : '';
      console.log(`  📈  ${p.pattern}${tag}`);
      console.log(`      Confianza: ${bar} ${conf}`);
    });
  }

  printDivider();
  console.log(green('\n✅  Feedback guardado. La memoria ha sido actualizada.\n'));
}

main().catch(err => {
  console.error(red('\n❌  Error inesperado:'), err.message);
  process.exit(1);
});
