/**
 * ux-agent.js — UX/CRO Analysis Agent
 * v3.5.0 — Basado en principios de skills/page-cro/
 *
 * Extrae de page-cro SKILL.md:
 * - 7 dimensiones de análisis CRO (Value Prop Clarity, Headlines, CTAs, Visual Hierarchy, Trust Signals, Objection Handling, Friction Points)
 * - Quick wins vs High-impact changes
 * - Layout recommendations por tipo de página
 * - CTA copy patterns
 */

// ══════════════════════════════════════════════════════════════
// 7 DIMENSIONES CRO FRAMEWORK (del skill page-cro)
// ══════════════════════════════════════════════════════════════

/**
 * Dimensión 1: Value Proposition Clarity (Highest Impact)
 * ¿Puede un visitante entender QUÉ ES y POR QUÉ IMPORTA en 5 segundos?
 */
function analyzeValuePropClarity(scrapeData) {
  const h1 = scrapeData.content?.headings?.h1?.[0] || '';
  const description = scrapeData.description || '';
  const valueProposition = scrapeData.business?.value_proposition || '';

  const issues = [];
  let score = 5;

  // Check 1: H1 existe y es específico
  if (!h1) {
    issues.push({ issue: 'Sin H1 claro', fix: 'Agregar headline que comunique el beneficio principal' });
    score -= 2;
  } else if (h1.length < 20) {
    issues.push({ issue: 'H1 muy vago', fix: 'Expandir con beneficio específico: "Qué haces + Para quién + Resultado"' });
    score -= 1;
  }

  // Check 2: Value prop es claro o genérico
  if (!valueProposition || valueProposition.includes('soluciones') || valueProposition.includes('innovación')) {
    issues.push({ issue: 'Value proposition genérica', fix: 'Especificar resultado concreto, no buzzwords' });
    score -= 1;
  }

  return {
    dimension: 'Value Proposition Clarity',
    impact: 'HIGHEST',
    score: Math.max(1, score),
    issues,
    recommendation: issues.length > 0 ? 'Reescribir H1 + subheadline con beneficio específico' : 'Value prop clara',
  };
}

/**
 * Dimensión 2: Headline Effectiveness
 * ¿El H1 comunica valor, no solo descripción?
 */
function analyzeHeadlineEffectiveness(scrapeData) {
  const h1 = scrapeData.content?.headings?.h1?.[0] || '';
  const brandName = scrapeData.brand?.name || '';

  const issues = [];
  let score = 5;

  // Patterns fuertes (del skill copywriting):
  // - Outcome-focused: "Get [desired outcome] without [pain point]"
  // - Specificity: Include numbers, timeframes
  // - Social proof: "Join 10,000+ teams who..."

  // Check 1: H1 es solo nombre de empresa
  if (h1.toLowerCase().includes(brandName.toLowerCase()) && h1.length < 30) {
    issues.push({ issue: 'H1 es solo nombre de empresa', fix: 'Agregar beneficio: "[Empresa] — [Beneficio principal para cliente]"' });
    score -= 2;
  }

  // Check 2: H1 es feature-focused en vez de benefit-focused
  const featureWords = ['ofrecemos', 'brindamos', 'tenemos', 'contamos con'];
  if (featureWords.some(w => h1.toLowerCase().includes(w))) {
    issues.push({ issue: 'H1 es feature-focused', fix: 'Cambiar a benefit: "Logra [resultado] sin [dolor]"' });
    score -= 1;
  }

  // Check 3: Falta especificidad (números, timeframes)
  const hasNumbers = /\d+/.test(h1);
  if (!hasNumbers && h1.length > 20) {
    issues.push({ issue: 'Falta especificidad', fix: 'Agregar números o timeframe: "Reduce X en Y%"' });
    score -= 0.5;
  }

  return {
    dimension: 'Headline Effectiveness',
    impact: 'HIGH',
    score: Math.max(1, Math.round(score)),
    current_h1: h1,
    issues,
    recommendation: issues.length > 0 ? 'Reescribir H1 con outcome-focused copy' : 'Headline efectivo',
  };
}

/**
 * Dimensión 3: CTA Placement & Hierarchy
 * ¿Hay un CTA primario claro above-the-fold?
 */
