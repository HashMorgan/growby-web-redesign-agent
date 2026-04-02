/**
 * seo-copy-agent.js — SEO + Copy Agent
 * v3.5.0 — Basado en principios de skills/copywriting/ + skills/seo-audit/
 *
 * Extrae de copywriting SKILL.md:
 * - Clarity > Cleverness
 * - Benefits > Features
 * - Specificity > Vagueness (números, timeframes)
 * - Customer Language (no jargon)
 * - Headline formulas: outcome-focused, specific, social proof
 *
 * Extrae de seo-audit SKILL.md:
 * - Title: 50-60 chars, keyword al inicio
 * - Meta description: 150-160 chars, keyword + CTA
 * - H1: único, contiene primary keyword
 * - Heading hierarchy: H1 → H2 → H3 (no skip levels)
 */

// ══════════════════════════════════════════════════════════════
// COPY TEMPLATES POR INDUSTRIA
// Basados en principios de copywriting skill (benefits-driven, specific, clear)
// ══════════════════════════════════════════════════════════════

const COPY_TEMPLATES = {
  // ── Legal (Abogados) ──
  legal: {
    h1_formulas: [
      'Protege tus derechos con asesoría legal especializada',
      'Resuelve tu caso legal con abogados de confianza',
      'Asesoría jurídica que defiende tus intereses',
    ],
    subheadline: 'Abogados especializados en [área] con +[X] años de experiencia. Consulta inicial gratuita.',
    value_section_h2: '¿Por qué elegirnos?',
    value_section_body: 'Experiencia comprobada, atención personalizada y resultados reales en cada caso.',
    cta_primary: 'Agendar Consulta Gratuita',
    cta_secondary: 'Ver Casos de Éxito',
    cta_micro_copy: 'Primera consulta sin costo · Respuesta en 24h',
    meta_title_formula: '[Estudio] — Abogados en [Área] | Consulta Gratis',
    meta_description_formula: 'Abogados especializados en [área]. Experiencia en [casos]. Consulta inicial gratuita. Agenda hoy.',
  },

  // ── Construcción ──
  construcción: {
    h1_formulas: [
      'Proyectos de construcción con calidad garantizada',
      'Construimos tu proyecto de principio a fin',
      'Soluciones de ingeniería para proyectos complejos',
    ],
    subheadline: 'Experiencia en [tipo de proyectos] con +[X] proyectos completados. Presupuesto sin compromiso.',
    value_section_h2: 'Construcción profesional y puntual',
    value_section_body: 'Cumplimos plazos, normativas técnicas y presupuesto acordado. Respaldo de garantía en cada proyecto.',
    cta_primary: 'Solicitar Presupuesto',
    cta_secondary: 'Ver Proyectos Realizados',
    cta_micro_copy: 'Presupuesto gratuito · Visita técnica sin costo',
    meta_title_formula: '[Empresa] — Construcción e Ingeniería | Presupuesto Gratis',
    meta_description_formula: 'Construcción profesional en [ubicación]. [Tipo de proyectos]. Presupuesto sin compromiso. Solicita visita técnica.',
  },

  // ── Tecnología / SaaS ──
  tecnología: {
    h1_formulas: [
      'Automatiza tu operación y escala sin contratar más personal',
      'El software que tu equipo necesita para trabajar 2x más rápido',
      'Reduce el trabajo manual un 70% desde el primer día',
    ],
    subheadline: 'Plataforma todo-en-uno para [audiencia]. Sin instalaciones. Prueba gratis por 14 días.',
    value_section_h2: 'Todo lo que necesitas, en un solo lugar',
    value_section_body: 'Sin herramientas desconectadas. Sin exportar Excel. Reportes en tiempo real para mejores decisiones.',
    cta_primary: 'Empezar Gratis',
    cta_secondary: 'Ver Demo en Vivo',
    cta_micro_copy: 'Sin tarjeta de crédito · 14 días gratis',
    meta_title_formula: '[Producto] — Software para [Audiencia] | Gratis 14 días',
    meta_description_formula: '[Producto] automatiza [proceso]. Reduce trabajo manual. Integraciones nativas. Prueba gratis 14 días.',
  },

  // ── Salud ──
  salud: {
    h1_formulas: [
      'Atención médica personalizada con los mejores especialistas',
      'Cuida tu salud con profesionales de confianza',
      'Diagnóstico y tratamiento médico de calidad',
    ],
    subheadline: 'Atención médica especializada en [área]. Citas disponibles hoy. Telemedicina y presencial.',
    value_section_h2: 'Tu salud es nuestra prioridad',
    value_section_body: 'Profesionales certificados, tecnología de vanguardia y seguimiento personalizado en cada consulta.',
    cta_primary: 'Agendar Cita',
    cta_secondary: 'Conocer Especialistas',
    cta_micro_copy: 'Citas disponibles hoy · Telemedicina 24/7',
    meta_title_formula: '[Clínica] — Atención Médica en [Especialidad] | Agenda Hoy',
    meta_description_formula: 'Atención médica en [especialidad]. Profesionales certificados. Citas disponibles. Telemedicina y presencial. Agenda ahora.',
  },

  // ── Educación ──
  educación: {
    h1_formulas: [
      'Aprende habilidades que transforman tu carrera',
      'Educación de calidad con certificación reconocida',
      'Domina [habilidad] en [timeframe] con expertos',
    ],
    subheadline: 'Cursos en [área] con +[X] estudiantes. Certificación al finalizar. Matrícula abierta.',
    value_section_h2: 'Aprende haciendo, no solo viendo',
    value_section_body: 'Proyectos reales, mentoría personalizada y certificación reconocida al completar.',
    cta_primary: 'Inscribirme Ahora',
    cta_secondary: 'Ver Plan de Estudios',
    cta_micro_copy: 'Matrícula abierta · Paga en cuotas',
    meta_title_formula: '[Academia] — Cursos de [Área] | Certificación Online',
    meta_description_formula: 'Cursos online de [área]. Certificación reconocida. Proyectos reales. Matrícula abierta. Inscríbete hoy.',
  },

  // ── Consultoría ──
  consultoría: {
    h1_formulas: [
      'Consultoría estratégica que impulsa resultados reales',
      'Acelera el crecimiento de tu empresa con expertos',
      'Soluciones empresariales diseñadas para tu industria',
    ],
    subheadline: 'Consultoría en [área] para empresas que buscan [objetivo]. Diagnóstico inicial gratuito.',
    value_section_h2: 'Estrategias que generan impacto',
    value_section_body: 'Metodología probada, equipo experto y resultados medibles en cada proyecto.',
    cta_primary: 'Solicitar Diagnóstico',
    cta_secondary: 'Ver Casos de Éxito',
    cta_micro_copy: 'Diagnóstico inicial sin costo · Respuesta en 24h',
    meta_title_formula: '[Consultora] — Consultoría en [Área] | Diagnóstico Gratis',
    meta_description_formula: 'Consultoría estratégica en [área] para empresas. Diagnóstico inicial gratuito. Resultados medibles. Agenda ahora.',
  },

  // ── Financiero / Fintech ──
  financiero: {
    h1_formulas: [
      'Administra tu dinero sin comisiones ocultas',
      'Transferencias instantáneas y 100% seguras',
      'Tu dinero, bajo control. Siempre.',
    ],
    subheadline: 'Plataforma financiera regulada. Abre tu cuenta en 5 minutos. Sin comisiones mensuales.',
    value_section_h2: 'Seguro, rápido y sin letra chica',
    value_section_body: 'Encriptación bancaria, verificación biométrica y soporte 24/7.',
    cta_primary: 'Abrir Cuenta Gratis',
    cta_secondary: 'Conocer Planes',
    cta_micro_copy: '100% seguro · SSL 256-bit · Regulado',
    meta_title_formula: '[Fintech] — Cuenta Digital sin Comisiones | Abre Gratis',
    meta_description_formula: 'Cuenta digital sin comisiones ocultas. Transferencias instantáneas. Regulado y seguro. Abre tu cuenta en 5 minutos.',
  },

  // ── Retail / Ecommerce ──
  retail: {
    h1_formulas: [
      'Encuentra [producto] con envío gratis a todo el país',
      'Las mejores ofertas en [categoría] — Hasta 50% OFF',
      '[Producto] de calidad al mejor precio',
    ],
    subheadline: 'Más de [X] productos en stock. Envío gratis en compras +$[monto]. Devoluciones sin costo.',
    value_section_h2: 'Compra con confianza',
    value_section_body: 'Envío rápido, devoluciones gratis y atención al cliente que responde.',
    cta_primary: 'Ver Catálogo',
    cta_secondary: 'Ofertas de la Semana',
    cta_micro_copy: 'Envío gratis +$[monto] · Devoluciones sin costo',
    meta_title_formula: '[Tienda] — [Producto] con Envío Gratis | Compra Online',
    meta_description_formula: '[Producto] con envío gratis. Más de [X] productos en stock. Devoluciones sin costo. Compra ahora.',
  },

  // ── Servicios Generales (Fallback) ──
  'servicios profesionales': {
    h1_formulas: [
      'Soluciones profesionales que generan resultados',
      'Servicios especializados para tu empresa',
      'Calidad y confiabilidad en cada proyecto',
    ],
    subheadline: 'Experiencia en [área] con +[X] años en el mercado. Consulta inicial sin compromiso.',
    value_section_h2: 'Por qué trabajar con nosotros',
    value_section_body: 'Experiencia comprobada, atención personalizada y resultados que superan expectativas.',
    cta_primary: 'Contactar',
    cta_secondary: 'Conocer Más',
    cta_micro_copy: 'Sin compromiso · Respuesta rápida',
    meta_title_formula: '[Empresa] — [Servicio] Profesional | Consulta Gratis',
    meta_description_formula: '[Servicio] profesional con experiencia. Atención personalizada. Consulta inicial sin compromiso. Contáctanos.',
  },
};

