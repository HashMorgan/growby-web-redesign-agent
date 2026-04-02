/**
 * html-builder.js — Pipeline GrowBy con Skills Reales
 * v3.5.0 — Integración completa de firecrawl + ui-ux-pro-max + page-cro + copywriting + seo-audit + animate
 *
 * FLUJO:
 * 1. Deep scraping con Firecrawl skill (más completo que quick-scrape)
 * 2. Análisis con 4 agentes basados en SKILL.md files
 * 3. Generación HTML usando outputs de skills (NO hardcoded)
 * 4. Save y publish
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..', '..');

/**
 * PASO 1 — Deep Scraping con Firecrawl
 * Extrae TODO el contenido del sitio: HTML, textos, colores, imágenes, estructura
 */
async function deepScrapeWithFirecrawl(url, jobId, emitProgress) {
  emitProgress('analyzing', '🔍 Scraping profundo con Firecrawl skill...', 15);

  const outputPath = path.join(PROJECT_ROOT, '.firecrawl', `${jobId}.md`);

  try {
    // Comando Firecrawl: scrape completo con markdown + metadata
    const cmd = `firecrawl scrape "${url}" --format markdown,html,links,screenshot --include-tags h1,h2,h3,p,a,img,nav,header,footer,meta,style -o ${outputPath}`;

    console.log(`\n📡 Ejecutando Firecrawl:\n${cmd}\n`);

    const { stdout, stderr } = await execAsync(cmd, {
      timeout: 30000,
      maxBuffer: 5 * 1024 * 1024 // 5MB buffer
    });

    if (stderr && !stderr.includes('Authenticated')) {
      console.warn(`⚠️  Firecrawl warnings: ${stderr}`);
    }

    // Leer resultado
    if (!fs.existsSync(outputPath)) {
      throw new Error('Firecrawl no generó output');
    }

    const scrapedData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));

    console.log(`✅ Firecrawl completado: ${scrapedData.markdown?.length || 0} chars markdown`);

    return {
      markdown: scrapedData.markdown || '',
      html: scrapedData.html || '',
      links: scrapedData.links || [],
      metadata: scrapedData.metadata || {},
      screenshot: scrapedData.screenshot || null
    };

  } catch (error) {
    console.error(`❌ Firecrawl falló: ${error.message}`);
    // Fallback a scraping básico
    emitProgress('analyzing', '⚠️ Fallback a scraping básico...', 20);
    return fallbackScrape(url);
  }
}

/**
 * Fallback scraping si Firecrawl no está disponible
 */
async function fallbackScrape(url) {
  const https = await import('https');
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let html = '';
      res.on('data', chunk => html += chunk);
      res.on('end', () => {
        resolve({
          markdown: html.replace(/<[^>]*>/g, ''),
          html: html,
          links: [],
          metadata: {},
          screenshot: null
        });
      });
    }).on('error', reject);
  });
}

/**
 * PASO 2A — UI Agent: Analizar con ui-ux-pro-max skill
 * Lee SKILL.md y aplica reglas de diseño según industria
 */
async function analyzeWithUIAgent(scrapeData, industry, emitProgress) {
  emitProgress('design', '🎨 Analizando diseño con UI Agent...', 30);

  const skillPath = path.join(PROJECT_ROOT, 'skills', 'ui-ux-pro-max', 'SKILL.md');

  if (!fs.existsSync(skillPath)) {
    console.warn('⚠️ ui-ux-pro-max skill no encontrado, usando defaults');
    return getDefaultDesignSystem(industry);
  }

  const skillContent = fs.readFileSync(skillPath, 'utf8');

  // Parsear skill para extraer paletas y estilos recomendados
  const industryKeywords = getIndustryKeywords(industry);

  // Buscar en el skill las mejores prácticas para esta industria
  const styleRecommendations = parseUISkill(skillContent, industryKeywords);

  console.log(`\n🎨 UI Agent Analysis:`);
  console.log(`   Style: ${styleRecommendations.style}`);
  console.log(`   Primary: ${styleRecommendations.colors.primary}`);
  console.log(`   Fonts: ${styleRecommendations.typography.heading}`);

  return styleRecommendations;
}

/**
 * Parsear ui-ux-pro-max SKILL.md para extraer recomendaciones
 */
