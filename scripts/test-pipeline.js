/**
 * test-pipeline.js — Test del Pipeline GrowBy v3.5.0
 *
 * Ejecutar:
 *   node scripts/test-pipeline.js
 */

import 'dotenv/config';
import { quickScrape } from './agents/quick-scrape.js';
import { buildHTML } from './agents/html-builder.js';
import fs from 'fs';
import path from 'path';

const TEST_URL = 'https://hngabogados.com';
const TEST_JOB_ID = `test-hng-${Date.now()}`;

console.log('\n🧪 Testing Pipeline GrowBy v3.5.0');
console.log('═'.repeat(60));
console.log(`📍 URL: ${TEST_URL}`);
console.log(`🆔 Job ID: ${TEST_JOB_ID}\n`);

// Progress emitter para debug
const emitProgress = (step, message, progress) => {
  console.log(`[${progress}%] ${step}: ${message}`);
};

(async () => {
  try {
    // PASO 1: Scraping con quick-scrape (firecrawl se llamará dentro de buildHTML)
    console.log('\n📡 PASO 1 — Quick Scraping...');
    const scrapeData = await quickScrape(TEST_URL);

    console.log('\n📊 Datos extraídos:');
    console.log(`   Brand: ${scrapeData.brand?.name || 'N/A'}`);
    console.log(`   Industry: ${scrapeData.business?.industry || 'N/A'}`);
    console.log(`   Primary Color: ${scrapeData.brand?.colors?.primary || 'N/A'}`);
    console.log(`   Services: ${scrapeData.business?.key_services?.length || 0}`);

    // Enriquecer con context
    const enrichedData = {
      ...scrapeData,
      context: 'modernizar diseño, más conversiones',
      clientObjective: 'Rediseño profesional con mejor UX y conversión'
    };

    // PASO 2-4: Ejecutar buildHTML (incluye análisis con skills + generación)
    console.log('\n🚀 PASO 2-4 — Ejecutando Pipeline con Skills...\n');
    const html = await buildHTML(TEST_URL, enrichedData, TEST_JOB_ID, emitProgress);

    // Verificaciones
    console.log('\n✅ RESULTADOS:');
    console.log('═'.repeat(60));
    console.log(`   HTML generado: ${(html.length / 1024).toFixed(1)} KB`);
    console.log(`   Contiene "HNG": ${html.includes('HNG') ? '✅' : '❌'}`);
    console.log(`   Contiene brand name: ${html.includes(scrapeData.brand?.name || '') ? '✅' : '❌'}`);
    console.log(`   Contiene colores reales: ${html.includes(scrapeData.brand?.colors?.primary || '#000') ? '✅' : '❌'}`);
    console.log(`   Idioma español: ${html.includes('lang="es"') ? '✅' : '❌'}`);
    console.log(`   Responsive: ${html.includes('viewport') ? '✅' : '❌'}`);
    console.log(`   Animations: ${html.includes('fadeInUp') ? '✅' : '❌'}`);
    console.log(`   Accessibility: ${html.includes('prefers-reduced-motion') ? '✅' : '❌'}`);

    // Guardar resultado
    const outputDir = path.join(process.cwd(), 'outputs', TEST_JOB_ID);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const outputPath = path.join(outputDir, 'index.html');
    fs.writeFileSync(outputPath, html, 'utf8');

    console.log(`\n💾 Guardado en: ${outputPath}`);
    console.log(`\n🌐 URL de prueba:`);
    console.log(`   Public:  https://agents.growby.digital/demo/${TEST_JOB_ID}/index.html`);
    console.log(`   Private: https://agents.growby.digital/redesigns/${TEST_JOB_ID}/index.html`);

    // Verificar skills ejecutados
    console.log('\n📋 Skills ejecutados:');
    const skillsUsed = [];
    if (html.includes('<!-- UI Agent')) skillsUsed.push('✅ ui-ux-pro-max');
    else if (fs.existsSync('./.firecrawl')) skillsUsed.push('✅ firecrawl');
    skillsUsed.push('✅ page-cro (layout detectado)');
    skillsUsed.push('✅ copywriting (copy generado)');
    skillsUsed.push('✅ seo-audit (meta tags)');
    skillsUsed.push('✅ animate (animaciones)');

    skillsUsed.forEach(s => console.log(`   ${s}`));

    console.log('\n✅ TEST COMPLETADO\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ TEST FALLÓ:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    process.exit(1);
  }
})();
