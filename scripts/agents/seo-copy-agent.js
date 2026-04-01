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

// Build business brief from scraped data — understand WHAT they sell and TO WHOM before writing copy
function buildBusinessBrief(scrapingData, industry) {
  const { business, brand, metadata } = scrapingData;
  const companyName = business?.company_name || brand?.name || metadata?.title?.split(/[\|—\-·]/)[0]?.trim() || 'la empresa';
  const services = business?.key_services?.slice(0, 3).map(s => s.name).join(', ') || 'sus servicios';

  const industryBriefs = {
    elevator_company: {
      quien_es: `${companyName} es una empresa especializada en elevadores, ascensores y soluciones de movilidad vertical`,
      que_hace: `Instala, mantiene y moderniza sistemas de elevación para edificios residenciales, comerciales e industriales`,
      para_quien: `Constructoras, edificios residenciales, centros comerciales, empresas industriales y propietarios de inmuebles`,
      por_que_elegirnos: `A diferencia de proveedores genéricos, ofrecen experiencia técnica certificada, cumplimiento de normativas y soporte post-instalación`,
      cta_principal: `Solicitar cotización`,
    },
    agency: {
      quien_es: `${companyName} es una agencia digital especializada en ${services}`,
      que_hace: `Diseña, desarrolla e implementa soluciones digitales para empresas`,
      para_quien: `Empresas medianas y grandes que necesitan escalar su presencia digital`,
      por_que_elegirnos: `Combina talento especializado con metodología ágil para entregar resultados concretos`,
      cta_principal: `Cuéntanos tu proyecto`,
    },
    saas: {
      quien_es: `${companyName} es una plataforma de software que automatiza ${services}`,
      que_hace: `Provee herramientas digitales para optimizar procesos empresariales`,
      para_quien: `Equipos de trabajo que buscan eficiencia operativa`,
      por_que_elegirnos: `Sin instalaciones complejas, con integraciones nativas y soporte real`,
      cta_principal: `Empieza gratis`,
    },
    industrial: {
      quien_es: `${companyName} es una empresa especializada en equipos y soluciones industriales`,
      que_hace: `Diseña, fabrica y distribuye equipos eléctricos e industriales para proyectos de infraestructura`,
      para_quien: `Constructoras, plantas industriales, empresas mineras y proyectos de infraestructura`,
      por_que_elegirnos: `Experiencia técnica certificada, equipos de alta eficiencia y soporte post-venta especializado`,
      cta_principal: `Solicitar cotización técnica`,
    },
    general: {
      quien_es: `${companyName} ofrece ${services}`,
      que_hace: `Provee soluciones especializadas para sus clientes`,
      para_quien: `Empresas y personas que buscan calidad y resultados`,
      por_que_elegirnos: `Experiencia, confiabilidad y resultados comprobados`,
      cta_principal: `Contáctanos`,
    },
  };

  return industryBriefs[industry] || industryBriefs.general;
}

