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

// --- Asset extraction from HTML ---
function toAbsoluteUrl(href, baseUrl) {
  if (!href) return null;
  if (href.startsWith('data:')) return null;
  if (href.startsWith('http://') || href.startsWith('https://')) return href;
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return null;
  }
}

function extractAssets(html, baseUrl) {
  const assets = {
    logo_url: null,
    colors: [],
    fonts: [],
    google_fonts_url: null,
    images: [],
    client_logos: [],
    videos: [],
  };

  // ── Logo ──────────────────────────────────────────────────────────────────
  // Strategy: look inside <header> or <nav> first, then fallback to page-wide logo search

  // Extract header/nav HTML block for more precise logo detection
  const headerMatch = /<(?:header|nav)[^>]*>([\s\S]{0,3000}?)<\/(?:header|nav)>/i.exec(html);
  const headerHtml = headerMatch ? headerMatch[1] : '';
  const searchScopes = headerHtml ? [headerHtml, html] : [html];

  for (const scope of searchScopes) {
    if (assets.logo_url) break;
    const logoPatterns = [
      // img with "logo" in class/id/alt
      /<img[^>]+(?:class|id|alt)=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["'][^>]*>/gi,
      /<img[^>]+src=["']([^"']+)["'][^>]*(?:class|id|alt)=["'][^"']*logo[^"']*["'][^>]*>/gi,
      // img with "logo" in src path
      /<img[^>]+src=["']([^"']*[\/\-_]logo[^"']*)["'][^>]*>/gi,
    ];
    for (const pattern of logoPatterns) {
      const match = pattern.exec(scope);
      if (match) {
        const abs = toAbsoluteUrl(match[1], baseUrl);
        if (abs) { assets.logo_url = abs; break; }
      }
    }
  }

  // Fallback: first SVG in header
  if (!assets.logo_url && headerHtml) {
    const svgMatch = /<img[^>]+src=["']([^"']*\.svg[^"']*)["'][^>]*>/gi.exec(headerHtml);
    if (svgMatch) {
      const abs = toAbsoluteUrl(svgMatch[1], baseUrl);
      if (abs) assets.logo_url = abs;
    }
  }

  // ── Colors ────────────────────────────────────────────────────────────────
  // meta theme-color
  const themeColorMatch = /<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i.exec(html);
  if (themeColorMatch) assets.colors.push(themeColorMatch[1]);

  // CSS :root custom properties
  const rootMatch = /:root\s*\{([^}]+)\}/g;
  let m;
  while ((m = rootMatch.exec(html)) !== null) {
    const props = m[1].match(/(#[0-9a-fA-F]{3,8}|rgb\([^)]+\))/g) || [];
    assets.colors.push(...props);
  }

  // Inline style colors (frequent hex values)
  const hexMatches = html.match(/#[0-9a-fA-F]{6}\b/g) || [];
  const hexFreq = {};
  for (const hex of hexMatches) {
    hexFreq[hex] = (hexFreq[hex] || 0) + 1;
  }
  const topHex = Object.entries(hexFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([hex]) => hex);
  assets.colors.push(...topHex);

  // Deduplicate and take top 5
  assets.colors = [...new Set(assets.colors)].slice(0, 5);

  // ── Google Fonts ─────────────────────────────────────────────────────────
  const gFontsMatch = /<link[^>]+href=["'](https:\/\/fonts\.googleapis\.com[^"']+)["'][^>]*>/gi.exec(html);
  if (gFontsMatch) {
    assets.google_fonts_url = gFontsMatch[1];
  }

  // font-family values from CSS
  const fontFamilyMatches = html.match(/font-family:\s*['"]?([^;,"']+)/gi) || [];
  const fontNames = fontFamilyMatches
    .map(f => f.replace(/font-family:\s*['"]?/i, '').trim())
    .filter(f => f && !f.startsWith('-') && f.length > 2 && f.length < 40)
    .slice(0, 4);
  assets.fonts = [...new Set(fontNames)];

  // ── Images ────────────────────────────────────────────────────────────────
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const imgUrls = [];
  while ((m = imgRegex.exec(html)) !== null) {
    const src = m[0];
    const url = toAbsoluteUrl(m[1], baseUrl);
    if (!url) continue;
    // Skip likely icons/tiny images (by name pattern)
    const lowerUrl = url.toLowerCase();
    if (/icon|favicon|sprite|badge|arrow|chevron|close|menu|star|check|bullet/i.test(lowerUrl)) continue;
    // Skip data URIs already filtered by toAbsoluteUrl
    imgUrls.push(url);
  }

  // CSS background-image
  const bgImgRegex = /background(?:-image)?:\s*url\(['"]?([^'")\s]+)['"]?\)/gi;
  while ((m = bgImgRegex.exec(html)) !== null) {
    const url = toAbsoluteUrl(m[1], baseUrl);
    if (url && !/icon|favicon|sprite/i.test(url)) imgUrls.push(url);
  }

  assets.images = [...new Set(imgUrls)].slice(0, 20);

  // ── Client logos ─────────────────────────────────────────────────────────
  // Find sections with "client", "partner", "logo", "brand", "trust", "cliente" in class
  const clientSectionRegex = /<(?:section|div|ul)[^>]+class=["'][^"']*(?:client|partner|logo|brand|trust|cliente|aliado|marca)[^"']*["'][^>]*>([\s\S]*?)<\/(?:section|div|ul)>/gi;
  while ((m = clientSectionRegex.exec(html)) !== null) {
    const sectionHtml = m[1];
    const sectionImgs = sectionHtml.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi) || [];
    for (const imgTag of sectionImgs) {
      const srcMatch = /src=["']([^"']+)["']/.exec(imgTag);
      if (srcMatch) {
        const url = toAbsoluteUrl(srcMatch[1], baseUrl);
        if (url) assets.client_logos.push(url);
      }
    }
    // Also check alt text for brand names
  }

  // Deduplicate client logos
  assets.client_logos = [...new Set(assets.client_logos)].slice(0, 20);

  // ── Videos ───────────────────────────────────────────────────────────────
  // YouTube/Vimeo iframes
  const iframeRegex = /<iframe[^>]+src=["']([^"']*(?:youtube|vimeo)[^"']*)["'][^>]*>/gi;
  while ((m = iframeRegex.exec(html)) !== null) {
    assets.videos.push(m[1]);
  }
  // HTML5 video
  const videoRegex = /<video[^>]*>[\s\S]*?<source[^>]+src=["']([^"']+)["']/gi;
  while ((m = videoRegex.exec(html)) !== null) {
    const url = toAbsoluteUrl(m[1], baseUrl);
    if (url) assets.videos.push(url);
  }

  return assets;
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
      // No includeTags filter — get full HTML for asset extraction
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

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);

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

  const industria = detectIndustry(
    result.markdown + ' ' + result.metadata.title + ' ' + result.metadata.description
  );
  console.log(`  🏭 Industria detectada: ${industria}`);

  // Extract visual assets from HTML
  console.log('  🎨 Extrayendo assets visuales...');
  const assets = extractAssets(result.html, url);
  console.log(`     Logo: ${assets.logo_url ? '✅ ' + assets.logo_url.slice(0, 60) : '❌ no detectado'}`);
  console.log(`     Colores: ${assets.colors.length > 0 ? '✅ ' + assets.colors.slice(0, 3).join(', ') : '❌ ninguno'}`);
  console.log(`     Fuentes: ${assets.fonts.length > 0 ? '✅ ' + assets.fonts.slice(0, 2).join(', ') : '❌ ninguna'}`);
  console.log(`     Google Fonts: ${assets.google_fonts_url ? '✅' : '❌'}`);
  console.log(`     Imágenes: ${assets.images.length}`);
  console.log(`     Logos clientes: ${assets.client_logos.length}`);
  console.log(`     Videos: ${assets.videos.length}`);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const output = {
    url,
    timestamp,
    ...result,
    industria_detectada: industria,
    assets,
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