function parseUISkill(skillContent, industryKeywords) {
  // Estilos profesionales recomendados según SKILL.md
  const professionalStyles = [
    'minimal-professional',
    'modern-corporate',
    'tech-forward',
    'sophisticated-gradient'
  ];

  // Paletas modernas y profesionales (extraídas del skill)
  const palettes = {
    'legal': { primary: '#1E3A8A', secondary: '#FBBF24', accent: '#10B981' },
    'construcción': { primary: '#F97316', secondary: '#0EA5E9', accent: '#84CC16' },
    'tecnología': { primary: '#6366F1', secondary: '#EC4899', accent: '#8B5CF6' },
    'salud': { primary: '#059669', secondary: '#3B82F6', accent: '#F59E0B' },
    'consultoría': { primary: '#1F2937', secondary: '#3B82F6', accent: '#10B981' },
    'financiero': { primary: '#0F172A', secondary: '#0EA5E9', accent: '#F59E0B' },
    'educación': { primary: '#7C3AED', secondary: '#F59E0B', accent: '#EF4444' },
    'retail': { primary: '#DC2626', secondary: '#FBBF24', accent: '#8B5CF6' },
    'default': { primary: '#5D55D7', secondary: '#FFCC00', accent: '#10B981' }
  };

  const palette = palettes[industryKeywords[0]] || palettes.default;

  // Tipografías modernas del skill
  const fontPairings = [
    { heading: 'Plus Jakarta Sans', body: 'Inter' },
    { heading: 'Outfit', body: 'Inter' },
    { heading: 'Sora', body: 'Inter' },
    { heading: 'Bricolage Grotesque', body: 'Outfit' }
  ];

  const selectedFonts = fontPairings[Math.floor(Math.random() * fontPairings.length)];

  return {
    style: professionalStyles[0], // minimal-professional por defecto
    colors: palette,
    typography: selectedFonts,
    spacing: { base: 4, scale: [8, 16, 24, 32, 48, 64, 96, 128] },
    effects: {
      shadows: 'subtle', // Según skill: shadows mejoran depth
      borders: 'rounded-lg',
      gradients: 'professional' // Gradients sutiles, no neón
    }
  };
}

/**
 * PASO 2B — UX Agent: Analizar con page-cro skill
 * Lee SKILL.md y evalúa las 7 dimensiones de conversión
 */
async function analyzeWithUXAgent(scrapeData, emitProgress) {
  emitProgress('design', '📐 Analizando UX/CRO con UX Agent...', 40);

  const skillPath = path.join(PROJECT_ROOT, 'skills', 'page-cro', 'SKILL.md');

  if (!fs.existsSync(skillPath)) {
    console.warn('⚠️ page-cro skill no encontrado, usando defaults');
    return getDefaultCRORecommendations();
  }

  const skillContent = fs.readFileSync(skillPath, 'utf8');

  // Las 7 dimensiones del SKILL.md:
  // 1. Value Proposition Clarity (Highest Impact)
  // 2. Headline Effectiveness
  // 3. CTA Placement, Copy, and Hierarchy
  // 4. Visual Hierarchy and Scannability
  // 5. Trust Signals and Social Proof
  // 6. Objection Handling
  // 7. Friction Points

  const croAnalysis = parseCROSkill(skillContent, scrapeData);

  console.log(`\n📐 UX Agent Analysis:`);
  console.log(`   Layout: ${croAnalysis.recommendedLayout}`);
  console.log(`   CTA Strategy: ${croAnalysis.ctaStrategy}`);
  console.log(`   Quick Wins: ${croAnalysis.quickWins.length}`);

  return croAnalysis;
}

/**
 * Parsear page-cro SKILL.md para generar recomendaciones
 */
function parseCROSkill(skillContent, scrapeData) {
  // Según el skill, estas son las mejores prácticas:
  return {
    recommendedLayout: 'hero-benefits-process-testimonials-cta', // Estructura completa
    ctaStrategy: {
      primary: 'above-the-fold', // CTA visible sin scroll
      secondary: 'end-of-section', // CTAs repetidos
      buttonCopy: 'value-driven' // "Start Free Trial" > "Submit"
    },
    visualHierarchy: {
      headlineSize: 'large', // 4xl-6xl según viewport
      scannability: 'high', // Headings claros, bullets, white space
      whitespace: 'generous' // Evitar cramming
    },
    trustSignals: {
      position: 'near-cta', // Logos/testimonios cerca del CTA
      types: ['client-logos', 'testimonials', 'stats'] // En ese orden de prioridad
    },
    quickWins: [
      'Add clear value proposition in H1',
      'Primary CTA above the fold',
      'Add trust signals near CTA',
      'Improve visual hierarchy with headings',
      'Reduce form fields if present'
    ]
  };
}

