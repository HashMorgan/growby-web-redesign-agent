/**
 * quick-scrape.js — Deep scraping v3.6.0
 * Usa Firecrawl API para scraping avanzado (renderiza JS, extrae markdown)
 * Fallback: fetch nativo si Firecrawl no disponible
 */

import 'dotenv/config';

/**
 * Scraping profundo de una URL usando Firecrawl API
 * @param {string} url - URL a scrapear
 * @returns {Promise<object>} Datos completos del sitio
 */
export async function quickScrape(url) {
  console.log(`\n🔍 Deep scraping: ${url}`);

  // Intentar con Firecrawl API primero
  if (process.env.FIRECRAWL_API_KEY) {
    try {
      const result = await scrapeWithFirecrawl(url);
      console.log(`   ✅ Firecrawl API usado`);
      return result;
    } catch (error) {
      console.warn(`   ⚠️ Firecrawl failed: ${error.message}, usando fallback...`);
    }
  }

  // Fallback a fetch nativo
  return await scrapeWithFetch(url);
}

/**
 * Scraping con Firecrawl API (avanzado)
 */
async function scrapeWithFirecrawl(url) {
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`
    },
    body: JSON.stringify({
      url,
      formats: ['markdown', 'html']
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Firecrawl API error: ${response.status} - ${error.error?.message || 'Unknown'}`);
  }

  const data = await response.json();

  // Extraer datos del response de Firecrawl
  const markdown = data.data?.markdown || '';
  const html = data.data?.html || '';
  const metadata = data.data?.metadata || {};

  // Extraer información usando las funciones existentes
  const title = metadata.title || extractTag(html, 'title');
  const description = metadata.description || extractMeta(html, 'description');
  const ogImage = metadata.ogImage || null;

  const brandName = extractBrandName(html, url, title, metadata);
  const industry = detectIndustry(markdown + ' ' + html, title, description);
  const colors = extractColors(html);
  const logoUrl = ogImage || extractLogo(html, url);
  const services = extractServices(markdown, html);
  const valueProposition = extractValueProposition(markdown, description);
  const headings = extractHeadings(markdown);

  const result = {
    url,
    title,
    description,
    brand: {
      name: brandName,
      logo: logoUrl,
      colors: {
        primary: colors[0] || '#5D55D7',
        secondary: colors[1] || '#FFCC00',
        all: colors
      }
    },
    business: {
      industry,
      key_services: services.slice(0, 5),
      value_proposition: valueProposition,
      keywords: metadata.keywords ? metadata.keywords.split(',').map(k => k.trim()).slice(0, 10) : []
    },
    content: {
      headings: {
        h1: headings.h1.slice(0, 3),
        h2: headings.h2.slice(0, 5)
      }
    },
    markdown: markdown.substring(0, 5000), // Guardar primeros 5000 chars de markdown
    scrapedAt: new Date().toISOString()
  };

  console.log(`   ✅ Brand: ${brandName}`);
  console.log(`   ✅ Industry: ${industry}`);
  console.log(`   ✅ Colors: ${colors.slice(0, 3).join(', ')}`);
  console.log(`   ✅ Services: ${services.slice(0, 3).join(', ')}`);

  return result;
}

/**
 * Scraping con fetch nativo (fallback)
 */
async function scrapeWithFetch(url) {
  console.log(`   ⚠️ Usando fetch nativo (sin Firecrawl)`);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // Extraer datos usando funciones existentes
    const title = extractTag(html, 'title');
    const description = extractMeta(html, 'description');
    const keywords = extractMeta(html, 'keywords');

    const brandName = extractBrandName(html, url, title);
    const industry = detectIndustry(html, title, description);
    const colors = extractColors(html);
    const logoUrl = extractLogo(html, url);
    const services = extractServices('', html); // Sin markdown, solo HTML
    const valueProposition = extractValueProposition('', description);
    const headings = extractHeadings(html);

    const result = {
      url,
      title,
      description,
      brand: {
        name: brandName,
        logo: logoUrl,
        colors: {
          primary: colors[0] || '#5D55D7',
          secondary: colors[1] || '#FFCC00',
          all: colors
        }
      },
      business: {
        industry,
        key_services: services.slice(0, 5),
        value_proposition: valueProposition,
        keywords: keywords ? keywords.split(',').map(k => k.trim()).slice(0, 10) : []
      },
      content: {
        headings: {
          h1: headings.h1.slice(0, 3),
          h2: headings.h2.slice(0, 5)
        }
      },
      scrapedAt: new Date().toISOString()
    };

    console.log(`   ✅ Brand: ${brandName}`);
    console.log(`   ✅ Industry: ${industry}`);
    console.log(`   ✅ Colors: ${colors.slice(0, 3).join(', ')}`);
    console.log(`   ✅ Services: ${services.slice(0, 3).join(', ')}`);

    return result;

  } catch (error) {
    console.warn(`   ⚠️ Fetch failed: ${error.message}`);

    // Fallback mínimo
    const domain = url.replace(/https?:\/\/(www\.)?/, '').split('/')[0];
    return {
      url,
      title: domain,
      description: '',
      brand: {
        name: domain,
        logo: null,
        colors: { primary: '#5D55D7', secondary: '#FFCC00', all: [] }
      },
      business: {
        industry: 'servicios profesionales',
        key_services: [],
        value_proposition: '',
        keywords: []
      },
      content: { headings: { h1: [], h2: [] } },
      scrapedAt: new Date().toISOString()
    };
  }
}