function analyzeCTAStrategy(scrapeData) {
  const issues = [];
  let score = 5;

  // Según skill page-cro:
  // - Primary CTA debe estar above-the-fold
  // - Button copy debe comunicar VALOR, no solo acción
  // - Weak: "Submit", "Sign Up", "Learn More"
  // - Strong: "Start Free Trial", "Get My Report", "See Pricing"

  // Check 1: CTA copy detectado (si existe)
  const ctas = scrapeData.content?.ctas || [];
  if (ctas.length === 0) {
    issues.push({ issue: 'Sin CTAs detectados', fix: 'Agregar CTA primario above-the-fold' });
    score -= 2;
  }

  // Check 2: CTA copy es genérico
  const weakCTAs = ['enviar', 'submit', 'click aquí', 'más información', 'saber más'];
  const hasWeakCTA = ctas.some(cta => weakCTAs.some(weak => cta.toLowerCase().includes(weak)));
  if (hasWeakCTA) {
    issues.push({ issue: 'CTA copy genérico', fix: 'Cambiar a value-driven: "Solicitar Consulta Gratuita" > "Enviar"' });
    score -= 1;
  }

  return {
    dimension: 'CTA Placement & Hierarchy',
    impact: 'HIGH',
    score: Math.max(1, score),
    issues,
    recommendation: 'CTA primario above-the-fold + copy orientado a valor',
    suggested_cta_copy: {
      primary: 'Solicitar Consulta Gratuita',
      secondary: 'Ver Casos de Éxito',
    },
  };
}

/**
 * Dimensión 4: Visual Hierarchy & Scannability
 * ¿Alguien escaneando puede captar el mensaje principal?
 */
function analyzeVisualHierarchy(scrapeData) {
  const h1Count = scrapeData.content?.headings?.h1?.length || 0;
  const h2Count = scrapeData.content?.headings?.h2?.length || 0;

  const issues = [];
  let score = 5;

  if (h1Count === 0) {
    issues.push({ issue: 'Sin H1', fix: 'Agregar H1 único con mensaje principal' });
    score -= 2;
  } else if (h1Count > 1) {
    issues.push({ issue: 'Múltiples H1', fix: 'Mantener 1 solo H1, convertir otros en H2' });
    score -= 1;
  }

  if (h2Count === 0) {
    issues.push({ issue: 'Sin H2 (jerarquía plana)', fix: 'Agregar H2 por cada sección principal' });
    score -= 1;
  }

  return {
    dimension: 'Visual Hierarchy & Scannability',
    impact: 'MEDIUM',
    score: Math.max(1, score),
    issues,
    recommendation: 'Estructura H1 → H2 → H3 clara + whitespace generoso',
  };
}

/**
 * Dimensión 5: Trust Signals & Social Proof
 * ¿Hay elementos de confianza cerca del CTA?
 */
function analyzeTrustSignals(scrapeData) {
  const hasLogo = !!scrapeData.brand?.logo;
  const clientLogos = scrapeData.assets?.client_logos?.length || 0;
  const testimonials = scrapeData.business?.testimonials?.length || 0;

  const issues = [];
  let score = 5;

  if (clientLogos === 0) {
    issues.push({ issue: 'Sin logos de clientes', fix: 'Agregar logo bar con 6-8 clientes debajo del hero' });
    score -= 1.5;
  }

  if (testimonials === 0) {
    issues.push({ issue: 'Sin testimonials', fix: 'Agregar 2-3 testimonials con nombre + foto + empresa' });
    score -= 1.5;
  }

  return {
    dimension: 'Trust Signals & Social Proof',
    impact: 'MEDIUM',
    score: Math.max(1, Math.round(score)),
    detected: {
      client_logos: clientLogos,
      testimonials: testimonials,
      has_brand_logo: hasLogo,
    },
    issues,
    recommendation: 'Agregar trust signals near CTA: logos + testimonials + stats',
  };
}

/**
 * Dimensión 6: Objection Handling
 * ¿Se resuelven dudas comunes?
 */
function analyzeObjectionHandling(scrapeData) {
  const faq = scrapeData.faq?.length || 0;
  const services = scrapeData.business?.key_services?.length || 0;

  const issues = [];
  let score = 5;

  if (faq === 0) {
    issues.push({ issue: 'Sin FAQ section', fix: 'Agregar 4-6 preguntas frecuentes antes del footer' });
    score -= 2;
  }

  if (services < 3) {
    issues.push({ issue: 'Servicios no claros', fix: 'Detallar qué incluye cada servicio + precios si aplica' });
    score -= 1;
  }

  return {
    dimension: 'Objection Handling',
    impact: 'MEDIUM',
    score: Math.max(1, score),
    issues,
    recommendation: 'FAQ section + garantías + proceso transparente',
  };
}

