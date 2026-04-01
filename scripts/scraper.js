import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');

// ─── Industry detection — based on CONTENT, never on domain name ─────────────
const INDUSTRY_KEYWORDS = {
  elevator_company: ['elevador', 'ascensor', 'elevación', 'movilidad vertical', 'montacargas',
                     'escalera mecánica', 'elevator', 'lift', 'escalator', 'vertical transport',
                     'instalación de elevadores', 'mantenimiento de ascensores'],
  fintech:     ['banco', 'pago', 'transferencia', 'wallet', 'crédito', 'inversión', 'financiero',
                'payment', 'banking', 'finance', 'préstamo', 'ahorro'],
  ecommerce:   ['tienda online', 'compra online', 'carrito de compras', 'agregar al carrito',
                'shop', 'cart', 'checkout', 'add to cart', 'online store', 'oferta flash',
                'descuento exclusivo', 'compra ahora'],
  industrial:  ['transformador', 'tablero eléctrico', 'sub estación', 'subestación', 'ducto',
                'filtro activo', 'potencia eléctrica', 'voltaje', 'kva', 'industrial',
                'manufactura', 'maquinaria', 'equipos industriales', 'planta industrial',
                'automatización industrial', 'mantenimiento industrial'],
  saas:        ['software', 'plataforma', 'dashboard', 'integración', 'api', 'suscripción',
                'platform', 'subscription', 'automation', 'workflow', 'módulo'],
  healthcare:  ['salud', 'médico', 'clínica', 'paciente', 'tratamiento', 'health', 'medical',
                'clinic', 'doctor', 'hospital', 'terapia'],
  education:   ['curso', 'aprendizaje', 'certificado', 'estudiante', 'profesor', 'course',
                'learning', 'training', 'education', 'capacitación', 'universidad'],
  real_estate: ['inmueble', 'propiedad', 'arriendo', 'venta de casas', 'alquiler de departamentos',
                'real estate', 'property', 'apartment', 'condominio', 'bienes raíces'],
  agency:      ['agencia', 'servicio digital', 'cliente', 'proyecto web', 'equipo creativo',
                'solución digital', 'agency', 'consulting', 'marketing digital', 'diseño web'],
  logistics:   ['logística', 'transporte', 'distribución', 'cadena de suministro', 'flete',
                'logistics', 'shipping', 'delivery', 'almacén', 'supply chain'],
  construction:['construcción', 'inmobiliaria', 'obra', 'edificación', 'contratista',
                'construction', 'builder', 'contractor', 'proyecto inmobiliario'],
};

function detectIndustry(text) {
  const lower = text.toLowerCase();
  const scores = {};
  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    scores[industry] = keywords.filter(kw => lower.includes(kw)).length;
  }
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const top = sorted[0];
  return top[1] > 0 ? top[0] : 'general';
}

function detectPersonality(text) {
  const lower = text.toLowerCase();
  const signals = {
    professional_technical: ['certificado', 'normativa', 'técnico', 'especificación', 'homologado',
                              'certified', 'technical', 'specification', 'compliance', 'garantía técnica'],
    luxury_premium:         ['exclusivo', 'premium', 'lujo', 'elite', 'luxury', 'prestige',
                              'world-class', 'finest', 'boutique', 'select'],
    friendly_approachable:  ['familia', 'cercano', 'amigable', 'comunidad', 'juntos', 'friendly',
                              'community', 'together', 'smile', 'happy', 'pasión'],
    modern_direct:          ['innovación', 'disruptivo', 'ágil', 'rápido', 'eficiente', 'innovation',
                              'fast', 'efficient', 'agile', 'digital', 'smart'],
  };
  const scored = {};
  for (const [p, kws] of Object.entries(signals)) {
    scored[p] = kws.filter(k => lower.includes(k)).length;
  }
  const top = Object.entries(scored).sort((a, b) => b[1] - a[1])[0];
  return top[1] > 0 ? top[0] : 'professional_technical';
}