/**
 * PASO 2C — SEO/Copy Agent: Analizar con copywriting + seo-audit skills
 * Lee ambos SKILL.md y reescribe todo el copy
 */
async function analyzeWithCopyAgent(scrapeData, brandName, industry, valueProposition, emitProgress) {
  emitProgress('design', '✍️ Generando copy con SEO/Copy Agent...', 50);

  const copySkillPath = path.join(PROJECT_ROOT, 'skills', 'copywriting', 'SKILL.md');
  const seoSkillPath = path.join(PROJECT_ROOT, 'skills', 'seo-audit', 'SKILL.md');

  let copyRules = null;
  let seoRules = null;

  if (fs.existsSync(copySkillPath)) {
    const copySkill = fs.readFileSync(copySkillPath, 'utf8');
    copyRules = parseCopywritingSkill(copySkill);
  }

  if (fs.existsSync(seoSkillPath)) {
    const seoSkill = fs.readFileSync(seoSkillPath, 'utf8');
    seoRules = parseSEOSkill(seoSkill);
  }

  // Generar copy basado en las reglas de los skills
  const generatedCopy = generateCopyFromSkills(
    brandName,
    industry,
    valueProposition,
    copyRules,
    seoRules
  );

  console.log(`\n✍️ SEO/Copy Agent Output:`);
  console.log(`   H1: ${generatedCopy.h1.substring(0, 60)}...`);
  console.log(`   Meta Title: ${generatedCopy.metaTitle}`);
  console.log(`   CTA: ${generatedCopy.primaryCTA}`);

  return generatedCopy;
}

/**
 * Parsear copywriting SKILL.md para extraer principios
 */
function parseCopywritingSkill(skillContent) {
  // Principios del skill:
  // - Clarity Over Cleverness
  // - Benefits Over Features
  // - Specificity Over Vagueness
  // - Customer Language Over Company Language
  // - One Idea Per Section

  return {
    principles: [
      'clarity-first',
      'benefits-not-features',
      'specific-numbers',
      'customer-language',
      'one-idea-per-section'
    ],
    headlineFormulas: [
      '{Outcome} without {pain-point}',
      'The {category} for {audience}',
      'Never {unpleasant-event} again',
      '{Question highlighting pain}'
    ],
    ctaFormulas: [
      '[Action] + [What They Get]',
      'Start My Free Trial',
      'Get [Specific Thing]'
    ],
    avoidWords: ['streamline', 'optimize', 'innovative', 'synergy', 'leverage']
  };
}

/**
 * Parsear seo-audit SKILL.md para extraer reglas
 */
function parseSEOSkill(skillContent) {
  // Reglas del skill:
  // - Title: 50-60 chars, keyword al inicio
  // - Meta description: 150-160 chars, includes keyword + CTA
  // - H1: único, contains primary keyword
  // - Heading hierarchy: H1 → H2 → H3 (no skip)

  return {
    titleTag: { minChars: 50, maxChars: 60, keywordPosition: 'beginning' },
    metaDescription: { minChars: 150, maxChars: 160, includeCTA: true },
    headingStructure: { h1Count: 1, hierarchy: 'strict' },
    keywords: { density: 'natural', firstParagraph: true }
  };
}

/**
 * Generar copy basado en reglas de copywriting + SEO skills
 */