// ══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS (reutilizadas de v3.4.0)
// ══════════════════════════════════════════════════════════════

function extractTag(html, tag) {
  const match = html.match(new RegExp(`<${tag}[^>]*>([^<]+)<\/${tag}>`, 'i'));
  return match ? match[1].trim() : '';
}

function extractMeta(html, name) {
  const match = html.match(new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']+)["']`, 'i'));
  return match ? match[1].trim() : '';
}

function extractBrandName(html, url, title, metadata = {}) {
  // 1. Metadata de Firecrawl (si disponible)
  if (metadata.siteName) return metadata.siteName;

  // 2. Buscar en meta og:site_name
  const ogSite = html.match(/<meta\s+property=["']og:site_name["']\s+content=["']([^"']+)["']/i);
  if (ogSite) return ogSite[1].trim();

  // 3. Buscar en JSON-LD
  const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const data = JSON.parse(jsonLdMatch[1]);
      if (data.name) return data.name;
      if (data['@graph'] && data['@graph'][0]?.name) return data['@graph'][0].name;
    } catch (e) {}
  }

  // 4. Extraer del title (antes del |, -, : o ·)
  const titleParts = title.split(/[\|\-\:·]/);
  if (titleParts.length > 1) {
    const candidate = titleParts[0].trim();
    if (candidate.length > 2 && candidate.length < 50) {
      return candidate;
    }
  }

  // 5. Fallback: domain
  return url.replace(/https?:\/\/(www\.)?/, '').split('/')[0].split('.')[0];
}

function detectIndustry(text, title, description) {
  const combined = (title + ' ' + description + ' ' + text.substring(0, 5000)).toLowerCase();

  const industries = {
    'construcción': ['construcción', 'construccion', 'constructora', 'inmobiliaria', 'proyectos inmobiliarios', 'vivienda', 'edificación'],
    'legal': ['abogados', 'estudio jurídico', 'legal', 'derecho', 'asesoría legal', 'consultoria legal'],
    'salud': ['clínica', 'hospital', 'médico', 'salud', 'tratamiento', 'pacientes', 'consulta médica'],
    'tecnología': ['software', 'desarrollo', 'tecnología', 'soluciones digitales', 'sistemas', 'apps', 'web'],
    'educación': ['educación', 'universidad', 'instituto', 'colegio', 'cursos', 'capacitación', 'formación'],
    'consultoría': ['consultoría', 'consulting', 'asesoría', 'estrategia', 'gestión', 'advisory'],
    'financiero': ['banco', 'finanzas', 'inversiones', 'crédito', 'financiero', 'capital'],
    'retail': ['tienda', 'productos', 'ventas', 'catálogo', 'comprar', 'ecommerce'],
    'servicios': ['servicios', 'soluciones', 'especialistas', 'profesionales'],
  };

  for (const [industry, keywords] of Object.entries(industries)) {
    if (keywords.some(kw => combined.includes(kw))) {
      return industry;
    }
  }

  return 'servicios profesionales';
}

function extractColors(html) {
  const colors = new Set();

  // 1. Buscar colores en CSS variables
  const cssVarMatch = html.matchAll(/--[a-z\-]+:\s*(#[0-9a-f]{3,6})/gi);
  for (const match of cssVarMatch) {
    colors.add(normalizeHex(match[1]));
  }

  // 2. Buscar colores en inline styles
  const styleMatch = html.matchAll(/style=["'][^"']*background[^:]*:\s*(#[0-9a-f]{3,6})/gi);
  for (const match of styleMatch) {
    colors.add(normalizeHex(match[1]));
  }

  // 3. Buscar colores en style tags
  const styleTagMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
  if (styleTagMatch) {
    for (const styleTag of styleTagMatch) {
      const hexMatches = styleTag.matchAll(/#([0-9a-f]{3,6})\b/gi);
      for (const match of hexMatches) {
        colors.add(normalizeHex('#' + match[1]));
      }
    }
  }

  // Filtrar colores comunes (blanco, negro, grises)
  const filtered = Array.from(colors).filter(color => {
    const c = color.toLowerCase();
    return !['#fff', '#ffffff', '#000', '#000000', '#333', '#666', '#999', '#ccc', '#eee', '#f5f5f5'].includes(c);
  });

  return filtered.slice(0, 5);
}

function normalizeHex(hex) {
  hex = hex.toLowerCase().trim();
  // Convertir #abc a #aabbcc
  if (hex.length === 4) {
    hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  return hex;
}

function extractLogo(html, url) {
  // 1. og:image
  const ogImage = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
  if (ogImage) {
    const logoUrl = ogImage[1].trim();
    if (logoUrl.includes('logo')) return makeAbsoluteUrl(logoUrl, url);
  }

  // 2. Buscar <img> con alt="logo" o src que contenga "logo"
  const imgMatch = html.match(/<img[^>]+(?:alt=["'][^"']*logo[^"']*["']|src=["'][^"']*logo[^"']*["'])[^>]*>/i);
  if (imgMatch) {
    const srcMatch = imgMatch[0].match(/src=["']([^"']+)["']/i);
    if (srcMatch) return makeAbsoluteUrl(srcMatch[1], url);
  }

  // 3. Favicon
  const faviconMatch = html.match(/<link[^>]+rel=["'](?:icon|shortcut icon)["'][^>]+href=["']([^"']+)["']/i);
  if (faviconMatch) return makeAbsoluteUrl(faviconMatch[1], url);

  return null;
}

function makeAbsoluteUrl(relativeUrl, baseUrl) {
  if (relativeUrl.startsWith('http')) return relativeUrl;
  if (relativeUrl.startsWith('//')) return 'https:' + relativeUrl;

  const base = new URL(baseUrl);
  if (relativeUrl.startsWith('/')) {
    return base.origin + relativeUrl;
  }
  return base.origin + '/' + relativeUrl;
}

function extractServices(markdown, html) {
  const services = new Set();

  // 1. Extraer de markdown (mejor que HTML porque Firecrawl limpia el contenido)
  if (markdown) {
    // Buscar listas markdown: - Item, * Item
    const mdListItems = markdown.matchAll(/^[\-\*]\s+(.+)$/gm);
    for (const match of mdListItems) {
      const text = match[1].trim();
      if (text.length > 5 && text.length < 100 && !text.includes('©')) {
        services.add(text);
      }
    }

    // Buscar headings ## y ### que sean servicios
    const mdHeadings = markdown.matchAll(/^##\s+(.+)$/gm);
    for (const match of mdHeadings) {
      const text = match[1].trim();
      if (text.length > 5 && text.length < 60) {
        services.add(text);
      }
    }
  }

  // 2. Buscar en HTML (fallback)
  const listItems = html.matchAll(/<li[^>]*>([^<]+)<\/li>/gi);
  for (const match of listItems) {
    const text = match[1].trim();
    if (text.length > 5 && text.length < 100 && !text.includes('©')) {
      services.add(text);
    }
  }

  const headings = html.matchAll(/<h[23][^>]*>([^<]+)<\/h[23]>/gi);
  for (const match of headings) {
    const text = match[1].trim();
    if (text.length > 5 && text.length < 60) {
      services.add(text);
    }
  }

  return Array.from(services).slice(0, 10);
}

function extractValueProposition(markdown, description) {
  // 1. Meta description (más confiable)
  if (description && description.length > 20) {
    return description;
  }

  // 2. Buscar en markdown (primer párrafo significativo)
  if (markdown) {
    const paragraphs = markdown.split('\n\n');
    for (const p of paragraphs) {
      const cleaned = p.trim().replace(/^[#\-\*>\s]+/, '');
      if (cleaned.length > 30 && cleaned.length < 300) {
        return cleaned.substring(0, 200);
      }
    }
  }

  return '';
}

function extractHeadings(markdownOrHtml) {
  const h1s = [];
  const h2s = [];

  // Si es markdown, buscar ## y ###
  if (markdownOrHtml.includes('##')) {
    const h1Matches = markdownOrHtml.matchAll(/^#\s+(.+)$/gm);
    for (const match of h1Matches) {
      h1s.push(match[1].trim());
    }

    const h2Matches = markdownOrHtml.matchAll(/^##\s+(.+)$/gm);
    for (const match of h2Matches) {
      h2s.push(match[1].trim());
    }
  } else {
    // Si es HTML, buscar <h1> y <h2>
    const h1Matches = markdownOrHtml.matchAll(/<h1[^>]*>([^<]+)<\/h1>/gi);
    for (const match of h1Matches) {
      h1s.push(match[1].trim());
    }

    const h2Matches = markdownOrHtml.matchAll(/<h2[^>]*>([^<]+)<\/h2>/gi);
    for (const match of h2Matches) {
      h2s.push(match[1].trim());
    }
  }

  return { h1: h1s, h2: h2s };
}