// Copy rewriting engine
function rewriteCopy(scrapingData, industry) {
  const { markdown, metadata } = scrapingData;
  const h1Match = markdown.match(/^#\s+(.+)$/m);
  const h2Matches = markdown.match(/^##\s+(.+)$/gm) || [];
  const currentH1 = h1Match ? h1Match[1] : metadata.title || '';
  const brief = buildBusinessBrief(scrapingData, industry);
  const companyName = scrapingData.business?.company_name || metadata.title?.split(/[\|—\-·]/)[0]?.trim() || 'Empresa';
  const domain = (() => { try { return new URL(scrapingData.url || '').hostname.replace('www.',''); } catch { return 'empresa.com'; } })();

  // Industry-specific copy templates — NO GrowBy content allowed
  const copyTemplates = {
    elevator_company: {
      h1: `Elevadores seguros y eficientes para tu proyecto`,
      h1_alt_a: `Soluciones de movilidad vertical con garantía técnica`,
      h1_alt_b: `Instalamos elevadores que duran décadas — con respaldo certificado`,
      subheadline: `${companyName} diseña e instala sistemas de elevación para proyectos residenciales, comerciales e industriales. Cumplimiento de normativas y soporte post-instalación incluido.`,
      cta_primary: 'Solicitar cotización',
      cta_secondary: 'Ver nuestros proyectos',
      cta_micro_copy: 'Respuesta en menos de 24 horas · Sin compromiso',
      meta_title: `${companyName} — Elevadores y Ascensores | Instalación y Mantenimiento`,
      meta_description: `${companyName}: instalación y mantenimiento de elevadores para edificios residenciales, comerciales e industriales. Certificados y con garantía. Solicita cotización.`,
      value_section_h2: '¿Por qué elegirnos?',
      value_section_body: 'Combinamos experiencia técnica certificada con servicio post-instalación integral. Cada proyecto cumple con las normativas vigentes y cuenta con garantía extendida.',
    },
    agency: {
      h1: `${brief.que_hace} que generan resultados reales`,
      h1_alt_a: `Tu equipo digital especializado en ${domain}`,
      h1_alt_b: `Soluciones digitales que escalan con tu empresa`,
      subheadline: `${companyName} ${brief.que_hace.toLowerCase()} para ${brief.para_quien.toLowerCase()}. Del concepto a la entrega con metodología probada.`,
      cta_primary: brief.cta_principal,
      cta_secondary: 'Ver nuestros proyectos',
      cta_micro_copy: 'Respondemos en menos de 24 horas',
      meta_title: `${companyName} — Agencia Digital | Diseño y Desarrollo`,
      meta_description: `${companyName}: ${brief.que_hace.toLowerCase()}. Resultados medibles para ${brief.para_quien.toLowerCase()}. Cuéntanos tu proyecto.`,
      value_section_h2: `¿Por qué ${companyName}?`,
      value_section_body: brief.por_que_elegirnos,
    },
    saas: {
      h1: `Automatiza tu operación y escala sin contratar más personal`,
      h1_alt_a: `El software que tu equipo necesita para trabajar 2x más rápido`,
      h1_alt_b: `Reduce el trabajo manual un 70% desde el primer día`,
      subheadline: `${companyName}: plataforma todo-en-uno para gestionar tu operación, con integraciones nativas y reportes en tiempo real.`,
      cta_primary: 'Empieza gratis',
      cta_secondary: 'Ver demo en vivo',
      cta_micro_copy: 'Sin tarjeta de crédito · 14 días gratis',
      meta_title: `${companyName} — Software para [Audiencia] | Gratis 14 días`,
      meta_description: `${companyName} automatiza tu operación y reduce trabajo manual. Sin instalaciones. Prueba gratis 14 días.`,
      value_section_h2: 'Todo lo que necesitas, en un solo lugar',
      value_section_body: 'Sin múltiples herramientas desconectadas. Sin exportar Excel. Reportes en tiempo real para tomar mejores decisiones.',
    },
    fintech: {
      h1: `Envía y recibe dinero sin comisiones, desde cualquier lugar`,
      h1_alt_a: `Tu dinero, bajo control. Siempre.`,
      h1_alt_b: `Transferencias al instante y sin costo oculto`,
      subheadline: `${companyName}: la plataforma financiera más confiable. Abre una cuenta en 5 minutos y empieza hoy.`,
      cta_primary: 'Abrir cuenta gratis',
      cta_secondary: 'Conocer planes',
      cta_micro_copy: '100% seguro · SSL 256-bit',
      meta_title: `${companyName} — Finanzas sin comisiones`,
      meta_description: `${companyName}: abre tu cuenta en 5 minutos. Envía dinero sin comisiones ocultas. Regulado y seguro.`,
      value_section_h2: 'Tu dinero, seguro y disponible siempre',
      value_section_body: 'Encriptación bancaria de 256 bits, verificación biométrica y soporte 24/7.',
    },
    industrial: {
      h1: `Equipos industriales de alta eficiencia para proyectos de gran escala`,
      h1_alt_a: `Soluciones eléctricas e industriales con respaldo técnico certificado`,
      h1_alt_b: `Infraestructura industrial confiable — desde el diseño hasta la puesta en marcha`,
      subheadline: `${companyName} provee equipos y soluciones para proyectos industriales, mineros y de infraestructura. Soporte técnico especializado incluido.`,
      cta_primary: 'Solicitar cotización técnica',
      cta_secondary: 'Ver catálogo de productos',
      cta_micro_copy: 'Respuesta técnica en menos de 24 horas',
      meta_title: `${companyName} — Equipos Industriales y Eléctricos | Cotización`,
      meta_description: `${companyName}: equipos eléctricos e industriales para proyectos de infraestructura. Transformadores, tableros, sub-estaciones. Solicita cotización técnica.`,
      value_section_h2: '¿Por qué elegir nuestros equipos?',
      value_section_body: 'Equipos certificados bajo normas internacionales, con garantía técnica y soporte post-venta especializado para proyectos industriales de toda escala.',
    },
    general: {
      h1: `${brief.que_hace || 'Soluciones especializadas'} para tu empresa`,
      h1_alt_a: `${companyName} — ${brief.por_que_elegirnos?.split('.')[0] || 'Calidad y resultados'}`,
      h1_alt_b: `Más resultados, menos complicaciones`,
      subheadline: `${companyName} ayuda a ${brief.para_quien?.toLowerCase() || 'empresas'} a ${brief.que_hace?.toLowerCase() || 'alcanzar sus objetivos'} con experiencia y metodología probada.`,
      cta_primary: brief.cta_principal || 'Contáctanos',
      cta_secondary: 'Saber más',
      cta_micro_copy: 'Sin compromiso',
      meta_title: `${companyName} — ${brief.que_hace?.split(' ').slice(0,4).join(' ') || 'Servicios especializados'}`,
      meta_description: `${companyName}: ${brief.que_hace?.toLowerCase() || 'soluciones para tu empresa'}. ${brief.por_que_elegirnos?.split('.')[0] || 'Calidad garantizada'}.`,
      value_section_h2: `¿Por qué ${companyName}?`,
      value_section_body: brief.por_que_elegirnos || 'Experiencia, confiabilidad y resultados comprobados.',
    },
  };

  const template = copyTemplates[industry] || copyTemplates.general;

  // Rewrite H2s using actual scraped content when available
  const rewrittenH2s = h2Matches.slice(0, 5).map((h2, i) => ({
    original: h2.replace(/^##\s+/, ''),
    rewritten: [
      `Nuestros ${industry === 'elevator_company' ? 'equipos y servicios' : 'servicios principales'}`,
      `Cómo trabajamos — proceso claro y sin sorpresas`,
      `Lo que dicen nuestros clientes`,
      `Resultados que hablan por sí solos`,
      `Empieza hoy — contáctanos`,
    ][i] || h2.replace(/^##\s+/, ''),
  }));

  return {
    h1: { original: currentH1, rewritten: template.h1, alternatives: [template.h1_alt_a, template.h1_alt_b] },
    subheadline: template.subheadline,
    ctas: { primary: template.cta_primary, secondary: template.cta_secondary, micro_copy: template.cta_micro_copy },
    h2s: rewrittenH2s,
    meta_title: template.meta_title,
    meta_description: template.meta_description,
    value_section: { h2: template.value_section_h2, body: template.value_section_body },
    business_brief: brief,
  };
}

// Accepts either full scrapingData or { content, meta, metadata, business, url } slice
export function runSEOCopyAgent(slice, industry) {
  // Build backward-compat scrapingData with normalized markdown field
  const scrapingData = {
    ...slice,
    markdown: slice.content?.text_preview || slice.markdown || '',
  };
  // Support both full scrapingData and new slice format
  const markdown = scrapingData.markdown;
  const metadata = slice.metadata || slice.meta || {};
  const url = slice.url || '';
  if (!industry) industry = slice.business?.industry || slice.industria_detectada || 'general';

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
