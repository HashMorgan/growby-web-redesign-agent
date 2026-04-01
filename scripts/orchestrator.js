import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { scrape } from './scraper.js';
import { runUIAgent } from './agents/ui-agent.js';
import { runUXAgent } from './agents/ux-agent.js';
import { runSEOCopyAgent } from './agents/seo-copy-agent.js';
import { runVisualAgent } from './agents/visual-agent.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function slugify(url) {
  return url.replace(/https?:\/\/(www\.)?/, '').replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 40);
}

async function run(url) {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║   GrowBy Web Redesign Agent — Sesión 2           ║');
  console.log('║   Motor de Análisis                              ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  console.log(`🌐 URL objetivo: ${url}\n`);

  // === FASE 1: SCRAPING ===
  console.log('━━━ FASE 1: SCRAPING ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const scrapingData = await scrape(url);
  const industry = scrapingData.industria_detectada;

  // === FASE 2: ANÁLISIS PARALELO ===
  console.log('\n━━━ FASE 2: ANÁLISIS (4 agentes en paralelo) ━━━━━━━');

  const [uiResult, uxResult, seoCopyResult, visualResult] = await Promise.all([
    Promise.resolve(runUIAgent(scrapingData)),
    Promise.resolve(runUXAgent(scrapingData, null)),
    Promise.resolve(runSEOCopyAgent(scrapingData, industry)),
    Promise.resolve(runVisualAgent(scrapingData, null)),
  ]);

  // Pass UI result to visual agent for better prompts
  const visualResultFinal = runVisualAgent(scrapingData, uiResult);

  // === FASE 3: COMBINE ===
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fullAnalysis = {
    meta: {
      url,
      timestamp,
      industria: industry,
      agent_version: 'v0.2.0',
    },
    scraping: {
      source: scrapingData.source,
      title: scrapingData.metadata.title,
      description: scrapingData.metadata.description,
      markdown_length: scrapingData.markdown.length,
    },
    ui_analysis: uiResult,
    ux_analysis: uxResult,
    seo_copy_analysis: seoCopyResult,
    visual_analysis: visualResultFinal,
  };

  // Save full analysis
  ensureDir(path.join(PROJECT_ROOT, 'memory', 'working'));
  const analysisPath = path.join(PROJECT_ROOT, 'memory', 'working', `full-analysis-${timestamp}.json`);
  fs.writeFileSync(analysisPath, JSON.stringify(fullAnalysis, null, 2));

  // Save to outputs/ dir
  const clientSlug = slugify(url);
  const today = new Date().toISOString().slice(0, 10);
  const outputDir = path.join(PROJECT_ROOT, 'outputs', `${clientSlug}-${today}`);
  ensureDir(outputDir);
  fs.writeFileSync(path.join(outputDir, 'analysis.json'), JSON.stringify(fullAnalysis, null, 2));
  fs.writeFileSync(path.join(outputDir, 'nano-banana-prompts.json'), JSON.stringify(visualResultFinal.image_prompts, null, 2));

  // === REPORTE CONSOLA ===
  const ds = uiResult.design_system;
  const croScore = uxResult.cro_score_promedio;
  const topSEO = seoCopyResult.top_3_seo_issues;
  const quickWins = uxResult.quick_wins;
  const imgCount = visualResultFinal.image_prompts.length;

  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║   REPORTE DE ANÁLISIS COMPLETO                   ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`\n🌐 URL analizada:    ${url}`);
  console.log(`🏭 Industria:        ${industry}`);
  console.log(`📡 Fuente scraping:  ${scrapingData.source}`);
  console.log(`\n🎨 Design System:`);
  console.log(`   Estilo visual:    ${ds.visual_style}`);
  console.log(`   Primary:          ${ds.palette.primary}`);
  console.log(`   Secondary:        ${ds.palette.secondary}`);
  console.log(`   Heading font:     ${ds.typography.heading_font}`);
  console.log(`   Body font:        ${ds.typography.body_font}`);

  console.log(`\n📊 CRO Score:        ${croScore}/5.0`);
  console.log(`   ${getScoreBar(croScore)}`);

  console.log(`\n🔍 Top 3 problemas SEO:`);
  topSEO.forEach((issue, i) => console.log(`   ${i + 1}. ${issue}`));

  console.log(`\n⚡ Top 3 quick wins:`);
  quickWins.forEach((win, i) => console.log(`   ${i + 1}. [${win.dimension}] ${win.fix.slice(0, 70)}...`));

  console.log(`\n🖼️  Prompts de imagen:  ${imgCount} prompts generados`);
  visualResultFinal.image_prompts.slice(0, 3).forEach(p => console.log(`   - ${p.section} (${p.aspect_ratio})`));
  if (imgCount > 3) console.log(`   ... y ${imgCount - 3} más`);

  console.log(`\n💾 Archivos guardados:`);
  console.log(`   memory/working/full-analysis-${timestamp}.json`);
  console.log(`   outputs/${clientSlug}-${today}/analysis.json`);
  console.log(`   outputs/${clientSlug}-${today}/nano-banana-prompts.json`);

  console.log(`\n✅ Listo para Fase 3: Generación del artifact React`);
  console.log(`   Ejecutar: node scripts/generator.js outputs/${clientSlug}-${today}/analysis.json\n`);

  return fullAnalysis;
}

function getScoreBar(score) {
  const filled = Math.round(score);
  return '■'.repeat(filled) + '□'.repeat(5 - filled) + ` (${score}/5)`;
}

// CLI mode
const url = process.argv[2];
if (!url) {
  console.error('Uso: node scripts/orchestrator.js <URL>');
  console.error('Ejemplo: node scripts/orchestrator.js https://growby.tech');
  process.exit(1);
}

run(url).catch(err => {
  console.error('\n❌ Error en el orchestrator:', err.message);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
});
