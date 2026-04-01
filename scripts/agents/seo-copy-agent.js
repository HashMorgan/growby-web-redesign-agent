/**
 * SEO + Copy Agent
 * Applies skills/seo-audit/ and skills/copywriting/ frameworks
 */

function auditTitle(metadata, url) {
  const title = metadata.title || '';
  const issues = [];
  let score = 5;

  if (!title) { issues.push({ issue: 'Title tag ausente', impact: 'High', fix: `Agregar title: "${new URL(url).hostname.replace('www.','')} — [Propuesta de valor principal]"` }); score = 1; }
  else if (title.length < 30) { issues.push({ issue: `Title muy corto (${title.length} chars)`, impact: 'Medium', fix: 'Expandir con keyword principal + beneficio: "Empresa X — [Lo que hacen] para [Audiencia]"' }); score -= 2; }
  else if (title.length > 65) { issues.push({ issue: `Title muy largo (${title.length} chars) — se trunca en SERP`, impact: 'Medium', fix: 'Reducir a 55-60 caracteres, poner keyword al inicio' }); score -= 1; }

  return { element: 'Title Tag', current: title, issues, score: Math.max(1, score) };
}

function auditMeta(metadata) {
  const desc = metadata.description || '';
  const issues = [];
  let score = 5;

  if (!desc) { issues.push({ issue: 'Meta description ausente', impact: 'High', fix: 'Agregar meta description de 150-160 chars con keyword + propuesta de valor + CTA' }); score = 1; }
  else if (desc.length < 100) { issues.push({ issue: `Meta description corta (${desc.length} chars)`, impact: 'Medium', fix: 'Ampliar con beneficio principal y call-to-action al final' }); score -= 2; }
  else if (desc.length > 165) { issues.push({ issue: `Meta description larga (${desc.length} chars)`, impact: 'Low', fix: 'Reducir a 155 chars máximo para evitar truncamiento en Google' }); score -= 1; }

  return { element: 'Meta Description', current: desc, issues, score: Math.max(1, score) };
}