/**
 * Dimensión 7: Friction Points
 * ¿Hay elementos que dificultan la conversión?
 */
function analyzeFrictionPoints(scrapeData) {
  const issues = [];
  let score = 5;

  // Common friction points del skill:
  // - Too many form fields
  // - Unclear next steps
  // - Confusing navigation
  // - Long load times

  // Sin datos de forms/performance en scraping, inferir de estructura
  const h2Count = scrapeData.content?.headings?.h2?.length || 0;
  if (h2Count > 10) {
    issues.push({ issue: 'Demasiadas secciones (cognitive overload)', fix: 'Reducir a 6-8 secciones clave' });
    score -= 1;
  }

  return {
    dimension: 'Friction Points',
    impact: 'LOW',
    score: Math.max(1, score),
    issues,
    recommendation: 'Reducir campos de forms + clarificar next steps',
  };
}

// ══════════════════════════════════════════════════════════════
// LAYOUT RECOMMENDATIONS POR TIPO DE PÁGINA
// ══════════════════════════════════════════════════════════════

const LAYOUT_PATTERNS = {
  homepage: {
    sections: ['hero', 'logo-bar', 'services', 'process', 'testimonials', 'cta', 'faq', 'footer'],
    hero_style: '2-column (content + visual)',
    cta_placement: 'above-the-fold + end-of-page',
  },
  landing: {
    sections: ['hero', 'benefits', 'social-proof', 'how-it-works', 'testimonials', 'cta'],
    hero_style: 'centered single-column',
    cta_placement: 'above-the-fold + after-testimonials',
  },
  saas: {
    sections: ['hero', 'logo-bar', 'features', 'pricing-preview', 'testimonials', 'cta', 'footer'],
    hero_style: '2-column with product screenshot',
    cta_placement: 'above-the-fold (Start Free Trial)',
  },
};

// ══════════════════════════════════════════════════════════════
// MAIN EXPORT: runUXAgent
// ══════════════════════════════════════════════════════════════

/**
 * UX Agent — Analiza las 7 dimensiones CRO y genera quick wins
 * @param {object} scrapeData - Datos del scraping
 * @returns {object} Análisis CRO completo + layout recommendations + quick wins
 */
export function runUXAgent(scrapeData) {
  const industry = scrapeData.business?.industry || 'servicios profesionales';

  // Ejecutar 7 dimensiones de análisis
  const analysis = {
    value_prop_clarity: analyzeValuePropClarity(scrapeData),
    headline_effectiveness: analyzeHeadlineEffectiveness(scrapeData),
    cta_strategy: analyzeCTAStrategy(scrapeData),
    visual_hierarchy: analyzeVisualHierarchy(scrapeData),
    trust_signals: analyzeTrustSignals(scrapeData),
    objection_handling: analyzeObjectionHandling(scrapeData),
    friction_points: analyzeFrictionPoints(scrapeData),
  };

  // Calcular score promedio
  const scores = Object.values(analysis).map(d => d.score);
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  // Generar quick wins (High Impact + Low Effort)
  const quickWins = [];
  Object.values(analysis).forEach(dimension => {
    if (dimension.issues.length > 0 && dimension.impact === 'HIGHEST') {
      quickWins.push({
        dimension: dimension.dimension,
        fix: dimension.issues[0].fix,
        impact: 'CRITICAL',
      });
    }
  });

  // Layout recommendation
  const pageType = industry.includes('saas') || industry.includes('tecnología') ? 'saas' : 'homepage';
  const recommendedLayout = LAYOUT_PATTERNS[pageType];

  console.log(`\n📐 UX Agent — CRO Analysis:`);
  console.log(`   Overall Score: ${avgScore}/5`);
  console.log(`   Quick Wins: ${quickWins.length}`);
  console.log(`   Layout: ${recommendedLayout.sections.join(' → ')}`);

  return {
    industry,
    overall_score: avgScore,
    dimensions: analysis,
    quick_wins: quickWins,
    recommended_layout: recommendedLayout,
    cta_copy_suggestions: {
      primary: analysis.cta_strategy.suggested_cta_copy.primary,
      secondary: analysis.cta_strategy.suggested_cta_copy.secondary,
    },
  };
}
