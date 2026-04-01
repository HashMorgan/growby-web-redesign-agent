import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');

// --- Industry detection ---
const INDUSTRY_KEYWORDS = {
  fintech:     ['banco', 'pago', 'transferencia', 'wallet', 'crédito', 'inversión', 'financiero', 'payment', 'banking', 'finance'],
  ecommerce:   ['tienda', 'compra', 'carrito', 'producto', 'envío', 'precio', 'shop', 'cart', 'store', 'checkout'],
  saas:        ['software', 'plataforma', 'dashboard', 'integración', 'api', 'suscripción', 'platform', 'subscription', 'automation'],
  healthcare:  ['salud', 'médico', 'clínica', 'paciente', 'tratamiento', 'health', 'medical', 'clinic', 'doctor'],
  education:   ['curso', 'aprendizaje', 'certificado', 'estudiante', 'profesor', 'course', 'learning', 'training', 'education'],
  real_estate: ['inmueble', 'propiedad', 'arriendo', 'venta', 'm2', 'alquiler', 'real estate', 'property', 'apartment'],
  agency:      ['agencia', 'servicio', 'cliente', 'proyecto', 'equipo', 'solución', 'agency', 'services', 'consulting', 'digital'],
};

function detectIndustry(text) {
  const lower = text.toLowerCase();
  const scores = {};
  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    scores[industry] = keywords.filter(kw => lower.includes(kw)).length;
  }
  const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return top[1] > 0 ? top[0] : 'general';
}

// --- Firecrawl scrape ---
async function scrapeWithFirecrawl(url) {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error('FIRECRAWL_API_KEY not set');

  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown', 'html'],
      includeTags: ['title', 'meta', 'h1', 'h2', 'h3', 'p', 'img', 'a'],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Firecrawl error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const content = data.data || data;

  return {
    markdown: content.markdown || '',
    html: content.html || '',
    metadata: {
      title: content.metadata?.title || '',
      description: content.metadata?.description || '',
      ogImage: content.metadata?.ogImage || content.metadata?.og_image || '',
      statusCode: content.metadata?.statusCode || 200,
    },
    source: 'firecrawl',
  };
}

// --- Fallback: native fetch ---
async function scrapeWithFallback(url) {
  console.log('  ⚠ Using fallback scraper (native fetch)...');
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GrowByBot/1.0)' },
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();

  // Extract basic metadata from HTML
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);

  // Convert HTML to rough markdown (headings + paragraphs)
  const markdown = html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    markdown,
    html,
    metadata: {
      title: titleMatch ? titleMatch[1].trim() : '',
      description: descMatch ? descMatch[1].trim() : '',
      ogImage: ogImageMatch ? ogImageMatch[1].trim() : '',
      statusCode: response.status,
    },
    source: 'fallback',
  };
}

// --- Main ---
export async function scrape(url) {
  console.log(`\n🔍 Scraping: ${url}`);

  let result;
  try {
    console.log('  → Trying Firecrawl...');
    result = await scrapeWithFirecrawl(url);
    console.log('  ✓ Firecrawl OK');
  } catch (err) {
    console.log(`  ✗ Firecrawl failed: ${err.message}`);
    result = await scrapeWithFallback(url);
    console.log('  ✓ Fallback OK');
  }

  const industria = detectIndustry(result.markdown + ' ' + result.metadata.title + ' ' + result.metadata.description);
  console.log(`  🏭 Industria detectada: ${industria}`);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const output = {
    url,
    timestamp,
    ...result,
    industria_detectada: industria,
  };

  const outPath = path.join(PROJECT_ROOT, 'memory', 'working', `scraping-${timestamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`  💾 Guardado en: memory/working/scraping-${timestamp}.json`);

  return output;
}

// CLI mode
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const url = process.argv[2];
  if (!url) { console.error('Usage: node scripts/scraper.js <URL>'); process.exit(1); }
  scrape(url).catch(err => { console.error(err); process.exit(1); });
}