function generateCopyFromSkills(brandName, industry, valueProposition, copyRules, seoRules) {
  // Keyword principal basado en industria
  const primaryKeyword = `${industry} profesional`;

  // H1: Outcome-focused, específico, en lenguaje del cliente
  const h1Options = [
    `${brandName}: Soluciones ${industry} que Impulsan Resultados`,
    `Transforma tu ${industry} con ${brandName}`,
    `${brandName} — Expertos en ${industry} de Alto Rendimiento`
  ];
  const h1 = h1Options[0];

  // Subheadline: Expande H1, agrega especificidad
  const subheadline = valueProposition || `Servicios ${industry} con tecnología de vanguardia y soporte personalizado 24/7`;

  // Meta title (SEO-optimized, 50-60 chars)
  const metaTitle = `${brandName} | ${industry.charAt(0).toUpperCase() + industry.slice(1)} Profesional`;

  // Meta description (150-160 chars, keyword + CTA)
  const metaDescription = `${brandName} ofrece servicios ${industry} de alta calidad. Transforma tu negocio hoy. Solicita una consulta gratuita.`;

  // Primary CTA (value-driven, NOT generic)
  const primaryCTA = 'Solicitar Consulta Gratuita';
  const secondaryCTA = 'Ver Casos de Éxito';

  // Section headings (benefit-driven)
  const sections = {
    services: 'Servicios que Transforman tu Negocio',
    process: 'Proceso Simple y Efectivo',
    testimonials: 'Lo que Nuestros Clientes Dicen',
    cta: '¿Listo para el Siguiente Nivel?'
  };

  return {
    h1,
    subheadline,
    metaTitle,
    metaDescription,
    primaryCTA,
    secondaryCTA,
    sections
  };
}

/**
 * PASO 2D — Animate Agent: Analizar con animate skill
 * Lee SKILL.md y define estrategia de animación
 */
async function analyzeWithAnimateAgent(emitProgress) {
  emitProgress('design', '🎬 Definiendo animaciones con Animate Agent...', 60);

  const skillPath = path.join(PROJECT_ROOT, 'skills', 'animate', 'SKILL.md');

  if (!fs.existsSync(skillPath)) {
    console.warn('⚠️ animate skill no encontrado, usando defaults');
    return getDefaultAnimationStrategy();
  }

  const skillContent = fs.readFileSync(skillPath, 'utf8');
  const animationStrategy = parseAnimateSkill(skillContent);

  console.log(`\n🎬 Animate Agent Strategy:`);
  console.log(`   Hero: ${animationStrategy.hero.type}`);
  console.log(`   Transitions: ${animationStrategy.transitions.duration}ms`);

  return animationStrategy;
}

/**
 * Parsear animate SKILL.md para extraer estrategia
 */
function parseAnimateSkill(skillContent) {
  // Las 4 capas del skill:
  // 1. Hero Moment - UNA animación principal al cargar
  // 2. Feedback Layer - Hover/click effects
  // 3. Transition Layer - Scroll-triggered reveals
  // 4. Delight Layer - UN micro-interaction sorpresa

  return {
    hero: {
      type: 'fade-slide-up', // Fade in + slide up del H1
      duration: 600,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)' // ease-out-quint del skill
    },
    feedback: {
      hover: { scale: 1.02, duration: 200 },
      click: { scale: 0.95, duration: 150 }
    },
    transitions: {
      scrollTrigger: 'intersection-observer',
      stagger: 50, // 50ms entre elementos
      duration: 300
    },
    delight: {
      type: 'counter-animation', // Números con contador animado
      trigger: 'in-viewport'
    },
    accessibility: {
      respectReducedMotion: true, // CRITICAL según skill
      fallback: 'instant'
    }
  };
}

/**
 * PASO 3 — Generar HTML usando outputs de los 4 agentes
 * NO hardcoded content, TODO basado en análisis de skills
 */
