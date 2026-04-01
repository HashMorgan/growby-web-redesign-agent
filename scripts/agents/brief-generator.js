/**
 * brief-generator.js
 *
 * Convierte el analysis.json completo en un prompt optimizado para Stitch MCP.
 * Objetivo: máximo 500 caracteres, información esencial del negocio.
 */

/**
 * Genera un brief conciso para Stitch basado en el análisis completo
 *
 * @param {object} analysis - Full analysis object from orchestrator
 * @returns {string} Brief optimizado para Stitch (max 500 chars)
 */
export function generateBrief(analysis) {
  // Extraer información esencial
  const company = analysis.scraping?.business?.company_name
    || analysis.scraping?.brand?.name
    || 'Empresa';

  const industry = analysis.meta?.industria || 'servicios';

  // Extraer colores (brand colors si existen, sino del design system)
  const brandColors = analysis.scraping?.assets?.colors || [];
  const dsColors = analysis.ui_analysis?.design_system?.palette || {};
  const primaryColor = brandColors[0] || dsColors.primary || '#000000';
  const secondaryColor = brandColors[1] || dsColors.secondary || '#FFFFFF';
  const accentColor = brandColors[2] || dsColors.accent || '#0066CC';

  // Servicios principales (top 3)
  const allServices = analysis.scraping?.business?.key_services || [];
  const services = allServices.slice(0, 3).join(', ');

  // Propuesta de valor
  const valueProposition = analysis.scraping?.business?.value_proposition
    || analysis.seo_copy_analysis?.rewritten_copy?.h1
    || `Soluciones profesionales de ${industry}`;

  // Estilo visual del design system
  const visualStyle = analysis.ui_analysis?.design_system?.visual_style || 'modern professional';

  // Personalidad de marca
  const brandPersonality = analysis.scraping?.brand?.personality || 'professional';

  // Construir brief
  const brief = `Landing page para ${company}. Industria: ${industry}. Colores: primary ${primaryColor}, secondary ${secondaryColor}, accent ${accentColor}. Servicios: ${services}. Propuesta de valor: "${valueProposition}". Estilo: ${visualStyle}, ${brandPersonality}. Idioma: español. Incluir hero con CTA, sección de servicios, testimonios si disponibles, y formulario de contacto.`;

  // Si excede 500 chars, truncar inteligentemente
  if (brief.length > 500) {
    const shortBrief = `Landing ${company}. ${industry}. Colores: ${primaryColor}, ${secondaryColor}. Servicios: ${services.split(',')[0]}. ${visualStyle}. Español. Hero + servicios + contacto.`;
    return shortBrief.slice(0, 500);
  }

  return brief;
}

/**
 * Genera metadata adicional para contexto de Stitch
 *
 * @param {object} analysis - Full analysis object
 * @returns {object} Metadata estructurada
 */
export function generateMetadata(analysis) {
  return {
    company: analysis.scraping?.business?.company_name || 'Empresa',
    industry: analysis.meta?.industria || 'general',
    url: analysis.meta?.url || '',
    has_logo: !!analysis.scraping?.assets?.logo_url,
    has_testimonials: (analysis.testimonials?.length || 0) > 0,
    has_faq: (analysis.faq?.length || 0) > 0,
    client_logos_count: analysis.scraping?.assets?.client_logos?.length || 0,
    color_palette: {
      primary: analysis.scraping?.assets?.colors?.[0] || null,
      secondary: analysis.scraping?.assets?.colors?.[1] || null,
      accent: analysis.scraping?.assets?.colors?.[2] || null,
    },
    design_system: {
      style: analysis.ui_analysis?.design_system?.visual_style || 'modern',
      heading_font: analysis.ui_analysis?.design_system?.typography?.heading_font || 'Inter',
      body_font: analysis.ui_analysis?.design_system?.typography?.body_font || 'Inter',
    }
  };
}
