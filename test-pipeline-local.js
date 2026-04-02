import 'dotenv/config';
import { quickScrape } from './scripts/agents/quick-scrape.js';
import { generateWithStitch } from './scripts/agents/stitch-simple.js';
import fs from 'fs';
import path from 'path';

console.log('╔══════════════════════════════════════════════════╗');
console.log('║   TEST 2: Pipeline local con Grupo Trianon      ║');
console.log('╚══════════════════════════════════════════════════╝\n');

const testUrl = 'https://www.grupotrianon.com/';

async function testPipeline() {
  try {
    // Step 1: Quick scrape
    console.log('PASO 1: Quick scraping...');
    const scrapeData = await quickScrape(testUrl);

    if (!scrapeData.url) {
      console.log('❌ FAIL: Scraping failed');
      return false;
    }

    console.log('✅ Scraping OK\n');

    // Step 2: Build prompt
    console.log('PASO 2: Building prompt...');
    const prompt = `Rediseña el home web de ${testUrl}. Usa el mismo contenido, colores y logos del sitio original. Mejora las imágenes según el rubro. Agrega en el footer: Powered by GrowBy con logo https://growby.tech/favicon.ico linking a growby.tech`;
    console.log(`✅ Prompt: ${prompt.slice(0, 100)}...\n`);

    // Step 3: Generate with Stitch
    console.log('PASO 3: Generating with Stitch...');
    const html = await generateWithStitch(prompt);

    if (!html || html.length < 100) {
      console.log('❌ FAIL: HTML too short or empty');
      return false;
    }

    console.log(`✅ HTML generated: ${(html.length / 1024).toFixed(1)} KB\n`);

    // Step 4: Save to file
    const outputDir = path.join(process.cwd(), 'outputs', 'test-v2-grupotrianon');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const htmlPath = path.join(outputDir, 'index.html');
    fs.writeFileSync(htmlPath, html, 'utf8');

    console.log(`✅ PASS: HTML saved to ${htmlPath}`);
    console.log(`   Size: ${(html.length / 1024).toFixed(1)} KB`);

    return true;

  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    console.error(error.stack);
    return false;
  }
}

testPipeline().then(success => {
  process.exit(success ? 0 : 1);
});
