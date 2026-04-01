import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

import { scrape } from './scraper.js';
import { runUIAgent } from './agents/ui-agent.js';
import { runUXAgent } from './agents/ux-agent.js';
import { runSEOCopyAgent } from './agents/seo-copy-agent.js';
import { runVisualAgent } from './agents/visual-agent.js';
import { generate } from './generator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function slugify(url) {
  return url
    .replace(/https?:\/\/(www\.)?/, '')
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 40);
}

function getScoreBar(score) {
  const filled = Math.round(score);
  return '■'.repeat(filled) + '□'.repeat(5 - filled) + ` (${score}/5)`;
}

async function run(url) {
  const sessionStart = Date.now();

  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║   GrowBy Web Redesign Agent — Pipeline Completo  ║');
  console.log('║   v0.3.0 · Análisis + Generación + Deploy        ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  console.log(`🌐 URL objetivo: ${url}\n`);

  const clientSlug = slugify(url);
  const today = new Date().toISOString().slice(0, 10);
  const outputDir = path.join(PROJECT_ROOT, 'outputs', `${clientSlug}-${today}`);

  // ═══════════════════════════════════════════════════════
  // FASE 1: SCRAPING
  // ═══════════════════════════════════════════════════════
  console.log('━━━ FASE 1: SCRAPING ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const scrapingData = await scrape(url);
  const industry = scrapingData.industria_detectada;
  console.log(`✓ Scraping completado — industria detectada: ${industry}`);

  // ═══════════════════════════════════════════════════════
  // FASE 2: ANÁLISIS (4 agentes en paralelo)
  // ═══════════════════════════════════════════════════════
  console.log('\n━━━ FASE 2: ANÁLISIS (4 agentes en paralelo) ━━━━━━━');

  const [uiResult, uxResult, seoCopyResult] = await Promise.all([
    Promise.resolve(runUIAgent(scrapingData)),
    Promise.resolve(runUXAgent(scrapingData, null)),
    Promise.resolve(runSEOCopyAgent(scrapingData, industry)),
  ]);

  // Visual agent runs twice: first without UI, then with UI for better prompts
  const visualResultFinal = runVisualAgent(scrapingData, uiResult);
  console.log('✓ 4 agentes completados');

  // ── Combinar resultados ──────────────────────────────────────────────
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fullAnalysis = {
    meta: {
      url,
      timestamp,
      industria: industry,
      agent_version: 'v0.3.0',
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

  // Guardar análisis completo
  ensureDir(path.join(PROJECT_ROOT, 'memory', 'working'));
  const workingPath = path.join(PROJECT_ROOT, 'memory', 'working', `full-analysis-${timestamp}.json`);
  fs.writeFileSync(workingPath, JSON.stringify(fullAnalysis, null, 2));

  ensureDir(outputDir);
  const analysisPath = path.join(outputDir, 'analysis.json');
  fs.writeFileSync(analysisPath, JSON.stringify(fullAnalysis, null, 2));
  fs.writeFileSync(
    path.join(outputDir, 'nano-banana-prompts.json'),
    JSON.stringify(visualResultFinal.image_prompts, null, 2)
  );
  console.log(`✓ Análisis guardado: outputs/${clientSlug}-${today}/analysis.json`);

  // ═══════════════════════════════════════════════════════
  // FASE 3: GENERACIÓN DEL ARTIFACT REACT
  // ═══════════════════════════════════════════════════════
  console.log('\n━━━ FASE 3: GENERACIÓN DEL ARTIFACT REACT ━━━━━━━━━');
  await generate(analysisPath);
  console.log(`✓ Artifact generado: outputs/${clientSlug}-${today}/index.html`);

  // ═══════════════════════════════════════════════════════
  // FASE 4: DEPLOY A NETLIFY
  // ═══════════════════════════════════════════════════════
  console.log('\n━━━ FASE 4: DEPLOY A NETLIFY ━━━━━━━━━━━━━━━━━━━━━━');
  let netlifyUrl = null;
  const deployScript = path.join(PROJECT_ROOT, 'scripts', 'deploy-netlify.sh');

  try {
    const deployOutput = execSync(`bash "${deployScript}" "${outputDir}"`, {
      encoding: 'utf8',
      timeout: 120_000,
    });
    console.log(deployOutput);

    // Read URL from deploy-url.txt if saved
    const urlFile = path.join(outputDir, 'deploy-url.txt');
    if (fs.existsSync(urlFile)) {
      netlifyUrl = fs.readFileSync(urlFile, 'utf8').trim();
    }
  } catch (err) {
    console.warn(`⚠ Deploy falló o no está autenticado: ${err.message.slice(0, 120)}`);
    console.log('  → Redesign guardado localmente como index.html');
  }

  // ═══════════════════════════════════════════════════════
  // REPORTE FINAL
  // ═══════════════════════════════════════════════════════
  const duracionSegundos = Math.round((Date.now() - sessionStart) / 1000);
  const ds = uiResult.design_system;
  const croScore = uxResult.cro_score_promedio;
  const topSEO = seoCopyResult.top_3_seo_issues;
  const quickWins = uxResult.quick_wins;
  const imgCount = visualResultFinal.image_prompts.length;

  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║   🎨 GrowBy Web Redesign Agent — Completado      ║');
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
  quickWins.forEach((win, i) =>
    console.log(`   ${i + 1}. [${win.dimension}] ${win.fix.slice(0, 70)}...`)
  );

  console.log(`\n🖼️  Prompts de imagen:  ${imgCount} prompts generados`);
  visualResultFinal.image_prompts.slice(0, 3).forEach(p =>
    console.log(`   - ${p.section} (${p.aspect_ratio})`)
  );
  if (imgCount > 3) console.log(`   ... y ${imgCount - 3} más`);

  console.log(`\n💾 Archivos generados:`);
  console.log(`   outputs/${clientSlug}-${today}/analysis.json`);
  console.log(`   outputs/${clientSlug}-${today}/nano-banana-prompts.json`);
  console.log(`   outputs/${clientSlug}-${today}/redesign.jsx`);
  console.log(`   outputs/${clientSlug}-${today}/index.html`);

  if (netlifyUrl) {
    console.log(`\n🚀 Rediseño publicado:`);
    console.log(`   ${netlifyUrl}`);
  } else {
    console.log(`\n📁 Redesign listo localmente (abre index.html en tu navegador)`);
    console.log(`   Ruta: outputs/${clientSlug}-${today}/index.html`);
    console.log(`   Para publicar: cd outputs/${clientSlug}-${today} && netlify deploy --dir=. --prod`);
  }

  console.log(`\n⏱️  Tiempo total: ${duracionSegundos}s`);
  console.log('════════════════════════════════════════════════════\n');

  return { fullAnalysis, netlifyUrl, outputDir };
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