// ══════════════════════════════════════════════════════════════
// HELPER: Generar copy personalizado con datos reales
// ══════════════════════════════════════════════════════════════

/**
 * Genera H1 outcome-focused basado en industria + datos reales
 */
function generateH1(brandName, industry, valueProposition, template) {
  const formulas = template.h1_formulas;

  // Si hay value proposition REAL y específica, usarla
  if (valueProposition && valueProposition.length > 30 && !valueProposition.includes('soluciones')) {
    return valueProposition;
  }

  // Sino, usar template de la industria
  return formulas[0]; // Primera opción por defecto
}

/**
 * Genera meta title SEO-optimized (50-60 chars)
 */
function generateMetaTitle(brandName, industry, template) {
  const formula = template.meta_title_formula;

  // Reemplazar [Empresa] con brand name real
  let title = formula.replace('[Empresa]', brandName)
    .replace('[Estudio]', brandName)
    .replace('[Clínica]', brandName)
    .replace('[Academia]', brandName)
    .replace('[Consultora]', brandName)
    .replace('[Fintech]', brandName)
    .replace('[Tienda]', brandName)
    .replace('[Producto]', brandName);

  // Reemplazar [Área] con industria
  title = title.replace('[Área]', industry.charAt(0).toUpperCase() + industry.slice(1));

  // Truncar si es > 60 chars
  if (title.length > 60) {
    title = title.substring(0, 57) + '...';
  }

  return title;
}