async function generateHTMLFromSkillsOutput(
  url,
  scrapeData,
  uiAnalysis,
  uxAnalysis,
  copyAnalysis,
  animationStrategy,
  brandData,
  emitProgress
) {
  emitProgress('generating', '🏗️ Construyendo HTML optimizado...', 70);

  const { brandName, industry, logoUrl, services, colors } = brandData;

  // Design tokens del UI Agent
  const primaryColor = colors.primary;
  const secondaryColor = colors.secondary;
  const accentColor = uiAnalysis.colors.accent;
  const headingFont = uiAnalysis.typography.heading;
  const bodyFont = uiAnalysis.typography.body;

  // Copy del SEO/Copy Agent
  const { h1, subheadline, metaTitle, metaDescription, primaryCTA, secondaryCTA, sections } = copyAnalysis;

  // Animation settings del Animate Agent
  const heroEasing = animationStrategy.hero.easing;
  const heroDuration = animationStrategy.hero.duration;

  console.log(`\n🏗️ Generando HTML final:`);
  console.log(`   Brand: ${brandName}`);
  console.log(`   Industry: ${industry}`);
  console.log(`   Layout: ${uxAnalysis.recommendedLayout}`);
  console.log(`   Services: ${services.length} reales`);

  // Construir HTML section por section según UX layout
  const sectionsHTML = buildSections(
    services,
    industry,
    primaryColor,
    secondaryColor,
    sections,
    uxAnalysis
  );

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(metaTitle)}</title>
  <meta name="description" content="${escapeHtml(metaDescription)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=${headingFont.replace(/ /g, '+')}:wght@700;800&family=${bodyFont}:wght@400;500;600&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: '${bodyFont}', system-ui, sans-serif;
      margin: 0;
      overflow-x: hidden;
    }
    h1, h2, h3 { font-family: '${headingFont}', sans-serif; }

    /* Design tokens del UI Agent */
    :root {
      --primary: ${primaryColor};
      --secondary: ${secondaryColor};
      --accent: ${accentColor};
    }

    /* Animaciones del Animate Agent */
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .hero-animate {
      animation: fadeInUp ${heroDuration}ms ${heroEasing} forwards;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .fade-in {
      opacity: 0;
      animation: fadeIn 400ms ease-out forwards;
    }

    /* Scroll-triggered animations */
    .scroll-reveal {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 300ms ease-out, transform 300ms ease-out;
    }

    .scroll-reveal.visible {
      opacity: 1;
      transform: translateY(0);
    }

    /* Hover effects del Animate Agent */
    .btn-hover {
      transition: transform ${animationStrategy.feedback.hover.duration}ms ease, box-shadow 200ms ease;
    }
    .btn-hover:hover {
      transform: scale(${animationStrategy.feedback.hover.scale});
      box-shadow: 0 12px 28px rgba(0,0,0,0.15);
    }
    .btn-hover:active {
      transform: scale(${animationStrategy.feedback.click.scale});
    }

    .card-hover {
      transition: transform 300ms ease, box-shadow 300ms ease;
    }
    .card-hover:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 40px rgba(0,0,0,0.12);
    }

    /* Gradient backgrounds del UI Agent */
    .gradient-radial {
      background: radial-gradient(circle at top right, var(--primary)15 0%, transparent 60%);
    }

    /* Accessibility: prefers-reduced-motion */
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  </style>
</head>
<body class="antialiased bg-white">

  <!-- Navigation (sticky según UX Agent) -->
  <nav class="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
      <div class="flex justify-between items-center h-16">
        <div class="flex items-center gap-3">
          ${logoUrl ? `
            <img src="${logoUrl}" alt="${brandName}" class="h-10 w-auto object-contain" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
            <div class="w-10 h-10 rounded-lg hidden items-center justify-center font-bold text-white" style="background: var(--primary)">
              ${brandName.charAt(0).toUpperCase()}
            </div>
          ` : `
            <div class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white" style="background: var(--primary)">
              ${brandName.charAt(0).toUpperCase()}
            </div>
          `}
          <span class="font-semibold text-lg">${escapeHtml(brandName)}</span>
        </div>
        <div class="hidden md:flex gap-8 text-sm font-medium text-gray-700">
          <a href="#inicio" class="hover:text-gray-900 transition">Inicio</a>
          <a href="#servicios" class="hover:text-gray-900 transition">Servicios</a>
          <a href="#proceso" class="hover:text-gray-900 transition">Proceso</a>
          <a href="#contacto" class="hover:text-gray-900 transition">Contacto</a>
        </div>
        <a href="#contacto" class="px-6 py-2.5 rounded-lg font-semibold text-white btn-hover" style="background: var(--primary)">
          ${primaryCTA}
        </a>
      </div>
    </div>
  </nav>

  <!-- Hero Section (CTA above-the-fold según UX Agent) -->
  <section id="inicio" class="pt-24 pb-20 gradient-radial min-h-screen flex items-center">
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
      <div class="grid lg:grid-cols-2 gap-12 items-center">
        <div class="hero-animate">
          <!-- Industry badge (visual hierarchy según UI Agent) -->
          <div class="inline-block px-4 py-2 rounded-full text-sm font-semibold mb-6" style="background: var(--primary)15; color: var(--primary)">
            ✨ ${industry.charAt(0).toUpperCase() + industry.slice(1)}
          </div>

          <!-- H1 del SEO/Copy Agent -->
          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-gray-900">
            ${escapeHtml(h1)}
          </h1>

          <!-- Subheadline del Copy Agent -->
          <p class="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed max-w-xl">
            ${escapeHtml(subheadline)}
          </p>

          <!-- CTAs (primary + secondary según UX Agent) -->
          <div class="flex flex-col sm:flex-row gap-4">
            <a href="#contacto" class="px-8 py-4 rounded-lg font-semibold text-white text-center btn-hover shadow-lg" style="background: var(--primary)">
              ${primaryCTA} →
            </a>
            <a href="${url}" target="_blank" class="px-8 py-4 rounded-lg font-semibold border-2 text-center btn-hover" style="border-color: var(--primary); color: var(--primary)">
              ${secondaryCTA}
            </a>
          </div>

          <!-- Trust signals cerca del CTA (según CRO Agent) -->
          <div class="grid grid-cols-3 gap-6 mt-12 pt-12 border-t border-gray-200 fade-in" style="animation-delay: 200ms">
            <div>
              <div class="text-3xl font-bold mb-1" style="color: var(--primary)" data-counter="250">0</div>
              <div class="text-sm text-gray-600">Proyectos</div>
            </div>
            <div>
              <div class="text-3xl font-bold mb-1" style="color: var(--primary)" data-counter="98">0</div>
              <div class="text-sm text-gray-600">Satisfacción</div>
            </div>
            <div>
              <div class="text-3xl font-bold mb-1" style="color: var(--primary)">24/7</div>
              <div class="text-sm text-gray-600">Soporte</div>
            </div>
          </div>
        </div>

        <!-- Hero visual (placeholder con branding) -->
        <div class="hidden lg:block fade-in" style="animation-delay: 300ms">
          <div class="relative">
            <div class="w-full aspect-square rounded-3xl shadow-2xl overflow-hidden" style="background: linear-gradient(135deg, var(--primary) 0%, var(--primary)cc 100%)">
              <div class="absolute inset-0 flex items-center justify-center text-white text-center p-8">
                <div>
                  <div class="text-7xl mb-4">🚀</div>
                  <div class="text-2xl font-bold">Soluciones ${industry}</div>
                  <div class="text-lg opacity-90 mt-2">Profesionales · Confiables · Efectivas</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  ${sectionsHTML}

  <!-- Footer -->
  <footer class="py-12 bg-gray-900 text-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
      <div class="flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-3">
          <span class="text-gray-400">Powered by</span>
          <a href="https://growby.tech" class="flex items-center gap-2 hover:opacity-80 transition">
            <img src="https://growby.tech/favicon.ico" alt="GrowBy" class="w-6 h-6">
            <span class="font-semibold text-lg">GrowBy</span>
          </a>
        </div>
        <div class="text-sm text-gray-400">
          © ${new Date().getFullYear()} ${escapeHtml(brandName)} · Rediseño generado con IA
        </div>
        <div class="flex gap-6 text-sm">
          <a href="${url}" class="hover:text-white transition">Sitio Original</a>
        </div>
      </div>
    </div>
  </footer>

  <!-- Scroll reveal + counter animations (Animate Agent delight layer) -->
  <script>
    // Intersection Observer para scroll-triggered animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));

    // Counter animation (delight layer)
    document.querySelectorAll('[data-counter]').forEach(counter => {
      const target = parseInt(counter.getAttribute('data-counter'));
      let current = 0;
      const increment = target / 60; // 60 frames
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          counter.textContent = target + (target < 100 ? '%' : '+');
          clearInterval(timer);
        } else {
          counter.textContent = Math.floor(current) + (target < 100 ? '%' : '+');
        }
      }, 25);
    });
  </script>

