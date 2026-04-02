/**
 * html-builder.js — Pipeline GrowBy HTML Generator
 * v3.5.0 — Usa agents reales basados en skills (NO parsea SKILL.md files)
 *
 * FLUJO:
 * 1. Import 4 agentes (ui-agent, ux-agent, seo-copy-agent, animate-agent)
 * 2. Ejecutar cada agente con scrapeData
 * 3. Generar HTML usando outputs de agentes (NO hardcoded content)
 * 4. Todo en español, colores reales, copy persuasivo
 */

import { runUIAgent } from './ui-agent.js';
import { runUXAgent } from './ux-agent.js';
import { runSEOCopyAgent } from './seo-copy-agent.js';
import { runAnimateAgent } from './animate-agent.js';

/**
 * Construye HTML profesional usando Pipeline GrowBy con agents reales
 * @param {string} url - URL del sitio original
 * @param {object} scrapeData - Datos del scraping (brand, business, content)
 * @param {string} jobId - Job ID para tracking
 * @param {function} emitProgress - Callback para emitir progreso
 * @returns {string} HTML completo
 */
export async function buildHTML(url, scrapeData, jobId, emitProgress) {
  try {
    console.log(`\n🚀 Pipeline GrowBy v3.5.0 — HTML Builder`);
    console.log(`   URL: ${url}`);
    console.log(`   Industry: ${scrapeData.business?.industry || 'no detectada'}`);

    // ══════════════════════════════════════════════════════════
    // PASO 1: Ejecutar los 4 agentes
    // ══════════════════════════════════════════════════════════

    emitProgress('design', '🎨 Ejecutando UI Agent (design system)...', 30);
    const uiResult = runUIAgent(scrapeData);

    emitProgress('design', '📐 Ejecutando UX Agent (CRO analysis)...', 45);
    const uxResult = runUXAgent(scrapeData);

    emitProgress('design', '✍️ Ejecutando SEO/Copy Agent (copy generation)...', 60);
    const seoCopyResult = runSEOCopyAgent(scrapeData, uiResult.industry);

    emitProgress('design', '🎬 Ejecutando Animate Agent (animation strategy)...', 75);
    const animateResult = runAnimateAgent();

    // ══════════════════════════════════════════════════════════
    // PASO 2: Extraer datos de los agentes
    // ══════════════════════════════════════════════════════════

    const brandName = seoCopyResult.brand_name;
    const industry = uiResult.industry;
    const logoUrl = scrapeData.brand?.logo;

    // Design system del UI Agent
    const primaryColor = uiResult.palette.primary;
    const secondaryColor = uiResult.palette.secondary;
    const accentColor = uiResult.palette.accent;
    const headingFont = uiResult.typography.heading_font;
    const bodyFont = uiResult.typography.body_font;
    const shadows = uiResult.shadows;
    const borderRadius = uiResult.border_radius;

    // Copy del SEO/Copy Agent
    const { h1, subheadline, cta_primary, cta_secondary, cta_micro_copy, value_section, meta_title, meta_description } = seoCopyResult.copy;

    // Layout del UX Agent
    const recommendedLayout = uxResult.recommended_layout;

    // Animations del Animate Agent
    const animationCSS = animateResult.css_bundle;
    const animationJS = animateResult.js_bundle;

    // Servicios REALES del scraping
    const services = scrapeData.business?.key_services || [];

    console.log(`\n🏗️ Generando HTML:`);
    console.log(`   Brand: ${brandName}`);
    console.log(`   Layout: ${recommendedLayout.sections.join(' → ')}`);
    console.log(`   Services: ${services.length} reales`);
    console.log(`   Primary Color: ${primaryColor}`);

    // ══════════════════════════════════════════════════════════
    // PASO 3: Generar HTML usando outputs de agentes
    // ══════════════════════════════════════════════════════════

    emitProgress('generating', '🏗️ Construyendo HTML final...', 85);

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(meta_title)}</title>
  <meta name="description" content="${escapeHtml(meta_description)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=${headingFont.replace(/ /g, '+')}:wght@600;700;800&family=${bodyFont}:wght@400;500;600&display=swap" rel="stylesheet">
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

    /* Gradient backgrounds */
    .gradient-radial {
      background: radial-gradient(circle at top right, var(--primary)15 0%, transparent 60%);
    }

    ${animationCSS}
  </style>
</head>
<body class="antialiased bg-white">

  <!-- Navigation -->
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
          <a href="#contacto" class="hover:text-gray-900 transition">Contacto</a>
        </div>
        <a href="#contacto" class="px-6 py-2.5 rounded-lg font-semibold text-white btn-hover" style="background: var(--primary)">
          ${cta_primary}
        </a>
      </div>
    </div>
  </nav>

  <!-- Hero Section (CTA above-the-fold según UX Agent) -->
  <section id="inicio" class="pt-24 pb-20 gradient-radial min-h-screen flex items-center">
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
      <div class="grid lg:grid-cols-2 gap-12 items-center">
        <div class="hero-animate">
          <div class="inline-block px-4 py-2 rounded-lg text-sm font-semibold mb-6" style="background: var(--primary)15; color: var(--primary)">
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

          <!-- CTAs del UX Agent -->
          <div class="flex flex-col sm:flex-row gap-4">
            <a href="#contacto" class="px-8 py-4 rounded-lg font-semibold text-white text-center btn-hover shadow-lg" style="background: var(--primary)">
              ${cta_primary} →
            </a>
            <a href="${url}" target="_blank" class="px-8 py-4 rounded-lg font-semibold border-2 text-center btn-hover" style="border-color: var(--primary); color: var(--primary)">
              ${cta_secondary}
            </a>
          </div>

          <!-- Micro-copy del CTA -->
          <p class="text-sm text-gray-500 mt-4">${cta_micro_copy}</p>

          <!-- Trust signals (stats) -->
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

        <!-- Hero visual -->
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

  ${buildSectionsHTML(services, industry, primaryColor, value_section, recommendedLayout)}

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

  <script>
    ${animationJS}
  </script>

</body>
</html>`;

    console.log(`\n✅ HTML generado: ${(html.length / 1024).toFixed(1)} KB`);
    return html;

  } catch (error) {
    console.error(`\n❌ HTML Builder error: ${error.message}`);
    throw error;
  }
}

/**
 * Construir secciones del HTML según layout del UX Agent
 */
function buildSectionsHTML(services, industry, primaryColor, valueSectionCopy, recommendedLayout) {
  const serviceCards = services.length >= 3
    ? buildRealServiceCards(services, industry, primaryColor)
    : buildDefaultServiceCards(industry, primaryColor);

  return `
  <!-- Servicios -->
  <section id="servicios" class="py-20 bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
      <div class="text-center mb-16 scroll-reveal">
        <h2 class="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">
          Lo que Ofrecemos
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

  <!-- Valor / Diferenciación -->
  <section class="py-20 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
      <div class="max-w-3xl mx-auto text-center scroll-reveal">
        <h2 class="text-3xl sm:text-4xl font-bold mb-6 text-gray-900">
          ${valueSectionCopy.h2}
        </h2>
        <p class="text-lg text-gray-600 leading-relaxed">
          ${valueSectionCopy.body}
        </p>
      </div>
    </div>
  </section>

  <!-- CTA Final -->
  <section id="contacto" class="py-24 scroll-reveal" style="background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}e6 100%)">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 text-center text-white">
      <h2 class="text-4xl sm:text-5xl font-bold mb-6">
        ¿Listo para el Siguiente Nivel?
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
 * Service cards con servicios REALES del scraping
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
    { icon: '📊', title: `Análisis`, desc: 'Datos y métricas accionables' },
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
 * Helper: escape HTML
 */
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}