// ─── Asset extraction from HTML ───────────────────────────────────────────────
function toAbsoluteUrl(href, baseUrl) {
  if (!href) return null;
  if (href.startsWith('data:')) return null;
  if (href.startsWith('http://') || href.startsWith('https://')) return href;
  try { return new URL(href, baseUrl).href; } catch { return null; }
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
  const headerMatch = /<(?:header|nav)[^>]*>([\s\S]{0,3000}?)<\/(?:header|nav)>/i.exec(html);
  const headerHtml = headerMatch ? headerMatch[1] : '';
  const searchScopes = headerHtml ? [headerHtml, html] : [html];

  for (const scope of searchScopes) {
    if (assets.logo_url) break;
    const logoPatterns = [
      /<img[^>]+(?:class|id|alt)=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["'][^>]*>/gi,
      /<img[^>]+src=["']([^"']+)["'][^>]*(?:class|id|alt)=["'][^"']*logo[^"']*["'][^>]*>/gi,
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
  if (!assets.logo_url && headerHtml) {
    const svgMatch = /<img[^>]+src=["']([^"']*\.svg[^"']*)["'][^>]*>/gi.exec(headerHtml);
    if (svgMatch) {
      const abs = toAbsoluteUrl(svgMatch[1], baseUrl);
      if (abs) assets.logo_url = abs;
    }
  }

  // ── Colors ────────────────────────────────────────────────────────────────
  const themeColorMatch = /<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i.exec(html);
  if (themeColorMatch) assets.colors.push(themeColorMatch[1]);

  const rootMatch = /:root\s*\{([^}]+)\}/g;
  let m;
  while ((m = rootMatch.exec(html)) !== null) {
    const props = m[1].match(/(#[0-9a-fA-F]{3,8}|rgb\([^)]+\))/g) || [];
    assets.colors.push(...props);
  }

  const hexMatches = html.match(/#[0-9a-fA-F]{6}\b/g) || [];
  const hexFreq = {};
  for (const hex of hexMatches) { hexFreq[hex] = (hexFreq[hex] || 0) + 1; }
  const topHex = Object.entries(hexFreq).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([hex]) => hex);
  assets.colors.push(...topHex);
  assets.colors = [...new Set(assets.colors)].slice(0, 6);

  // ── Google Fonts ─────────────────────────────────────────────────────────
  const gFontsMatch = /<link[^>]+href=["'](https:\/\/fonts\.googleapis\.com[^"']+)["'][^>]*>/gi.exec(html);
  if (gFontsMatch) assets.google_fonts_url = gFontsMatch[1];

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
    const url = toAbsoluteUrl(m[1], baseUrl);
    if (!url) continue;
    if (/icon|favicon|sprite|badge|arrow|chevron|close|menu|star|check|bullet/i.test(url)) continue;
    imgUrls.push(url);
  }
  const bgImgRegex = /background(?:-image)?:\s*url\(['"]?([^'")\s]+)['"]?\)/gi;
  while ((m = bgImgRegex.exec(html)) !== null) {
    const url = toAbsoluteUrl(m[1], baseUrl);
    if (url && !/icon|favicon|sprite/i.test(url)) imgUrls.push(url);
  }
  assets.images = [...new Set(imgUrls)].slice(0, 20);

  // ── Client logos — aggressive multi-strategy extraction ─────────────────
  const IMG_EXTS = /\.(png|jpg|jpeg|svg|webp)(\?[^"']*)?$/i;

  // Strategy 1: sections with client/partner class names
  const clientSectionRegex = /<(?:section|div|ul|article)[^>]+(?:class|id)=["'][^"']*(?:client|partner|logo|brand|trust|cliente|aliado|marca|sponsor)[^"']*["'][^>]*([\s\S]{0,8000}?)<\/(?:section|div|ul|article)>/gi;
  while ((m = clientSectionRegex.exec(html)) !== null) {
    const sectionImgs = m[1].match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi) || [];
    for (const imgTag of sectionImgs) {
      const srcMatch = /src=["']([^"']+)["']/.exec(imgTag);
      if (srcMatch && IMG_EXTS.test(srcMatch[1])) {
        const url = toAbsoluteUrl(srcMatch[1], baseUrl);
        if (url && !/icon|favicon|arrow|bullet|check|star|social/i.test(url)) {
          assets.client_logos.push(url);
        }
      }
    }
  }

  // Strategy 2: images with path hints (/logos/, /clientes/, /partners/, etc.)
  const logoPathRegex = /<img[^>]+src=["']([^"']*(?:\/logos?\/|\/clientes?\/|\/partners?\/|\/brands?\/|\/sponsors?\/|\/aliados?\/|\/marcas?\/)([^"']+))["'][^>]*>/gi;
  while ((m = logoPathRegex.exec(html)) !== null) {
    if (IMG_EXTS.test(m[1])) {
      const url = toAbsoluteUrl(m[1], baseUrl);
      if (url) assets.client_logos.push(url);
    }
  }

  assets.client_logos = [...new Set(assets.client_logos)].slice(0, 20);

  // ── Videos ───────────────────────────────────────────────────────────────
  const iframeRegex = /<iframe[^>]+src=["']([^"']*(?:youtube|vimeo)[^"']*)["'][^>]*>/gi;
  while ((m = iframeRegex.exec(html)) !== null) assets.videos.push(m[1]);

  return assets;
}

// ─── Section-specific image extraction ───────────────────────────────────────
function extractSectionImages(html, allImages, baseUrl) {
  const toAbs = (src) => src ? toAbsoluteUrl(src, baseUrl) : null;
  const section_images = {};

  // Hero: find large images in hero/banner sections
  const heroMatch = /<(?:section|div)[^>]*(?:class|id)=["'][^"']*(?:hero|banner|jumbotron|main-slide|slider|portada|wp-block-cover)[^"']*["'][^>]*([\s\S]{0,5000}?)<\/(?:section|div)>/i.exec(html);
  if (heroMatch) {
    const bgImg = /background(?:-image)?:\s*url\(['"]?([^'")\s]+)['"]?\)/i.exec(heroMatch[1]);
    const tagImg = /<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i.exec(heroMatch[1]);
    section_images.hero = toAbs(bgImg?.[1]) || toAbs(tagImg?.[1]);
  }
  // Fallback: first real image that isn't a logo
  if (!section_images.hero && allImages.length > 0) section_images.hero = allImages[0];

  // About / team section
  const aboutMatch = /<(?:section|div)[^>]*(?:class|id)=["'][^"']*(?:about|nosotros|equipo|quienes|team)[^"']*["'][^>]*([\s\S]{0,5000}?)<\/(?:section|div)>/i.exec(html);
  if (aboutMatch) {
    const tagImg = /<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i.exec(aboutMatch[1]);
    section_images.about = toAbs(tagImg?.[1]);
  }

  // Services section
  const servicesMatch = /<(?:section|div)[^>]*(?:class|id)=["'][^"']*(?:services?|servicios?|solutions?)[^"']*["'][^>]*([\s\S]{0,5000}?)<\/(?:section|div)>/i.exec(html);
  if (servicesMatch) {
    const tagImg = /<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i.exec(servicesMatch[1]);
    section_images.services = toAbs(tagImg?.[1]);
  }

  // CTA section
  const ctaMatch = /<(?:section|div)[^>]*(?:class|id)=["'][^"']*(?:cta|call-to-action|contacto|contact|accion)[^"']*["'][^>]*([\s\S]{0,5000}?)<\/(?:section|div)>/i.exec(html);
  if (ctaMatch) {
    const bgImg = /background(?:-image)?:\s*url\(['"]?([^'")\s]+)['"]?\)/i.exec(ctaMatch[1]);
    const tagImg = /<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i.exec(ctaMatch[1]);
    section_images.cta = toAbs(bgImg?.[1]) || toAbs(tagImg?.[1]);
  }
  // Fallback: use a mid-point image for CTA
  if (!section_images.cta && allImages.length > 1) {
    section_images.cta = allImages[Math.floor(allImages.length / 2)];
  }

  return section_images;
}

// ─── Extract structured business data from content ────────────────────────────
function extractBusinessData(markdown, html, metadata, url) {
  const text = markdown + ' ' + metadata.title + ' ' + metadata.description;

  // Company name from title — skip generic WordPress/CMS fragments
  const GENERIC_TITLES = ['uncategorized', 'home', 'inicio', 'blog', 'page', 'página', 'sin categoría', 'sin categoria', 'news', 'noticias', 'about', 'contact', 'contacto'];
  const titleParts = (metadata.title || '').split(/[\|—–\-·]/);
  const companyName = (
    titleParts.find(p => {
      const clean = p.trim().toLowerCase();
      return clean.length > 2 && !GENERIC_TITLES.includes(clean);
    }) ||
    titleParts[0] ||
    // fallback: extract from domain (e.g. grupotrianon.com → Grupotrianon)
    (url.match(/(?:https?:\/\/)?(?:www\.)?([^./]+)/)?.[1] || 'Empresa')
  ).trim();

  // Key services — look for lists of services/products
  const servicesSection = markdown.match(/(?:servicios|productos|soluciones|services|products)[:\s\n]+([\s\S]{0,1000})/i);
  const key_services = [];
  if (servicesSection) {
    const items = servicesSection[1].match(/[-*•]\s*(.+)/g) || [];
    items.slice(0, 8).forEach(item => {
      const name = item.replace(/^[-*•]\s*/, '').trim();
      if (name.length > 3 && name.length < 100) key_services.push({ name, description: name });
    });
  }

  // Impact numbers — look for patterns like "XX años", "XXX proyectos", etc.
  const impact_numbers = [];
  const numPatterns = [
    /(\d+[\+]?)\s*(?:años?|years?)\s*(?:de\s*)?(?:experiencia|experience)/gi,
    /(\d+[\+K]*)\s*(?:proyectos?|projects?|instalaciones?|installations?)/gi,
    /(\d+[\+K%]*)\s*(?:clientes?|clients?|customers?)/gi,
    /(\d+[\+K]*)\s*(?:empleados?|employees?|trabajadores?)/gi,
  ];
  const numLabels = ['Años de experiencia', 'Proyectos completados', 'Clientes satisfechos', 'Colaboradores'];
  numPatterns.forEach((pattern, idx) => {
    const match = pattern.exec(text);
    if (match) {
      const rawVal = match[1];
      const numericVal = parseInt(rawVal.replace(/[+K%]/g, ''));
      // REGLA CRÍTICA: omitir si el valor es 0 o no numérico
      if (!isNaN(numericVal) && numericVal > 0) {
        impact_numbers.push({ value: rawVal, label: numLabels[idx] });
      }
    }
  });

  // Contact info
  const emailMatch = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/);

  // Navigation items from HTML
  const navMatch = /<(?:nav|header)[^>]*>([\s\S]{0,3000}?)<\/(?:nav|header)>/i.exec(html);
  const nav_items = [];
  if (navMatch) {
    const navLinks = navMatch[1].matchAll(/<a[^>]*>([^<]{2,30})<\/a>/gi);
    for (const link of navLinks) {
      const text = link[1].trim();
      if (text.length >= 2 && text.length <= 25 && !/logo|icon|img/i.test(text)) nav_items.push(text);
    }
  }

  // Testimonials — basic extraction
  const testimonials = [];
  const testimonialSection = markdown.match(/(?:testimonios?|testimonials?|opiniones?|clientes? dicen)[:\s\n]+([\s\S]{0,2000})/i);
  if (testimonialSection) {
    const quotes = testimonialSection[1].match(/"([^"]{20,300})"/g) || [];
    quotes.slice(0, 3).forEach(q => {
      testimonials.push({ text: q.replace(/"/g, ''), name: 'Cliente', role: '', company: '' });
    });
  }

  return {
    company_name: companyName,
    key_services,
    impact_numbers: impact_numbers.slice(0, 4),
    contact_email: emailMatch ? emailMatch[0] : null,
    contact_phone: phoneMatch ? phoneMatch[0] : null,
    nav_items: nav_items.slice(0, 6),
    testimonials,
  };
}

// ─── Firecrawl multi-page CRAWL ───────────────────────────────────────────────
async function crawlWithFirecrawl(url) {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error('FIRECRAWL_API_KEY not set');

  console.log('  → Starting Firecrawl crawl (multi-page)...');

  // Start crawl job
  const startRes = await fetch('https://api.firecrawl.dev/v1/crawl', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      limit: 10,
      scrapeOptions: {
        formats: ['markdown', 'html'],
        includeTags: ['title', 'meta', 'h1', 'h2', 'h3', 'h4', 'p', 'img', 'a', 'section', 'nav', 'header', 'footer'],
      },
    }),
  });

  if (!startRes.ok) {
    const err = await startRes.text();
    throw new Error(`Firecrawl crawl start error ${startRes.status}: ${err}`);
  }

  const { id: crawlId } = await startRes.json();
  if (!crawlId) throw new Error('No crawlId returned from Firecrawl');

  console.log(`  → Crawl started: ${crawlId}. Polling...`);

  // Poll until complete (max 60s)
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  for (let i = 0; i < 12; i++) {
    await sleep(5000);
    const statusRes = await fetch(`https://api.firecrawl.dev/v1/crawl/${crawlId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    if (!statusRes.ok) continue;
    const status = await statusRes.json();
    if (status.status === 'completed') {
      const pages = status.data || [];
      console.log(`  ✓ Crawl completado: ${pages.length} páginas scrapeadas`);
      return pages;
    }
    console.log(`  → Progreso: ${status.completed || 0}/${status.total || '?'} páginas...`);
  }

  throw new Error('Crawl timed out after 60s');
}

// ─── Firecrawl single-page SCRAPE (fallback for crawl) ───────────────────────
async function scrapeWithFirecrawl(url) {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error('FIRECRAWL_API_KEY not set');

  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, formats: ['markdown', 'html'] }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Firecrawl scrape error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const content = data.data || data;

  return [{
    markdown: content.markdown || '',
    html: content.html || '',
    metadata: {
      title: content.metadata?.title || '',
      description: content.metadata?.description || '',
      ogImage: content.metadata?.ogImage || '',
      statusCode: content.metadata?.statusCode || 200,
    },
  }];
}

// ─── Fallback: native fetch ───────────────────────────────────────────────────
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

  return [{
    markdown,
    html,
    metadata: {
      title: titleMatch ? titleMatch[1].trim() : '',
      description: descMatch ? descMatch[1].trim() : '',
      ogImage: ogImageMatch ? ogImageMatch[1].trim() : '',
      statusCode: response.status,
    },
  }];
}

// ─── Main export ──────────────────────────────────────────────────────────────
export async function scrape(url) {
  console.log(`\n🔍 Scraping (multi-página): ${url}`);

  let pages = [];
  let source = 'fallback';

  // Try multi-page crawl first
  try {
    console.log('  → Trying Firecrawl crawl (multi-page)...');
    pages = await crawlWithFirecrawl(url);
    source = 'firecrawl_crawl';
    console.log('  ✓ Firecrawl crawl OK');
  } catch (crawlErr) {
    console.log(`  ✗ Crawl failed: ${crawlErr.message}`);
    // Fall back to single-page scrape
    try {
      console.log('  → Trying Firecrawl scrape (single-page)...');
      pages = await scrapeWithFirecrawl(url);
      source = 'firecrawl_scrape';
      console.log('  ✓ Firecrawl scrape OK');
    } catch (scrapeErr) {
      console.log(`  ✗ Firecrawl scrape failed: ${scrapeErr.message}`);
      pages = await scrapeWithFallback(url);
      source = 'fallback';
      console.log('  ✓ Fallback OK');
    }
  }

  // Merge all pages
  const allMarkdown = pages.map(p => p.markdown || '').join('\n\n');
  const allHtml = pages.map(p => p.html || '').join('\n');
  const primaryMeta = pages[0]?.metadata || {};

  console.log(`  ✓ ${pages.length} página(s) scrapeadas`);

  // ── Detect industry from CONTENT (never from domain name) ─────────────────
  const textForDetection = allMarkdown + ' ' + primaryMeta.title + ' ' + primaryMeta.description;
  const industria = detectIndustry(textForDetection);
  const personality = detectPersonality(textForDetection);

  console.log(`  🏭 Industria detectada: ${industria} (basado en contenido del sitio)`);
  console.log(`  🎭 Personalidad de marca: ${personality}`);

  // ── Extract visual assets ──────────────────────────────────────────────────
  console.log('  🎨 Extrayendo assets visuales...');
  const assets = extractAssets(allHtml, url);
  // Extract section-specific images (hero, cta, about, services)
  assets.section_images = extractSectionImages(allHtml, assets.images, url);
  console.log(`     Logo: ${assets.logo_url ? '✅ ' + assets.logo_url.slice(0, 60) : '❌ no detectado'}`);
  console.log(`     Colores: ${assets.colors.length > 0 ? '✅ ' + assets.colors.slice(0, 4).join(', ') : '❌ ninguno'}`);
  console.log(`     Fuentes: ${assets.fonts.length > 0 ? '✅ ' + assets.fonts.slice(0, 2).join(', ') : '❌ ninguna'}`);
  console.log(`     Imágenes reales: ${assets.images.length}`);
  console.log(`     Logos clientes: ${assets.client_logos.length}`);
  console.log(`     Hero img: ${assets.section_images.hero ? '✅' : '❌'} · CTA img: ${assets.section_images.cta ? '✅' : '❌'}`);

  // ── Extract structured business data ──────────────────────────────────────
  const business = extractBusinessData(allMarkdown, allHtml, primaryMeta, url);
  console.log(`  🏢 Empresa: ${business.company_name}`);
  console.log(`  📋 Servicios detectados: ${business.key_services.length}`);
  console.log(`  📊 Números de impacto: ${business.impact_numbers.length}`);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const output = {
    url,
    timestamp,
    source,
    pages_scraped: pages.length,
    markdown: allMarkdown,
    html: allHtml,
    metadata: {
      title: primaryMeta.title || '',
      description: primaryMeta.description || '',
      ogImage: primaryMeta.ogImage || '',
    },
    industria_detectada: industria,
    brand: {
      name: business.company_name,
      personality,
      colors: {
        primary: assets.colors[0] || null,
        secondary: assets.colors[1] || null,
        accent: assets.colors[2] || null,
      },
      fonts: {
        heading: assets.fonts[0] || null,
        body: assets.fonts[1] || assets.fonts[0] || null,
      },
    },
    business: {
      industry: industria,
      company_name: business.company_name,
      key_services: business.key_services,
      impact_numbers: business.impact_numbers,
      contact_email: business.contact_email,
      contact_phone: business.contact_phone,
      nav_items: business.nav_items,
      testimonials: business.testimonials,
    },
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
