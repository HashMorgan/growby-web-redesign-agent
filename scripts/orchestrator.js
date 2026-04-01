import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// ── v0.9.0: New multi-subagent pipeline ──
import { scrapeDeep } from './agents/scraper-pro.js';
import { planLayout } from './agents/layout-architect.js';
import { buildComponents } from './agents/component-builder.js';
import { assembleHTML } from './agents/assembler.js';

// ── Legacy fallback ──
import { scrape } from './scraper.js';

// ── Analysis agents (unchanged) ──
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

export async function run(url) {
  const sessionStart = Date.now();

  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║   GrowBy Web Redesign Agent — Pipeline Completo  ║');
  console.log('║   v0.9.0 · Multi-Subagent Architecture           ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  console.log(`🌐 URL objetivo: ${url}\n`);

  const clientSlug = slugify(url);
  const today = new Date().toISOString().slice(0, 10);
  const outputDir = path.join(PROJECT_ROOT, 'outputs', `${clientSlug}-${today}`);

  // ═══════════════════════════════════════════════════════
  // FASE 1: SCRAPING — scrapeDeep (up to 15 pages)
  // ═══════════════════════════════════════════════════════
  console.log('━━━ FASE 1: SCRAPING (deep, hasta 15 páginas) ━━━━━');
  let scrapingData;

  try {
    scrapingData = await scrapeDeep(url);
    console.log(`  ✅ scrapeDeep OK (${scrapingData.pages_scraped} páginas)`);
  } catch (deepErr) {
    console.warn(`  ⚠ scrapeDeep falló: ${deepErr.message}`);
    console.log('  → Fallback a scraper original...');
    scrapingData = await scrape(url);
    console.log(`  ✅ Fallback OK (${scrapingData.pages_scraped || 1} páginas)`);
  }

  const industry = scrapingData.industria_detectada;
  const companyName = scrapingData.business?.company_name || scrapingData.brand?.name || 'Empresa';

  console.log(`\n  ✅ Páginas scrapeadas: ${scrapingData.pages_scraped || 1}`);
  console.log(`  ✅ Industria detectada: ${industry}`);
  console.log(`  ✅ Empresa: ${companyName}`);
  console.log(`  ✅ Colores de marca: ${scrapingData.assets?.colors?.length ? scrapingData.assets.colors.slice(0, 3).join(', ') : 'no detectados'}`);
  console.log(`  ✅ Logo: ${scrapingData.assets?.logo_url ? scrapingData.assets.logo_url.slice(0, 60) : 'no encontrado'}`);
  console.log(`  ✅ Personalidad de marca: ${scrapingData.brand?.personality || 'general'}`);
  console.log(`  ✅ Servicios detectados: ${scrapingData.business?.key_services?.length || 0}`);
  console.log(`  ✅ Testimonials: ${(scrapingData.testimonials || scrapingData.business?.testimonials || []).length}`);
  console.log(`  ✅ FAQ items: ${(scrapingData.faq || []).length}`);
  console.log(`  ✅ Logos de clientes: ${scrapingData.assets?.client_logos?.length || 0}`);

  // ═══════════════════════════════════════════════════════
  // FASE 2: ANÁLISIS (4 agentes en paralelo)
  // ═══════════════════════════════════════════════════════
  console.log('\n━━━ FASE 2: ANÁLISIS (4 agentes en paralelo) ━━━━━━━');

  const [uiResult, uxResult, seoCopyResult] = await Promise.all([
    Promise.resolve(runUIAgent(scrapingData)),
    Promise.resolve(runUXAgent(scrapingData, null)),
    Promise.resolve(runSEOCopyAgent(scrapingData, industry)),
  ]);

  const visualResultFinal = runVisualAgent(scrapingData, uiResult);
  console.log('✓ 4 agentes de análisis completados');

  // Combine all analysis results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fullAnalysis = {
    meta: {
      url,
      timestamp,
      industria: industry,
      agent_version: 'v0.9.0',
    },
    scraping: {
      source: scrapingData.source,
      title: scrapingData.metadata.title,
      description: scrapingData.metadata.description,
      markdown_length: scrapingData.markdown.length,
      assets: scrapingData.assets || null,
      brand: scrapingData.brand || null,
      business: scrapingData.business || null,
      pages_scraped: scrapingData.pages_scraped || 1,
      metadata: scrapingData.metadata || {},
    },
    ui_analysis: uiResult,
    ux_analysis: uxResult,
    seo_copy_analysis: seoCopyResult,
    visual_analysis: visualResultFinal,
    // Enhanced fields from scraper-pro
    testimonials: scrapingData.testimonials || scrapingData.business?.testimonials || [],
    faq: scrapingData.faq || [],
    navigation_pages: scrapingData.navigation_pages || ['/'],
  };

  // Save analysis
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
  // FASE 3: LAYOUT PLANNING
  // ═══════════════════════════════════════════════════════
  console.log('\n━━━ FASE 3: LAYOUT PLANNING ━━━━━━━━━━━━━━━━━━━━━━━');
  const layoutPlan = planLayout(fullAnalysis);
  fs.writeFileSync(
    path.join(outputDir, 'layout-plan.json'),
    JSON.stringify(layoutPlan, null, 2)
  );
  console.log(`✓ Layout plan: ${layoutPlan.sections.length} secciones`);

  // ═══════════════════════════════════════════════════════
  // FASE 4: COMPONENT BUILDING
  // ═══════════════════════════════════════════════════════
  console.log('\n━━━ FASE 4: COMPONENT BUILDING ━━━━━━━━━━━━━━━━━━━━');
  const components = buildComponents(layoutPlan, fullAnalysis);
  console.log(`✓ Componentes construidos`);

  // ═══════════════════════════════════════════════════════
  // FASE 5: ASSEMBLY
  // ═══════════════════════════════════════════════════════
  console.log('\n━━━ FASE 5: ASSEMBLY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const { htmlPath, jsxPath, htmlSize } = await assembleHTML(
    components,
    layoutPlan,
    fullAnalysis,
    outputDir
  );
  console.log(`✓ HTML assembleado: index.html (${(htmlSize / 1024).toFixed(1)} KB)`);

  // ═══════════════════════════════════════════════════════
  // FASE 6: DEPLOY A NETLIFY
  // ═══════════════════════════════════════════════════════
  console.log('\n━━━ FASE 6: DEPLOY A NETLIFY ━━━━━━━━━━━━━━━━━━━━━━');
  let netlifyUrl = null;
  const deployScript = path.join(PROJECT_ROOT, 'scripts', 'deploy-netlify.sh');

  try {
    const deployOutput = execSync(`bash "${deployScript}" "${outputDir}"`, {
      encoding: 'utf8',
      timeout: 120_000,
    });
    console.log(deployOutput);

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
  const ds = layoutPlan.design_system;
  const croScore = uxResult.cro_score_promedio;
  const topSEO = seoCopyResult.top_3_seo_issues;
  const quickWins = uxResult.quick_wins;
  const imgCount = visualResultFinal.image_prompts.length;

  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║   GrowBy Web Redesign Agent — Completado ✅      ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`\n🌐 URL analizada:    ${url}`);
  console.log(`🏢 Empresa:          ${companyName}`);
  console.log(`🏭 Industria:        ${industry}`);
  console.log(`📡 Fuente scraping:  ${scrapingData.source}`);

  console.log(`\n🎨 Design System:`);
  console.log(`   Estilo visual:    ${ds.visual_style}`);
  console.log(`   Primary:          ${ds.colors.primary}`);
  console.log(`   Secondary:        ${ds.colors.secondary}`);
  console.log(`   Heading font:     ${ds.fonts.heading}`);
  console.log(`   Body font:        ${ds.fonts.body}`);

  console.log(`\n📐 Layout:`);
  layoutPlan.sections.forEach(s => console.log(`   → ${s.type}`));

  if (croScore !== undefined) {
    console.log(`\n📊 CRO Score:        ${croScore}/5.0`);
    console.log(`   ${getScoreBar(croScore)}`);
  }

  if (topSEO?.length) {
    console.log(`\n🔍 Top 3 problemas SEO:`);
    topSEO.forEach((issue, i) => console.log(`   ${i + 1}. ${issue}`));
  }

  if (quickWins?.length) {
    console.log(`\n⚡ Top 3 quick wins:`);
    quickWins.slice(0, 3).forEach((win, i) =>
      console.log(`   ${i + 1}. [${win.dimension}] ${win.fix?.slice(0, 70)}...`)
    );
  }

  console.log(`\n🖼️  Prompts de imagen:  ${imgCount} prompts generados`);

  console.log(`\n💾 Archivos generados:`);
  console.log(`   outputs/${clientSlug}-${today}/analysis.json`);
  console.log(`   outputs/${clientSlug}-${today}/layout-plan.json`);
  console.log(`   outputs/${clientSlug}-${today}/nano-banana-prompts.json`);
  console.log(`   outputs/${clientSlug}-${today}/redesign.jsx`);
  console.log(`   outputs/${clientSlug}-${today}/index.html (${(htmlSize / 1024).toFixed(1)} KB)`);

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

  return { fullAnalysis, layoutPlan, netlifyUrl, outputDir, htmlPath };
}

// CLI mode
if (process.argv[1] === fileURLToPath(import.meta.url)) {
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
}