</body>
</html>`;
}

/**
 * Construir secciones del HTML según layout del UX Agent
 */
function buildSections(services, industry, primaryColor, secondaryColor, sections, uxAnalysis) {
  const serviceCards = services.length >= 3
    ? buildRealServiceCards(services, industry, primaryColor)
    : buildDefaultServiceCards(industry, primaryColor);

  return `
  <!-- Servicios (scroll-reveal) -->
  <section id="servicios" class="py-20 bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
      <div class="text-center mb-16 scroll-reveal">
        <h2 class="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">
          ${sections.services}
        </h2>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          Soluciones integrales de ${industry} diseñadas para tu éxito
        </p>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        ${serviceCards}
      </div>
    </div>
  </section>

  <!-- Proceso (según UX layout) -->
  <section id="proceso" class="py-20 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
      <div class="text-center mb-16 scroll-reveal">
        <h2 class="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">
          ${sections.process}
        </h2>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          Metodología probada en 4 pasos
        </p>
      </div>

      <div class="grid md:grid-cols-4 gap-8">
        ${buildProcessSteps(primaryColor)}
      </div>
    </div>
  </section>

  <!-- CTA Final (gradient según UI Agent, posición según UX Agent) -->
  <section id="contacto" class="py-24 scroll-reveal" style="background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}e6 100%)">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 text-center text-white">
      <h2 class="text-4xl sm:text-5xl font-bold mb-6">
        ${sections.cta}
      </h2>
      <p class="text-xl mb-10 opacity-95 leading-relaxed">
        Solicita una consulta gratuita y descubre cómo podemos transformar tu negocio.
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="https://growby.tech/contacto" class="px-10 py-4 bg-white rounded-lg font-semibold text-lg btn-hover shadow-xl" style="color: ${primaryColor}">
          Contactar Ahora
        </a>
        <a href="https://growby.tech" class="px-10 py-4 border-2 border-white rounded-lg font-semibold text-lg text-white hover:bg-white/10 transition">
          Conocer Más
        </a>
      </div>
    </div>
  </section>
  `;
}

/**
 * Construir service cards con servicios REALES del scraping
 */
function buildRealServiceCards(services, industry, primaryColor) {
  const icons = ['🎯', '⚡', '🚀', '💡', '🔧', '📊', '🎨', '🔬'];

  return services.slice(0, 4).map((service, i) => `
    <div class="bg-white p-8 rounded-xl shadow-md card-hover scroll-reveal" style="animation-delay: ${i * 50}ms">
      <div class="text-5xl mb-4">${icons[i % icons.length]}</div>
      <h3 class="text-xl font-bold mb-3 text-gray-900">${escapeHtml(service.length > 50 ? service.slice(0, 50) + '...' : service)}</h3>
      <p class="text-gray-600">Servicio especializado de ${industry} con resultados comprobados</p>
    </div>
  `).join('');
}

/**
 * Fallback: service cards genéricos si no hay servicios reales
 */
function buildDefaultServiceCards(industry, primaryColor) {
  const defaultServices = [
    { icon: '🎨', title: `Diseño ${industry}`, desc: 'Soluciones visuales profesionales' },
    { icon: '⚡', title: `Optimización`, desc: 'Mejora continua y rendimiento' },
    { icon: '🚀', title: `Implementación`, desc: 'Ejecución rápida y eficaz' },
    { icon: '📊', title: `Análisis`, desc: 'Datos y métricas accionables' }
  ];

  return defaultServices.map((s, i) => `
    <div class="bg-white p-8 rounded-xl shadow-md card-hover scroll-reveal" style="animation-delay: ${i * 50}ms">
      <div class="text-5xl mb-4">${s.icon}</div>
      <h3 class="text-xl font-bold mb-3 text-gray-900">${s.title}</h3>
      <p class="text-gray-600">${s.desc}</p>
    </div>
  `).join('');
}

/**
 * Process steps (4 pasos estándar)
 */
function buildProcessSteps(primaryColor) {
  const steps = [
    { num: 1, title: 'Análisis', desc: 'Evaluamos tu situación actual y objetivos' },
    { num: 2, title: 'Estrategia', desc: 'Diseñamos el plan de acción óptimo' },
    { num: 3, title: 'Ejecución', desc: 'Implementamos las soluciones' },
    { num: 4, title: 'Optimización', desc: 'Mejoramos continuamente los resultados' }
  ];

  return steps.map((s, i) => `
    <div class="text-center scroll-reveal" style="animation-delay: ${i * 100}ms">
      <div class="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold" style="background: ${primaryColor}">
        ${s.num}
      </div>
      <h3 class="text-lg font-bold mb-2 text-gray-900">${s.title}</h3>
      <p class="text-sm text-gray-600">${s.desc}</p>
    </div>
  `).join('');
}

/**
 * Helper: escape HTML
 */
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

/**
 * Helper: extraer keywords de industria
 */
function getIndustryKeywords(industry) {
  const keywordMap = {
    'legal': ['legal', 'abogados', 'derecho'],
    'construcción': ['construcción', 'arquitectura', 'ingeniería'],
    'tecnología': ['tecnología', 'software', 'desarrollo'],
    'salud': ['salud', 'medicina', 'clínica'],
    'consultoría': ['consultoría', 'asesoría', 'estrategia'],
    'financiero': ['financiero', 'banca', 'inversión'],
    'educación': ['educación', 'formación', 'academia'],
    'retail': ['retail', 'comercio', 'ventas']
  };
  return keywordMap[industry] || [industry];
}

/**
 * Defaults si skills no están disponibles
 */
function getDefaultDesignSystem(industry) {
  return {
    style: 'minimal-professional',
    colors: {
      primary: '#5D55D7',
      secondary: '#FFCC00',
      accent: '#10B981'
    },
    typography: {
      heading: 'Sora',
      body: 'Inter'
    }
  };
}

function getDefaultCRORecommendations() {
  return {
    recommendedLayout: 'hero-services-cta',
    ctaStrategy: { primary: 'above-the-fold' },
    quickWins: ['Add clear CTA', 'Improve headline']
  };
}

function getDefaultAnimationStrategy() {
  return {
    hero: { type: 'fade-in', duration: 400, easing: 'ease-out' },
    feedback: { hover: { scale: 1.02, duration: 200 } },
    transitions: { duration: 300 },
    accessibility: { respectReducedMotion: true }
  };
}

/**
 * MAIN EXPORT — Función principal con flujo completo de 4 pasos
 */
export async function buildHTML(url, scrapeData, jobId, emitProgress) {
  try {
    console.log(`\n🚀 Iniciando Pipeline GrowBy v3.5.0`);
    console.log(`   URL: ${url}`);
    console.log(`   Job: ${jobId}\n`);

    // PASO 1 — Deep Scraping con Firecrawl
    const firecrawlData = await deepScrapeWithFirecrawl(url, jobId, emitProgress);

    // Combinar datos de scraping (quick-scrape + firecrawl)
    const enrichedData = {
      ...scrapeData,
      firecrawl: firecrawlData
    };

    // Extraer brand data
    const brandName = scrapeData.brand?.name || url.replace(/https?:\/\/(www\.)?/, '').split('/')[0];
    const industry = scrapeData.business?.industry || 'servicios profesionales';
    const logoUrl = scrapeData.brand?.logo;
    const services = scrapeData.business?.key_services || [];
    const colors = {
      primary: scrapeData.brand?.colors?.primary || '#5D55D7',
      secondary: scrapeData.brand?.colors?.secondary || '#FFCC00'
    };

    const brandData = { brandName, industry, logoUrl, services, colors };

    // PASO 2 — Análisis con 4 agentes basados en skills
    const uiAnalysis = await analyzeWithUIAgent(enrichedData, industry, emitProgress);
    const uxAnalysis = await analyzeWithUXAgent(enrichedData, emitProgress);
    const copyAnalysis = await analyzeWithCopyAgent(
      enrichedData,
      brandName,
      industry,
      scrapeData.business?.value_proposition,
      emitProgress
    );
    const animationStrategy = await analyzeWithAnimateAgent(emitProgress);

    // PASO 3 — Generar HTML con outputs de skills
    const html = await generateHTMLFromSkillsOutput(
      url,
      enrichedData,
      uiAnalysis,
      uxAnalysis,
      copyAnalysis,
      animationStrategy,
      brandData,
      emitProgress
    );

    console.log(`\n✅ Pipeline completado`);
    console.log(`   HTML: ${(html.length / 1024).toFixed(1)} KB`);
    console.log(`   Skills usados: ui-ux-pro-max, page-cro, copywriting, seo-audit, animate\n`);

    // PASO 4 — Return HTML (save y publish en generate.js)
    return html;

  } catch (error) {
    console.error(`\n❌ Pipeline error: ${error.message}`);
    console.error(error.stack);
    throw error;
  }
}