function auditHeadings(markdown) {
  const h1s = markdown.match(/^#\s+.+$/gm) || [];
  const h2s = markdown.match(/^##\s+.+$/gm) || [];
  const h3s = markdown.match(/^###\s+.+$/gm) || [];
  const issues = [];
  let score = 5;

  if (h1s.length === 0) { issues.push({ issue: 'Sin H1 en la página', impact: 'High', fix: 'Agregar H1 único con la keyword principal de la página' }); score -= 3; }
  else if (h1s.length > 1) { issues.push({ issue: `${h1s.length} H1 detectados — debe ser único`, impact: 'High', fix: 'Mantener un solo H1, convertir los demás en H2' }); score -= 2; }
  if (h2s.length === 0) { issues.push({ issue: 'Sin H2 — estructura de contenido débil', impact: 'Medium', fix: 'Agregar H2 por cada sección principal (mínimo 3-4)' }); score -= 1; }
  if (h2s.length > 0 && h3s.length === 0 && h2s.length > 4) {
    issues.push({ issue: 'Sin H3 con múltiples H2 — jerarquía plana', impact: 'Low', fix: 'Agregar H3 para sub-secciones y listas de características' });
    score -= 0.5;
  }

  return {
    element: 'Heading Structure',
    h1_count: h1s.length,
    h2_count: h2s.length,
    h3_count: h3s.length,
    h1_text: h1s[0]?.replace(/^#\s+/, '') || '',
    issues,
    score: Math.max(1, Math.round(score)),
  };
}

function auditInternalLinks(markdown) {
  const links = markdown.match(/\[.+?\]\((?!http).+?\)/g) || [];
  const externalLinks = markdown.match(/\[.+?\]\(https?:\/\/.+?\)/g) || [];
  const issues = [];
  let score = 4;

  if (links.length < 2) { issues.push({ issue: 'Pocos links internos detectados', impact: 'Medium', fix: 'Agregar links internos a páginas de servicios, blog y contacto desde el home' }); score -= 2; }
  if (externalLinks.length > links.length * 2) { issues.push({ issue: 'Más links externos que internos', impact: 'Low', fix: 'Balancear: por cada link externo, tener 2 internos' }); score -= 1; }

  return { element: 'Internal Linking', internal_count: links.length, external_count: externalLinks.length, issues, score: Math.max(1, score) };
}

// Copy rewriting engine
function rewriteCopy(scrapingData, industry) {
  const { markdown, metadata } = scrapingData;
  const h1Match = markdown.match(/^#\s+(.+)$/m);
  const h2Matches = markdown.match(/^##\s+(.+)$/gm) || [];
  const currentH1 = h1Match ? h1Match[1] : metadata.title || '';

  // Industry-specific copy templates
  const copyTemplates = {
    agency: {
      h1: `Diseñamos y desarrollamos soluciones digitales que hacen crecer tu empresa`,
      h1_alt_a: `Tu equipo digital de alto rendimiento en LatAm`,
      h1_alt_b: `+250 proyectos digitales. El siguiente puede ser el tuyo.`,
      subheadline: `Conectamos empresas con especialistas digitales de primer nivel en diseño, desarrollo, IA y marketing. Resultados en semanas, no meses.`,
      cta_primary: 'Cuéntanos tu proyecto',
      cta_secondary: 'Ver casos de éxito',
      cta_micro_copy: 'Respondemos en menos de 24 horas',
      meta_title: `GrowBy — Agencia Digital | Diseño, Desarrollo e IA en LatAm`,
      meta_description: `Especialistas digitales en diseño UX, desarrollo web, IA y marketing. Más de 250 proyectos para empresas en LatAm y USA. Cuéntanos tu proyecto hoy.`,
      value_section_h2: '¿Por qué GrowBy?',
      value_section_body: 'Accedes a un equipo completo de especialistas digitales sin los costos de contratación tradicional. Escalamos contigo.',
    },
    saas: {
      h1: `Automatiza tu operación y escala sin contratar más personal`,
      h1_alt_a: `El software que tu equipo necesita para trabajar 2x más rápido`,
      h1_alt_b: `Reduce el trabajo manual un 70% desde el primer día`,
      subheadline: `Plataforma todo-en-uno para gestionar [proceso clave], con integraciones nativas y reportes en tiempo real.`,
      cta_primary: 'Empieza gratis',
      cta_secondary: 'Ver demo en vivo',
      cta_micro_copy: 'Sin tarjeta de crédito · 14 días gratis',
      meta_title: `[Nombre] — [Categoría SaaS] para [Audiencia] | Gratis 14 días`,
      meta_description: `[Nombre] ayuda a [audiencia] a [resultado] en [tiempo]. Sin instalaciones. Prueba gratis 14 días. Más de [N] equipos ya lo usan.`,
      value_section_h2: 'Todo lo que necesitas, en un solo lugar',
      value_section_body: 'Sin múltiples herramientas desconectadas. Sin exportar Excel. Sin reuniones innecesarias para reportar.',
    },
    fintech: {
      h1: `Envía y recibe dinero sin comisiones, desde cualquier lugar`,
      h1_alt_a: `Tu dinero, bajo control. Siempre.`,
      h1_alt_b: `Transferencias internacionales al instante y sin costo oculto`,
      subheadline: `La plataforma financiera más confiable de LatAm. Abierta una cuenta en 5 minutos y empieza a mover tu dinero hoy.`,
      cta_primary: 'Abrir cuenta gratis',
      cta_secondary: 'Conocer planes',
      cta_micro_copy: '100% seguro · Regulado por [Entidad] · SSL 256-bit',
      meta_title: `[Nombre] — Transferencias sin comisiones | Fintech LatAm`,
      meta_description: `Abre tu cuenta en 5 minutos. Envía dinero a todo LatAm sin comisiones ocultas. Más de [N] clientes confían en [Nombre].`,
      value_section_h2: 'Tu dinero, seguro y disponible siempre',
      value_section_body: 'Encriptación bancaria de 256 bits, verificación biométrica y soporte 24/7 para que duermas tranquilo.',
    },
    general: {
      h1: `[Resultado específico] para [Audiencia] — sin [Pain point]`,
      h1_alt_a: `Más [beneficio], menos [problema]`,
      h1_alt_b: `La solución que [audiencia] estaba esperando`,
      subheadline: `[Nombre] ayuda a [audiencia] a [lograr resultado] en [tiempo], sin [fricción principal].`,
      cta_primary: 'Empezar ahora',
      cta_secondary: 'Saber más',
      cta_micro_copy: 'Sin compromiso',
      meta_title: `[Nombre] — [Categoría] para [Audiencia]`,
      meta_description: `[Nombre] permite a [audiencia] [lograr resultado] en [tiempo]. [Prueba social]. [CTA breve].`,
      value_section_h2: 'Por qué elegirnos',
      value_section_body: '[Diferenciador 1], [Diferenciador 2] y [Diferenciador 3] en una sola plataforma.',
    },
  };

  const template = copyTemplates[industry] || copyTemplates.general;

  // Rewrite H2s
  const rewrittenH2s = h2Matches.slice(0, 5).map((h2, i) => ({
    original: h2.replace(/^##\s+/, ''),
    rewritten: [
      'Cómo lo hacemos — simple, rápido y sin sorpresas',
      'Lo que dicen nuestros clientes',
      'Resultados que hablan por sí solos',
      'Todo lo que necesitas, sin lo que no',
      'Empieza hoy — sin riesgos',
    ][i] || h2.replace(/^##\s+/, ''),
  }));

  return {
    h1: { original: currentH1, rewritten: template.h1, alternatives: [template.h1_alt_a, template.h1_alt_b] },
    subheadline: template.subheadline,
    ctas: {
      primary: template.cta_primary,
      secondary: template.cta_secondary,
      micro_copy: template.cta_micro_copy,
    },
    h2s: rewrittenH2s,
    meta_title: template.meta_title,
    meta_description: template.meta_description,
    value_section: {
      h2: template.value_section_h2,
      body: template.value_section_body,
    },
  };
}

export function runSEOCopyAgent(scrapingData, industry) {
  const { markdown, metadata, url } = scrapingData;

  console.log('  🔍 [SEO/Copy Agent] Auditando SEO + reescribiendo copy...');

  const titleAudit = auditTitle(metadata, url);
  const metaAudit = auditMeta(metadata);
  const headingAudit = auditHeadings(markdown);
  const linkAudit = auditInternalLinks(markdown);

  const allIssues = [
    ...titleAudit.issues,
    ...metaAudit.issues,
    ...headingAudit.issues,
    ...linkAudit.issues,
  ].sort((a, b) => (a.impact === 'High' ? -1 : 1));

  const rewritten = rewriteCopy(scrapingData, industry);

  return {
    seo_scores: {
      title: titleAudit.score,
      meta_description: metaAudit.score,
      headings: headingAudit.score,
      internal_links: linkAudit.score,
    },
    seo_issues: allIssues,
    top_3_seo_issues: allIssues.slice(0, 3).map(i => i.issue),
    heading_structure: {
      h1_count: headingAudit.h1_count,
      h2_count: headingAudit.h2_count,
      h3_count: headingAudit.h3_count,
      current_h1: headingAudit.h1_text,
    },
    rewritten_copy: rewritten,
  };
}
