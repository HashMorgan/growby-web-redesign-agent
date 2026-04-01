import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..', '..');

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

// ─── Asset extraction helpers ─────────────────────────────────────────────────
function toAbsoluteUrl(href, baseUrl) {
  if (!href) return null;
  if (href.startsWith('data:')) return null;
  if (href.startsWith('http://') || href.startsWith('https://')) return href;
  try { return new URL(href, baseUrl).href; } catch { return null; }
}

// ─── Enhanced logo extraction — 3 strategies ─────────────────────────────────
function extractLogoUrl(html, baseUrl) {
  const headerMatch = /<(?:header|nav)[^>]*>([\s\S]{0,3000}?)<\/(?:header|nav)>/i.exec(html);
  const headerHtml = headerMatch ? headerMatch[1] : '';
  const searchScopes = headerHtml ? [headerHtml, html] : [html];

  // Strategy 1: class/id/alt attributes containing "logo"
  for (const scope of searchScopes) {
    const logoPatterns = [
      /<img[^>]+(?:class|id|alt)=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["'][^>]*>/gi,
      /<img[^>]+src=["']([^"']+)["'][^>]*(?:class|id|alt)=["'][^"']*logo[^"']*["'][^>]*>/gi,
      /<img[^>]+src=["']([^"']*[\/\-_]logo[^"']*)["'][^>]*>/gi,
    ];
    for (const pattern of logoPatterns) {
      const match = pattern.exec(scope);
      if (match) {
        const abs = toAbsoluteUrl(match[1], baseUrl);
        if (abs) return abs;
      }
    }
  }

  // Strategy 2: SVG in header/nav
  if (headerHtml) {
    const svgMatch = /<img[^>]+src=["']([^"']*\.svg[^"']*)["'][^>]*>/gi.exec(headerHtml);
    if (svgMatch) {
      const abs = toAbsoluteUrl(svgMatch[1], baseUrl);
      if (abs) return abs;
    }
    // Inline SVG as logo — detect the first SVG element in the header
    const inlineSvgMatch = /<a[^>]*(?:href=["']\/["']|class=["'][^"']*(?:logo|brand)[^"']*["'])[^>]*>([\s\S]{0,500}?<svg[\s\S]{0,2000}?<\/svg>[\s\S]{0,100}?)<\/a>/i.exec(headerHtml);
    if (inlineSvgMatch) return '__inline_svg__'; // signal that logo is inline SVG
  }

  // Strategy 3: data attributes and CSS background in header
  if (headerHtml) {
    const dataLogoMatch = /data-(?:logo|src)=["']([^"']+\.(?:png|jpg|jpeg|svg|webp)[^"']*)["']/gi.exec(headerHtml);
    if (dataLogoMatch) {
      const abs = toAbsoluteUrl(dataLogoMatch[1], baseUrl);
      if (abs) return abs;
    }
  }

  return null;
}

// ─── Enhanced color extraction ────────────────────────────────────────────────
function extractColors(html) {
  const colors = [];

  // Priority 1: theme-color meta tag
  const themeColorMatch = /<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i.exec(html);
  if (themeColorMatch) colors.push(themeColorMatch[1]);

  // Priority 2: data-color attributes (design tokens in HTML)
  const dataColorMatches = html.match(/data-color=["']([^"']+)["']/gi) || [];
  for (const match of dataColorMatches) {
    const val = /data-color=["']([^"']+)["']/.exec(match)?.[1];
    if (val && val.startsWith('#')) colors.push(val);
  }

  // Priority 3: CSS custom properties in :root
  const rootRegex = /:root\s*\{([^}]+)\}/g;
  let m;
  while ((m = rootRegex.exec(html)) !== null) {
    const props = m[1].match(/(#[0-9a-fA-F]{3,8}|rgb\([^)]+\))/g) || [];
    colors.push(...props);
  }

  // Priority 4: CSS custom property hints (--color-primary, --brand-color, etc.)
  const cssVarPattern = /--(?:color|brand|primary|accent|main|theme)-[a-z-]*:\s*(#[0-9a-fA-F]{3,8})/gi;
  while ((m = cssVarPattern.exec(html)) !== null) {
    colors.push(m[1]);
  }

  // Priority 5: frequency-based hex extraction
  const hexMatches = html.match(/#[0-9a-fA-F]{6}\b/g) || [];
  const hexFreq = {};
  for (const hex of hexMatches) { hexFreq[hex] = (hexFreq[hex] || 0) + 1; }
  const topHex = Object.entries(hexFreq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([hex]) => hex);
  colors.push(...topHex);

  return [...new Set(colors)].slice(0, 8);
}

// ─── Extract client logos — 3 strategies ─────────────────────────────────────
function extractClientLogos(html, baseUrl) {
  const IMG_EXTS = /\.(png|jpg|jpeg|svg|webp)(\?[^"']*)?$/i;
  const logos = [];
  let m;

  // Strategy 1: sections with client/partner/logos class names
  const clientSectionRegex = /<(?:section|div|ul|article)[^>]+(?:class|id)=["'][^"']*(?:client|partner|logo|brand|trust|cliente|aliado|marca|sponsor)[^"']*["'][^>]*([\s\S]{0,8000}?)<\/(?:section|div|ul|article)>/gi;
  while ((m = clientSectionRegex.exec(html)) !== null) {
    const sectionImgs = m[1].match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi) || [];
    for (const imgTag of sectionImgs) {
      const srcMatch = /src=["']([^"']+)["']/.exec(imgTag);
      if (srcMatch && IMG_EXTS.test(srcMatch[1])) {
        const url = toAbsoluteUrl(srcMatch[1], baseUrl);
        if (url && !/icon|favicon|arrow|bullet|check|star|social/i.test(url)) {
          logos.push(url);
        }
      }
    }
  }

  // Strategy 2: images with path hints
  const logoPathRegex = /<img[^>]+src=["']([^"']*(?:\/logos?\/|\/clientes?\/|\/partners?\/|\/brands?\/|\/sponsors?\/|\/aliados?\/|\/marcas?\/|\/customers?\/)([^"']+))["'][^>]*>/gi;
  while ((m = logoPathRegex.exec(html)) !== null) {
    if (IMG_EXTS.test(m[1])) {
      const url = toAbsoluteUrl(m[1], baseUrl);
      if (url) logos.push(url);
    }
  }

  // Strategy 3: data-src lazy-loaded images in client sections
  const dataSrcLogos = /<(?:section|div)[^>]+(?:class|id)=["'][^"']*(?:client|partner|sponsor|trust)[^"']*["'][^>]*([\s\S]{0,5000}?)<\/(?:section|div)>/gi;
  while ((m = dataSrcLogos.exec(html)) !== null) {
    const lazySrcs = m[1].match(/data-src=["']([^"']+\.(?:png|jpg|jpeg|svg|webp)[^"']*)["']/gi) || [];
    for (const lazySrc of lazySrcs) {
      const srcMatch = /data-src=["']([^"']+)["']/.exec(lazySrc);
      if (srcMatch) {
        const url = toAbsoluteUrl(srcMatch[1], baseUrl);
        if (url) logos.push(url);
      }
    }
  }

  return [...new Set(logos)].slice(0, 20);
}

// ─── Section images with semantic scoring ────────────────────────────────────
function extractSectionImages(html, allImages, baseUrl) {
  const toAbs = (src) => src ? toAbsoluteUrl(src, baseUrl) : null;
  const section_images = {};

  // Hero — look for images near H1 tags (semantic scoring)
  const heroMatch = /<(?:section|div)[^>]*(?:class|id)=["'][^"']*(?:hero|banner|jumbotron|main-slide|slider|portada|wp-block-cover)[^"']*["'][^>]*([\s\S]{0,5000}?)<\/(?:section|div)>/i.exec(html);
  if (heroMatch) {
    const bgImg = /background(?:-image)?:\s*url\(['"]?([^'")\s]+)['"]?\)/i.exec(heroMatch[1]);
    const tagImg = /<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i.exec(heroMatch[1]);
    // Check if there's an H1 nearby — semantic scoring
    const hasH1 = /<h1[^>]*>/i.test(heroMatch[1]);
    section_images.hero = toAbs(bgImg?.[1]) || toAbs(tagImg?.[1]);
    section_images._heroHasH1 = hasH1;
  }

  // Semantic scoring: find images that appear within 500 chars of an H1/H2
  if (!section_images.hero) {
    const h1Match = /<h1[^>]*>[\s\S]{0,100}<\/h1>([\s\S]{0,500})/i.exec(html);
    if (h1Match) {
      const nearH1 = h1Match[1];
      const nearImg = /<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i.exec(nearH1);
      if (nearImg) section_images.hero = toAbs(nearImg[1]);
    }
  }

  // Fallback: first real image that isn't a logo
  if (!section_images.hero && allImages.length > 0) section_images.hero = allImages[0];

  // Team/about section
  const aboutMatch = /<(?:section|div)[^>]*(?:class|id)=["'][^"']*(?:about|nosotros|equipo|quienes|team)[^"']*["'][^>]*([\s\S]{0,5000}?)<\/(?:section|div)>/i.exec(html);
  if (aboutMatch) {
    const tagImg = /<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i.exec(aboutMatch[1]);
    section_images.team = toAbs(tagImg?.[1]);
    section_images.about = section_images.team; // alias
  }

  // Services section
  const servicesMatch = /<(?:section|div)[^>]*(?:class|id)=["'][^"']*(?:services?|servicios?|solutions?)[^"']*["'][^>]*([\s\S]{0,5000}?)<\/(?:section|div)>/i.exec(html);
  if (servicesMatch) {
    const tagImg = /<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i.exec(servicesMatch[1]);
    section_images.services = toAbs(tagImg?.[1]);
  }

  // CTA section — look for image near CTA/contact sections
  const ctaMatch = /<(?:section|div)[^>]*(?:class|id)=["'][^"']*(?:cta|call-to-action|contacto|contact|accion)[^"']*["'][^>]*([\s\S]{0,5000}?)<\/(?:section|div)>/i.exec(html);
  if (ctaMatch) {
    const bgImg = /background(?:-image)?:\s*url\(['"]?([^'")\s]+)['"]?\)/i.exec(ctaMatch[1]);
    const tagImg = /<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i.exec(ctaMatch[1]);
    section_images.cta = toAbs(bgImg?.[1]) || toAbs(tagImg?.[1]);
  }
  if (!section_images.cta && allImages.length > 1) {
    section_images.cta = allImages[Math.floor(allImages.length / 2)];
  }

  return section_images;
}

// ─── Enhanced testimonials extraction ────────────────────────────────────────
function extractTestimonials(markdown, html) {
  const testimonials = [];

  // Try structured HTML first — testimonial/review blocks
  const testimonialBlockRegex = /<(?:div|article|blockquote)[^>]+(?:class|id)=["'][^"']*(?:testimonial|review|opinion|quote)[^"']*["'][^>]*([\s\S]{0,2000}?)<\/(?:div|article|blockquote)>/gi;
  let m;
  while ((m = testimonialBlockRegex.exec(html)) !== null && testimonials.length < 6) {
    const block = m[1];
    // Extract quote text
    const quoteMatch = /<(?:p|blockquote|span)[^>]*>([\s\S]{20,400}?)<\/(?:p|blockquote|span)>/i.exec(block);
    const nameMatch = /<(?:strong|span|p|cite|h[3-6])[^>]*(?:class=["'][^"']*(?:name|author|client)[^"']*["'])?[^>]*>([^<]{2,50})<\/(?:strong|span|p|cite|h[3-6])>/i.exec(block);
    const companyMatch = /<(?:span|p|small)[^>]*(?:class=["'][^"']*(?:company|empresa|cargo|position|role)[^"']*["'])?[^>]*>([^<]{2,80})<\/(?:span|p|small)>/i.exec(block);

    if (quoteMatch) {
      const quote = quoteMatch[1].replace(/<[^>]+>/g, '').trim();
      if (quote.length > 20) {
        testimonials.push({
          quote,
          name: nameMatch ? nameMatch[1].replace(/<[^>]+>/g, '').trim() : 'Cliente satisfecho',
          company: companyMatch ? companyMatch[1].replace(/<[^>]+>/g, '').trim() : '',
          rating: 5,
        });
      }
    }
  }

  // Fallback: look for quoted strings in markdown near testimonial section keywords
  if (testimonials.length === 0) {
    const testimonialSection = markdown.match(/(?:testimonios?|testimonials?|opiniones?|clientes? dicen|lo que dicen)[:\s\n]+([\s\S]{0,3000})/i);
    if (testimonialSection) {
      const quotes = testimonialSection[1].match(/"([^"]{20,300})"/g) || [];
      quotes.slice(0, 4).forEach(q => {
        testimonials.push({
          quote: q.replace(/"/g, '').trim(),
          name: 'Cliente',
          company: '',
          rating: 5,
        });
      });
    }
  }

  return testimonials.slice(0, 6);
}

// ─── FAQ extraction ───────────────────────────────────────────────────────────
function extractFAQ(markdown, html) {
  const faq = [];

  // Try structured HTML — accordion/FAQ blocks
  const faqBlockRegex = /<(?:div|section)[^>]+(?:class|id)=["'][^"']*(?:faq|accordion|pregunta|question)[^"']*["'][^>]*([\s\S]{0,5000}?)<\/(?:div|section)>/gi;
  let m;
  while ((m = faqBlockRegex.exec(html)) !== null && faq.length < 8) {
    const block = m[1];
    const questionMatch = /<(?:h[2-6]|button|summary|dt|span)[^>]*>([\s\S]{10,200}?)<\/(?:h[2-6]|button|summary|dt|span)>/gi;
    const answerMatch = /<(?:p|div|dd)[^>]*>([\s\S]{20,500}?)<\/(?:p|div|dd)>/gi;
    let q, a;
    while ((q = questionMatch.exec(block)) !== null && faq.length < 8) {
      const question = q[1].replace(/<[^>]+>/g, '').trim();
      if (question.length < 10) continue;
      a = answerMatch.exec(block);
      const answer = a ? a[1].replace(/<[^>]+>/g, '').trim() : '';
      if (question.endsWith('?') || question.length > 15) {
        faq.push({ question, answer });
      }
    }
  }

  // Fallback: markdown FAQ section
  if (faq.length === 0) {
    const faqSection = markdown.match(/(?:preguntas frecuentes|faq|frequently asked)[:\s\n]+([\s\S]{0,3000})/i);
    if (faqSection) {
      const qPattern = /[#*]*\s*(.{10,200}\?)\s*\n+([^#*\n]{20,400})/g;
      while ((m = qPattern.exec(faqSection[1])) !== null && faq.length < 8) {
        faq.push({ question: m[1].trim(), answer: m[2].trim() });
      }
    }
  }

  return faq.slice(0, 8);
}

// ─── Navigation pages extraction ─────────────────────────────────────────────
function extractNavigationPages(html, baseUrl) {
  const navMatch = /<(?:nav|header)[^>]*>([\s\S]{0,5000}?)<\/(?:nav|header)>/i.exec(html);
  if (!navMatch) return ['/'];

  const pages = new Set(['/']);
  const linkRegex = /<a[^>]+href=["']([^"'#?]+)["'][^>]*>/gi;
  let m;
  while ((m = linkRegex.exec(navMatch[1])) !== null) {
    const href = m[1].trim();
    if (!href || href === '#' || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
    try {
      const parsed = new URL(href, baseUrl);
      // Only include same-domain pages
      const base = new URL(baseUrl);
      if (parsed.hostname === base.hostname) {
        pages.add(parsed.pathname);
      }
    } catch { /* ignore invalid URLs */ }
  }

  return [...pages].slice(0, 10);
}

// ─── Extract structured business data ────────────────────────────────────────
function extractBusinessData(markdown, html, metadata, url) {
  const text = markdown + ' ' + metadata.title + ' ' + metadata.description;

  const GENERIC_TITLES = ['uncategorized', 'home', 'inicio', 'blog', 'page', 'página', 'sin categoría', 'sin categoria', 'news', 'noticias', 'about', 'contact', 'contacto'];
  const titleParts = (metadata.title || '').split(/[\|—–\-·]/);
  const companyName = (
    titleParts.find(p => {
      const clean = p.trim().toLowerCase();
      return clean.length > 2 && !GENERIC_TITLES.includes(clean);
    }) ||
    titleParts[0] ||
    (url.match(/(?:https?:\/\/)?(?:www\.)?([^./]+)/)?.[1] || 'Empresa')
  ).trim();

  // Key services
  const servicesSection = markdown.match(/(?:servicios|productos|soluciones|services|products)[:\s\n]+([\s\S]{0,1000})/i);
  const key_services = [];
  if (servicesSection) {
    const items = servicesSection[1].match(/[-*•]\s*(.+)/g) || [];
    items.slice(0, 8).forEach(item => {
      const name = item.replace(/^[-*•]\s*/, '').trim();
      if (name.length > 3 && name.length < 100) key_services.push({ name, description: name });
    });
  }

  // Impact numbers
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
      if (!isNaN(numericVal) && numericVal > 0) {
        impact_numbers.push({ value: rawVal, label: numLabels[idx] });
      }
    }
  });

  // Contact info
  const emailMatch = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/);

  // Navigation items
  const navMatch = /<(?:nav|header)[^>]*>([\s\S]{0,3000}?)<\/(?:nav|header)>/i.exec(html);
  const nav_items = [];
  if (navMatch) {
    const navLinks = navMatch[1].matchAll(/<a[^>]*>([^<]{2,30})<\/a>/gi);
    for (const link of navLinks) {
      const text = link[1].trim();
      if (text.length >= 2 && text.length <= 25 && !/logo|icon|img/i.test(text)) nav_items.push(text);
    }
  }

  return {
    company_name: companyName,
    key_services,
    impact_numbers: impact_numbers.slice(0, 4),
    contact_email: emailMatch ? emailMatch[0] : null,
    contact_phone: phoneMatch ? phoneMatch[0] : null,
    nav_items: nav_items.slice(0, 6),
  };
}

// ─── Firecrawl multi-page CRAWL (deep — up to 15 pages) ──────────────────────
async function crawlDeepWithFirecrawl(url) {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error('FIRECRAWL_API_KEY not set');

  console.log('  → Starting deep Firecrawl crawl (up to 15 pages)...');

  const startRes = await fetch('https://api.firecrawl.dev/v1/crawl', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      limit: 15,
      scrapeOptions: {
        formats: ['markdown', 'html'],
        includeTags: ['title', 'meta', 'h1', 'h2', 'h3', 'h4', 'p', 'img', 'a', 'section',
                      'nav', 'header', 'footer', 'blockquote', 'ul', 'ol', 'dl'],
      },
    }),
  });

  if (!startRes.ok) {
    const err = await startRes.text();
    throw new Error(`Firecrawl crawl start error ${startRes.status}: ${err}`);
  }

  const { id: crawlId } = await startRes.json();
  if (!crawlId) throw new Error('No crawlId returned from Firecrawl');

  console.log(`  → Deep crawl started: ${crawlId}. Polling...`);

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  for (let i = 0; i < 18; i++) {
    await sleep(5000);
    const statusRes = await fetch(`https://api.firecrawl.dev/v1/crawl/${crawlId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    if (!statusRes.ok) continue;
    const status = await statusRes.json();
    if (status.status === 'completed') {
      const pages = status.data || [];
      console.log(`  ✓ Deep crawl completado: ${pages.length} páginas scrapeadas`);
      return pages;
    }
    console.log(`  → Progreso: ${status.completed || 0}/${status.total || '?'} páginas...`);
  }

  throw new Error('Deep crawl timed out after 90s');
}

// ─── Firecrawl single-page SCRAPE (fallback) ─────────────────────────────────
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

// ─── Main export — scrapeDeep ─────────────────────────────────────────────────
export async function scrapeDeep(url) {
  console.log(`\n🔍 scrapeDeep (multi-página, hasta 15): ${url}`);

  let pages = [];
  let source = 'fallback';

  // Try deep crawl first
  try {
    console.log('  → Trying deep Firecrawl crawl (15 pages)...');
    pages = await crawlDeepWithFirecrawl(url);
    source = 'firecrawl_crawl_deep';
    console.log('  ✓ Deep Firecrawl crawl OK');
  } catch (crawlErr) {
    console.log(`  ✗ Deep crawl failed: ${crawlErr.message}`);
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

  // Detect industry and personality from content
  const textForDetection = allMarkdown + ' ' + primaryMeta.title + ' ' + primaryMeta.description;
  const industria = detectIndustry(textForDetection);
  const personality = detectPersonality(textForDetection);

  console.log(`  🏭 Industria detectada: ${industria}`);
  console.log(`  🎭 Personalidad de marca: ${personality}`);

  // Extract visual assets
  console.log('  🎨 Extrayendo assets visuales (enhanced)...');
  const logoUrl = extractLogoUrl(allHtml, url);
  const colors = extractColors(allHtml);
  const clientLogos = extractClientLogos(allHtml, url);

  // Google Fonts
  const gFontsMatch = /<link[^>]+href=["'](https:\/\/fonts\.googleapis\.com[^"']+)["'][^>]*>/gi.exec(allHtml);
  const googleFontsUrl = gFontsMatch ? gFontsMatch[1] : null;
  const fontFamilyMatches = allHtml.match(/font-family:\s*['"]?([^;,"']+)/gi) || [];
  const fonts = [...new Set(
    fontFamilyMatches
      .map(f => f.replace(/font-family:\s*['"]?/i, '').trim())
      .filter(f => f && !f.startsWith('-') && f.length > 2 && f.length < 40)
  )].slice(0, 4);

  // Images
  let m;
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const imgUrls = [];
  while ((m = imgRegex.exec(allHtml)) !== null) {
    const imgUrl = toAbsoluteUrl(m[1], url);
    if (!imgUrl) continue;
    if (/icon|favicon|sprite|badge|arrow|chevron|close|menu|star|check|bullet/i.test(imgUrl)) continue;
    imgUrls.push(imgUrl);
  }
  const bgImgRegex = /background(?:-image)?:\s*url\(['"]?([^'")\s]+)['"]?\)/gi;
  while ((m = bgImgRegex.exec(allHtml)) !== null) {
    const bgUrl = toAbsoluteUrl(m[1], url);
    if (bgUrl && !/icon|favicon|sprite/i.test(bgUrl)) imgUrls.push(bgUrl);
  }
  const images = [...new Set(imgUrls)].slice(0, 20);

  // Videos
  const videos = [];
  const iframeRegex = /<iframe[^>]+src=["']([^"']*(?:youtube|vimeo)[^"']*)["'][^>]*>/gi;
  while ((m = iframeRegex.exec(allHtml)) !== null) videos.push(m[1]);

  const assets = {
    logo_url: logoUrl,
    colors,
    fonts,
    google_fonts_url: googleFontsUrl,
    images,
    client_logos: clientLogos,
    videos,
    section_images: extractSectionImages(allHtml, images, url),
  };

  console.log(`     Logo: ${assets.logo_url ? '✅ ' + assets.logo_url.slice(0, 60) : '❌ no detectado'}`);
  console.log(`     Colores: ${assets.colors.length > 0 ? '✅ ' + assets.colors.slice(0, 4).join(', ') : '❌ ninguno'}`);
  console.log(`     Fuentes: ${assets.fonts.length > 0 ? '✅ ' + assets.fonts.slice(0, 2).join(', ') : '❌ ninguna'}`);
  console.log(`     Imágenes reales: ${assets.images.length}`);
  console.log(`     Logos clientes: ${assets.client_logos.length}`);

  // Enhanced: testimonials, FAQ, navigation pages
  console.log('  📝 Extrayendo testimonials, FAQ, navegación...');
  const testimonials = extractTestimonials(allMarkdown, allHtml);
  const faq = extractFAQ(allMarkdown, allHtml);
  const navigationPages = extractNavigationPages(allHtml, url);

  console.log(`     Testimonials: ${testimonials.length}`);
  console.log(`     FAQ items: ${faq.length}`);
  console.log(`     Páginas de navegación: ${navigationPages.length}`);

  // Extract structured business data
  const business = extractBusinessData(allMarkdown, allHtml, primaryMeta, url);
  console.log(`  🏢 Empresa: ${business.company_name}`);
  console.log(`  📋 Servicios detectados: ${business.key_services.length}`);
  console.log(`  📊 Números de impacto: ${business.impact_numbers.length}`);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  // ── Build structured content sections from markdown (replaces raw markdown) ──
  // Each section: { id, title, body (max 200 chars), image_url }
  const sectionBlocks = allMarkdown.split(/\n(?=#{1,2}\s)/);
  const contentSections = sectionBlocks.slice(0, 10).map((block, idx) => {
    const titleMatch = block.match(/^#{1,2}\s+(.+)/);
    const title = titleMatch ? titleMatch[1].replace(/\*+/g, '').trim() : '';
    const body = block.replace(/^#{1,3}.+\n?/, '').replace(/[#*`]/g, '').trim().slice(0, 200);
    const imgMatch = block.match(/!\[.*?\]\((https?:\/\/[^)]+)\)/);
    return {
      id: `section-${idx}`,
      title: title.slice(0, 80),
      body,
      image_url: imgMatch ? imgMatch[1] : (images[idx] || null),
    };
  }).filter(s => s.title || s.body);

  // Extract hero text (first meaningful paragraph after H1)
  const heroTextMatch = allMarkdown.match(/^#\s+(.+)\n+([\s\S]{20,300}?)(?=\n#|\n\n\n|$)/m);
  const heroText = heroTextMatch
    ? { h1: heroTextMatch[1].trim().slice(0, 100), intro: heroTextMatch[2].trim().slice(0, 200) }
    : { h1: business.company_name, intro: primaryMeta.description || '' };

  // Extract value proposition — first substantial paragraph
  const valuePropMatch = allMarkdown.match(/(?:somos|we are|empresa|company|especializ|proveemos|ofrecemos)[^\n]{20,300}/i);
  const valueProp = (valuePropMatch?.[0] || primaryMeta.description || '').slice(0, 200);

  // Text preview for agent analysis — assembled from key content (max 2KB)
  const textPreview = [
    heroText.h1,
    heroText.intro,
    ...contentSections.slice(0, 5).map(s => `${s.title}: ${s.body}`),
    business.key_services.slice(0, 3).map(s => s.name).join(', '),
  ].filter(Boolean).join('\n').slice(0, 2000);

  const output = {
    url,
    timestamp,
    source,
    pages_scraped: pages.length,
    markdown_full_length: allMarkdown.length,
    // Kept for backwards compat with agents that read scrapingData.markdown
    markdown: textPreview,
    metadata: {
      title: primaryMeta.title || '',
      description: primaryMeta.description || '',
      ogImage: primaryMeta.ogImage || '',
    },
    industria_detectada: industria,
    // ── Structured brand (replaces raw color arrays) ──────────────────────────
    brand: {
      name: business.company_name,
      personality,
      colors: {
        primary: assets.colors.filter(c => {
          const r=parseInt(c.slice(1,3),16),g=parseInt(c.slice(3,5),16),b=parseInt(c.slice(5,7),16);
          const max=Math.max(r,g,b); const sat=max===0?0:(max-Math.min(r,g,b))/max;
          return sat>=0.15 && (r+g+b)/3 <= 220;
        })[0] || null,
        secondary: assets.colors[1] || null,
        accent: assets.colors[2] || null,
      },
      fonts: {
        heading: assets.fonts[0] || null,
        body: assets.fonts[1] || assets.fonts[0] || null,
      },
    },
    // ── Structured business data ──────────────────────────────────────────────
    business: {
      industry: industria,
      company_name: business.company_name,
      value_proposition: valueProp,
      key_services: business.key_services,
      differentiators: [],
      impact_numbers: business.impact_numbers,
      cta_text: business.key_services[0]?.name ? `Cotizar ${business.key_services[0].name}` : 'Contáctanos',
      contact_email: business.contact_email,
      contact_phone: business.contact_phone,
      nav_items: business.nav_items,
      testimonials,
    },
    // ── Structured content (replaces raw markdown) ───────────────────────────
    content: {
      hero_text: heroText,
      sections: contentSections,
      // Compact text preview for agent analysis (max 2KB)
      text_preview: textPreview,
    },
    // ── Compact assets (max 5 gallery images) ────────────────────────────────
    assets: {
      logo_url: assets.logo_url,
      colors: assets.colors,
      fonts: assets.fonts,
      google_fonts_url: assets.google_fonts_url,
      hero: assets.section_images?.hero || assets.images[0] || null,
      cta: assets.section_images?.cta || null,
      clients: assets.client_logos.slice(0, 8),
      gallery: assets.images.slice(0, 5),
      // Keep full images array for backwards compat
      images: assets.images,
      client_logos: assets.client_logos,
      section_images: assets.section_images,
    },
    testimonials,
    faq,
    navigation_pages: navigationPages,
  };

  const outPath = path.join(PROJECT_ROOT, 'memory', 'working', `scraping-deep-${timestamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`  💾 Guardado en: memory/working/scraping-deep-${timestamp}.json`);

  return output;
}

// CLI mode
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const url = process.argv[2];
  if (!url) { console.error('Usage: node scripts/agents/scraper-pro.js <URL>'); process.exit(1); }
  scrapeDeep(url).catch(err => { console.error(err); process.exit(1); });
}
