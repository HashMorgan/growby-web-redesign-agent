/**
 * UX Agent — CRO Analysis + Animation Strategy
 * Applies skills/page-cro/ and skills/animate/ frameworks
 */

function scoreValueProp(markdown, metadata) {
  const h1Match = markdown.match(/^#\s+(.+)$/m);
  const h1 = h1Match ? h1Match[1] : metadata.title || '';
  const isVague = /bienvenidos|welcome|inicio|home|empresa|company/i.test(h1);
  const hasOutcome = /ahorra|reduce|aumenta|crece|gana|mejora|save|grow|increase|boost/i.test(h1);
  const isSpecific = h1.length > 20 && !isVague;

  let score = 3;
  if (hasOutcome && isSpecific) score = 5;
  else if (isSpecific && !isVague) score = 4;
  else if (isVague || h1.length < 10) score = 2;
  if (!h1) score = 1;

  return {
    dimension: 'Value Proposition Clarity',
    score,
    current_h1: h1,
    problem: score <= 2 ? 'H1 genérico o ausente — el visitante no entiende el valor en 5 segundos' : score === 3 ? 'H1 descriptivo pero sin outcome claro ni diferenciación' : 'Buena propuesta de valor',
    solution: score <= 3 ? 'Reescribir H1 con fórmula: [Resultado específico] para [Audiencia] sin [Pain point]' : 'Mantener y reforzar con subheadline más específico',
  };
}

function scoreHeadline(markdown, metadata) {
  const h1Match = markdown.match(/^#\s+(.+)$/m);
  const h1 = h1Match ? h1Match[1] : metadata.title || '';
  const hasNumbers = /\d/.test(h1);
  const hasSpecificity = h1.length > 25;
  const isFeatureFocused = /solución|sistema|plataforma|herramienta|solution|platform|tool/i.test(h1);

  let score = 3;
  if (hasNumbers && hasSpecificity && !isFeatureFocused) score = 5;
  else if (hasSpecificity && !isFeatureFocused) score = 4;
  else if (isFeatureFocused) score = 2;
  if (!h1 || h1.length < 10) score = 1;

  return {
    dimension: 'Headline Effectiveness',
    score,
    problem: isFeatureFocused ? 'Headline orientado a features, no a beneficios del cliente' : score <= 2 ? 'Headline débil o ausente' : score === 3 ? 'Headline aceptable pero sin especificidad ni números' : 'Headline efectivo',
    solution: 'Incluir: número concreto + audiencia + resultado. Ej: "Incrementa tus ventas un 30% en 90 días"',
  };
}

function scoreCTA(markdown) {
  const ctaPatterns = /contact|contacto|comenzar|empezar|prueba|demo|signup|register|suscribir|comprar|buy|start|get started/i;
  const hasCTA = ctaPatterns.test(markdown.slice(0, 2000));
  const hasFreeCTA = /gratis|free|sin costo|no credit card/i.test(markdown.slice(0, 2000));
  const hasMultipleCTAs = (markdown.match(ctaPatterns) || []).length > 2;

  let score = hasCTA ? (hasFreeCTA ? 5 : hasMultipleCTAs ? 4 : 3) : 1;

  return {
    dimension: 'CTA Placement & Hierarchy',
    score,
    problem: !hasCTA ? 'No se detecta CTA visible above the fold' : !hasFreeCTA ? 'CTA presente pero sin reducción de fricción (no hay "gratis" o "sin tarjeta")' : 'CTA correcto',
    solution: !hasCTA ? 'Agregar CTA primario above the fold con copy de valor: "Empieza gratis — sin tarjeta de crédito"' : 'Agregar micro-copy de confianza bajo el botón CTA',
  };
}

function scoreVisualHierarchy(markdown) {
  const h2Count = (markdown.match(/^##\s+/gm) || []).length;
  const h3Count = (markdown.match(/^###\s+/gm) || []).length;
  const hasStructure = h2Count >= 2;
  const isOverloaded = h2Count > 8;

  let score = 3;
  if (hasStructure && !isOverloaded && h3Count > 0) score = 4;
  else if (!hasStructure) score = 2;
  else if (isOverloaded) score = 2;

  return {
    dimension: 'Visual Hierarchy',
    score,
    problem: !hasStructure ? 'Sin secciones H2 — la página no es escaneable' : isOverloaded ? 'Demasiadas secciones — el usuario se pierde' : 'Jerarquía básica presente, mejorable',
    solution: !hasStructure ? 'Estructurar en secciones claras: Hero → Features → Proof → CTA' : 'Reducir a 5-6 secciones máximo, cada una con un argumento único',
  };
}

function scoreTrustSignals(markdown) {
  const hasTrust = /testimonio|testimonial|cliente|client|empresa|company|garantía|guarantee|certificado|certified|\d+\+?\s*(clientes|users|empresas)/i.test(markdown);
  const hasNumbers = /\d{3,}/.test(markdown);
  const hasLogos = /logo|partner|cliente|client/i.test(markdown);

  let score = 1;
  if (hasTrust && hasNumbers && hasLogos) score = 5;
  else if (hasTrust && hasNumbers) score = 4;
  else if (hasTrust || hasNumbers) score = 3;
  else if (hasLogos) score = 2;

  return {
    dimension: 'Trust Signals',
    score,
    problem: score <= 2 ? 'Sin prueba social visible — el visitante no puede validar la credibilidad' : score === 3 ? 'Señales de confianza parciales — falta especificidad (números concretos, logos reconocidos)' : 'Buenas señales de confianza',
    solution: score <= 2 ? 'Agregar: número de clientes, logos de empresas conocidas, testimonios con foto y cargo' : 'Hacer los números más prominentes y específicos: "250+ proyectos" → "Más de 250 proyectos entregados puntualmente"',
  };
}

function scoreObjectionHandling(markdown) {
  const hasPrice = /precio|price|costo|cost|\$/i.test(markdown);
  const hasFAQ = /faq|pregunta|question|cómo funciona|how it works/i.test(markdown);
  const hasGuarantee = /garantía|guarantee|devolución|refund|riesgo|risk/i.test(markdown);

  const count = [hasPrice, hasFAQ, hasGuarantee].filter(Boolean).length;
  const score = count === 0 ? 1 : count === 1 ? 2 : count === 2 ? 3 : 5;

  return {
    dimension: 'Objection Handling',
    score,
    problem: score <= 2 ? 'Sin manejo de objeciones — preguntas comunes sin respuesta en la página' : 'Manejo básico de objeciones',
    solution: score <= 2 ? 'Agregar sección FAQ con 4-5 preguntas reales del cliente: precio, proceso, tiempo, soporte, garantía' : 'Añadir garantía de satisfacción o prueba gratuita para reducir el riesgo percibido',
  };
}

function scoreFriction(markdown, url) {
  const hasForm = /formulario|form|input|nombre|email|name/i.test(markdown);
  const hasNav = /menú|menu|nav|inicio|home/i.test(markdown.slice(0, 500));
  const manyLinks = (markdown.match(/\[.+\]\(.+\)/g) || []).length > 15;

  let score = 4;
  if (manyLinks && hasForm) score = 2;
  else if (manyLinks || (hasForm && !hasNav)) score = 3;

  return {
    dimension: 'Friction Points',
    score,
    problem: score <= 2 ? 'Múltiples puntos de fricción: demasiados links y/o formulario complejo' : score === 3 ? 'Algunos elementos que pueden distraer al visitante del CTA principal' : 'Experiencia relativamente limpia',
    solution: score <= 2 ? 'Simplificar navegación, reducir campos del formulario a 2-3 máximo, eliminar distracciones near CTA' : 'Ocultar nav en landing pages de campaña para enfoque total en conversión',
  };
}

export function runUXAgent(scrapingData, uiData) {
  const { markdown, metadata, url, industria_detectada } = scrapingData;

  console.log('  📊 [UX Agent] Analizando 7 dimensiones CRO...');

  const dimensions = [
    scoreValueProp(markdown, metadata),
    scoreHeadline(markdown, metadata),
    scoreCTA(markdown),
    scoreVisualHierarchy(markdown),
    scoreTrustSignals(markdown),
    scoreObjectionHandling(markdown),
    scoreFriction(markdown, url),
  ];

  const avgScore = (dimensions.reduce((a, d) => a + d.score, 0) / dimensions.length).toFixed(1);
  const quickWins = dimensions
    .filter(d => d.score <= 3)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map(d => ({ dimension: d.dimension, fix: d.solution }));

  // Animation strategy based on industry
  const animationStrategy = {
    hero_moment: {
      element: 'H1 + CTA button',
      animation: 'fade-in + slide-up (translateY 20px → 0)',
      duration: '600ms',
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      delay: '0ms',
    },
    feedback_layer: [
      { element: 'Primary CTA button', animation: 'scale 1 → 1.04 on hover, scale 0.97 on click', duration: '150ms' },
      { element: 'Nav links', animation: 'color transition + underline slide-in', duration: '200ms' },
      { element: 'Cards/feature items', animation: 'shadow elevation on hover', duration: '250ms' },
    ],
    transition_layer: [
      { element: 'All sections', animation: 'scroll-triggered fade-in + translateY(30px → 0)', duration: '500ms', trigger: 'IntersectionObserver 0.15 threshold' },
      { element: 'Feature grid items', animation: 'stagger 80ms delay per item', duration: '400ms' },
    ],
    delight_layer: {
      element: industria_detectada === 'saas' ? 'Counter números de impacto' : 'Logo bar (marquee sutil)',
      animation: industria_detectada === 'saas' ? 'Count up animation al entrar en viewport' : 'Infinite horizontal scroll suave',
      duration: industria_detectada === 'saas' ? '1500ms' : 'infinite 30s linear',
    },
    reduced_motion_note: 'Todas las animaciones deben deshabilitarse con @media (prefers-reduced-motion: reduce)',
  };

  return {
    cro_score_promedio: parseFloat(avgScore),
    cro_analysis: dimensions,
    animation_strategy: animationStrategy,
    quick_wins: quickWins,
  };
}