/**
 * Genera meta description SEO-optimized (150-160 chars)
 */
function generateMetaDescription(brandName, industry, services, template) {
  const formula = template.meta_description_formula;

  // Reemplazar placeholders
  let description = formula.replace('[Empresa]', brandName)
    .replace('[Servicio]', services[0] || industry)
    .replace('[Producto]', brandName)
    .replace('[área]', industry)
    .replace('[especialidad]', industry);

  // Reemplazar [X] con número si hay servicios
  if (services.length > 0) {
    description = description.replace('[X]', services.length.toString());
  }

  // Truncar si es > 160 chars
  if (description.length > 160) {
    description = description.substring(0, 157) + '...';
  }

  return description;
}

// ══════════════════════════════════════════════════════════════
// SEO AUDIT HELPERS
// ══════════════════════════════════════════════════════════════

/**
 * Audita title tag según reglas de seo-audit skill
 */
function auditTitleTag(currentTitle) {
  const issues = [];
  let score = 5;

  if (!currentTitle) {
    issues.push({ issue: 'Title tag ausente', impact: 'High', fix: 'Agregar title 50-60 chars con keyword al inicio' });
    score = 1;
  } else if (currentTitle.length < 30) {
    issues.push({ issue: `Title muy corto (${currentTitle.length} chars)`, impact: 'Medium', fix: 'Expandir con keyword + beneficio' });
    score -= 2;
  } else if (currentTitle.length > 65) {
    issues.push({ issue: `Title muy largo (${currentTitle.length} chars)`, impact: 'Medium', fix: 'Reducir a 55-60 caracteres' });
    score -= 1;
  }

  return { element: 'Title Tag', current: currentTitle, issues, score: Math.max(1, score) };
}

/**
 * Audita meta description según reglas de seo-audit skill
 */
