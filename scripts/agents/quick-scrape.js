/**
 * quick-scrape.js — Deep scraping v3.4.0
 * Extrae: brand, business, assets, colors reales del sitio
 */

/**
 * Scraping profundo de una URL
 * @param {string} url - URL a scrapear
 * @returns {Promise<object>} Datos completos del sitio
 */
export async function quickScrape(url) {
  console.log(`\n🔍 Deep scraping: ${url}`);

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

    // 1. Extraer metadatos básicos
    const title = extractTag(html, 'title');
    const description = extractMeta(html, 'description');
    const keywords = extractMeta(html, 'keywords');

    // 2. Extraer nombre de la empresa
    const brandName = extractBrandName(html, url, title);

    // 3. Detectar industria del contenido
    const industry = detectIndustry(html, title, description);

    // 4. Extraer colores del sitio
    const colors = extractColors(html);

    // 5. Extraer logo
    const logoUrl = extractLogo(html, url);

    // 6. Extraer servicios/productos mencionados
    const services = extractServices(html);

    // 7. Extraer propuesta de valor
    const valueProposition = extractValueProposition(html, description);

    // 8. Extraer headings principales
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
    console.warn(`   ⚠️ Scraping failed: ${error.message}`);

    // Fallback básico
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
        industry: 'general',
        key_services: [],
        value_proposition: '',
        keywords: []
      },
      content: { headings: { h1: [], h2: [] } },
      scrapedAt: new Date().toISOString()
    };
  }
}

// Helper functions

function extractTag(html, tag) {
  const match = html.match(new RegExp(`<${tag}[^>]*>([^<]+)<\/${tag}>`, 'i'));
  return match ? match[1].trim() : '';
}

function extractMeta(html, name) {
  const match = html.match(new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']+)["']`, 'i'));
  return match ? match[1].trim() : '';
}

function extractBrandName(html, url, title) {
  // 1. Buscar en meta og:site_name
  const ogSite = html.match(/<meta\s+property=["']og:site_name["']\s+content=["']([^"']+)["']/i);
  if (ogSite) return ogSite[1].trim();

  // 2. Buscar en JSON-LD
  const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const data = JSON.parse(jsonLdMatch[1]);
      if (data.name) return data.name;
      if (data['@graph'] && data['@graph'][0]?.name) return data['@graph'][0].name;
    } catch (e) {}
  }

  // 3. Extraer del title (antes del |, -, : o ·)
  const titleParts = title.split(/[\|\-\:·]/);
  if (titleParts.length > 1) {
    const candidate = titleParts[0].trim();
    if (candidate.length > 2 && candidate.length < 50) {
      return candidate;
    }
  }

  // 4. Fallback: domain
  return url.replace(/https?:\/\/(www\.)?/, '').split('/')[0].split('.')[0];
}

function detectIndustry(html, title, description) {
  const text = (title + ' ' + description + ' ' + html.substring(0, 5000)).toLowerCase();

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
    if (keywords.some(kw => text.includes(kw))) {
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

function extractServices(html) {
  const services = new Set();

  // Buscar listas <ul> o <li> que puedan ser servicios
  const listItems = html.matchAll(/<li[^>]*>([^<]+)<\/li>/gi);
  for (const match of listItems) {
    const text = match[1].trim();
    if (text.length > 5 && text.length < 100 && !text.includes('©')) {
      services.add(text);
    }
  }

  // Buscar headings h2/h3 que sean cortos (posibles servicios)
  const headings = html.matchAll(/<h[23][^>]*>([^<]+)<\/h[23]>/gi);
  for (const match of headings) {
    const text = match[1].trim();
    if (text.length > 5 && text.length < 60) {
      services.add(text);
    }
  }

  return Array.from(services).slice(0, 10);
}

function extractValueProposition(html, description) {
  // 1. Meta description suele ser buena propuesta de valor
  if (description && description.length > 20) {
    return description;
  }

  // 2. Buscar primer <p> después del hero/header
  const firstPMatch = html.match(/<p[^>]*>([^<]{30,200})<\/p>/i);
  if (firstPMatch) {
    return firstPMatch[1].trim();
  }

  return '';
}

function extractHeadings(html) {
  const h1s = [];
  const h2s = [];

  const h1Matches = html.matchAll(/<h1[^>]*>([^<]+)<\/h1>/gi);
  for (const match of h1Matches) {
    const text = match[1].trim();
    if (text.length > 3) h1s.push(text);
  }

  const h2Matches = html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/gi);
  for (const match of h2Matches) {
    const text = match[1].trim();
    if (text.length > 3) h2s.push(text);
  }

  return { h1: h1s, h2: h2s };
}