function auditMetaDescription(currentDescription) {
  const issues = [];
  let score = 5;

  if (!currentDescription) {
    issues.push({ issue: 'Meta description ausente', impact: 'High', fix: 'Agregar 150-160 chars con keyword + CTA' });
    score = 1;
  } else if (currentDescription.length < 100) {
    issues.push({ issue: `Meta description corta (${currentDescription.length} chars)`, impact: 'Medium', fix: 'Ampliar con beneficio + call-to-action' });
    score -= 2;
  } else if (currentDescription.length > 165) {
    issues.push({ issue: `Meta description larga (${currentDescription.length} chars)`, impact: 'Low', fix: 'Reducir a 155 chars máximo' });
    score -= 1;
  }

  return { element: 'Meta Description', current: currentDescription, issues, score: Math.max(1, score) };
}

/**
 * Audita heading structure según reglas de seo-audit skill
 */
function auditHeadingStructure(scrapeData) {
  const h1Count = scrapeData.content?.headings?.h1?.length || 0;
  const h2Count = scrapeData.content?.headings?.h2?.length || 0;

  const issues = [];
  let score = 5;

  if (h1Count === 0) {
    issues.push({ issue: 'Sin H1', impact: 'High', fix: 'Agregar H1 único con keyword principal' });
    score -= 3;
  } else if (h1Count > 1) {
    issues.push({ issue: `${h1Count} H1 detectados`, impact: 'High', fix: 'Mantener 1 solo H1' });
    score -= 2;
  }

  if (h2Count === 0) {
    issues.push({ issue: 'Sin H2', impact: 'Medium', fix: 'Agregar H2 por cada sección principal (mín 3-4)' });
    score -= 1;
  }

  return {
    element: 'Heading Structure',
    h1_count: h1Count,
    h2_count: h2Count,
    issues,
    score: Math.max(1, score),
  };
}

// ══════════════════════════════════════════════════════════════
// MAIN EXPORT: runSEOCopyAgent
// ══════════════════════════════════════════════════════════════

/**
 * SEO + Copy Agent — Genera copy persuasivo + SEO-optimizado
 * @param {object} scrapeData - Datos del scraping
 * @param {string} industry - Industria detectada
 * @returns {object} Copy completo (h1, subheadline, CTAs, meta tags) + SEO audit
 */
export function runSEOCopyAgent(scrapeData, industry) {
  const brandName = scrapeData.brand?.name || scrapeData.metadata?.title?.split(/[\|—\-·]/)[0]?.trim() || 'Empresa';
  const valueProposition = scrapeData.business?.value_proposition || '';
  const services = scrapeData.business?.key_services || [];
  const currentTitle = scrapeData.metadata?.title || '';
  const currentDescription = scrapeData.metadata?.description || '';

  // Seleccionar template por industria
  const template = COPY_TEMPLATES[industry] || COPY_TEMPLATES['servicios profesionales'];

  // Generar copy basado en principios del skill
  const generatedCopy = {
    h1: generateH1(brandName, industry, valueProposition, template),
    subheadline: template.subheadline.replace('[X]', '10').replace('[área]', industry).replace('[audiencia]', 'empresas'),
    cta_primary: template.cta_primary,
    cta_secondary: template.cta_secondary,
    cta_micro_copy: template.cta_micro_copy.replace('[monto]', '99'),
    value_section: {
      h2: template.value_section_h2,
      body: template.value_section_body,
    },
    meta_title: generateMetaTitle(brandName, industry, template),
    meta_description: generateMetaDescription(brandName, industry, services, template),
  };

  // Auditar SEO actual
  const seoAudit = {
    title_tag: auditTitleTag(currentTitle),
    meta_description: auditMetaDescription(currentDescription),
    heading_structure: auditHeadingStructure(scrapeData),
  };

  const seoScore = Math.round((seoAudit.title_tag.score + seoAudit.meta_description.score + seoAudit.heading_structure.score) / 3);

  console.log(`\n✍️ SEO/Copy Agent — Copy Generated:`);
  console.log(`   H1: ${generatedCopy.h1.substring(0, 60)}...`);
  console.log(`   Meta Title: ${generatedCopy.meta_title}`);
  console.log(`   SEO Score: ${seoScore}/5`);

  return {
    industry,
    brand_name: brandName,
    copy: generatedCopy,
    seo_audit: seoAudit,
    seo_score: seoScore,
  };
}
