/**
 * html-builder.js — Pipeline GrowBy HTML Generator
 * v3.3.0 — Generación profesional con skills propios (ui-ux-pro-max, page-cro, copywriting)
 *
 * Diseño visual DIFERENTE de Stitch:
 * - Layout asimétrico con sidebar
 * - Secciones más robustas (stats, testimonials, proceso)
 * - Copy adaptado al context del usuario
 * - Visual identity preservada (colores del sitio original)
 */

/**
 * Construye HTML profesional usando Pipeline GrowBy
 * @param {string} url - URL del sitio original
 * @param {object} scrapeData - Datos del scraping (title, description, context, clientObjective)
 * @param {object} designSystem - Design system (customColor, fonts)
 * @returns {string} HTML completo
 */
export function buildHTML(url, scrapeData, designSystem = null) {
  const title = scrapeData.title || 'Rediseño Profesional';
  const description = scrapeData.description || 'Mejoramos tu presencia digital';
  const context = scrapeData.context || scrapeData.clientObjective || '';

  // Datos REALES del scraping
  const brandName = scrapeData.brand?.name || designSystem?.brand?.name || url.replace(/https?:\/\/(www\.)?/, '').split('/')[0];
  const industry = scrapeData.business?.industry || designSystem?.brand?.industry || 'servicios profesionales';
  const realServices = scrapeData.business?.key_services || [];
  const valueProposition = scrapeData.business?.value_proposition || description;
  const logoUrl = scrapeData.brand?.logo;

  // Colores REALES del cliente
  const primaryColor = scrapeData.brand?.colors?.primary || designSystem?.theme?.customColor || '#5D55D7';
  const secondaryColor = scrapeData.brand?.colors?.secondary || designSystem?.theme?.secondaryColor || '#FFCC00';
  const headlineFont = designSystem?.theme?.headlineFont || 'Sora';
  const bodyFont = designSystem?.theme?.bodyFont || 'Inter';

  console.log(`\n🎨 Building HTML for: ${brandName}`);
  console.log(`   Industry: ${industry}`);
  console.log(`   Primary: ${primaryColor}`);
  console.log(`   Services: ${realServices.slice(0, 3).join(', ')}`);

  // Generar copy adaptado al context y datos reales
  const heroTitle = context.includes('modernizar') || context.includes('cambio total')
    ? `${brandName}: Nueva Era Digital`
    : context.includes('conversión') || context.includes('ventas')
    ? `Impulsa tus Resultados con ${brandName}`
    : `${brandName}: ${title.split(' - ')[0] || 'Excelencia Profesional'}`;

  const heroSubtitle = valueProposition || (context.length > 150 ? context.slice(0, 150) + '...' : context) || description;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=${headlineFont}:wght@700;800&family=${bodyFont}:wght@400;500;600&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: '${bodyFont}', system-ui, sans-serif;
      margin: 0;
      overflow-x: hidden;
    }
    h1, h2, h3 { font-family: '${headlineFont}', sans-serif; }

    /* Smooth scroll */
    html { scroll-behavior: smooth; }

    /* Gradient backgrounds */
    .gradient-radial {
      background: radial-gradient(circle at top right, ${primaryColor}15 0%, transparent 60%);
    }

    /* Animations */
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .fade-in-up { animation: fadeInUp 0.6s ease forwards; }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    .float { animation: float 3s ease-in-out infinite; }

    /* Hover effects */
    .card-hover {
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .card-hover:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 40px rgba(0,0,0,0.12);
    }
  </style>
</head>
<body class="antialiased bg-white">

  <!-- Navigation -->
  <nav class="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
      <div class="flex justify-between items-center h-16">
        <div class="flex items-center gap-2">
          ${logoUrl ? `
            <img src="${logoUrl}" alt="${brandName}" class="h-10 w-auto object-contain" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
            <div class="w-10 h-10 rounded-lg hidden items-center justify-center font-bold text-white" style="background: ${primaryColor}">
              ${brandName.charAt(0).toUpperCase()}
            </div>
          ` : `
            <div class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white" style="background: ${primaryColor}">
              ${brandName.charAt(0).toUpperCase()}
            </div>
          `}
          <span class="font-semibold text-lg">${brandName}</span>
        </div>
        <div class="hidden md:flex gap-8 text-sm font-medium">
          <a href="#inicio" class="hover:opacity-70 transition">Inicio</a>
          <a href="#servicios" class="hover:opacity-70 transition">Servicios</a>
          <a href="#proceso" class="hover:opacity-70 transition">Proceso</a>
          <a href="#contacto" class="hover:opacity-70 transition">Contacto</a>
        </div>
        <a href="#contacto" class="px-6 py-2 rounded-lg font-semibold text-white hover:opacity-90 transition" style="background: ${primaryColor}">
          Contactar
        </a>
      </div>
    </div>
  </nav>

  <!-- Hero Section con layout asimétrico -->
  <section id="inicio" class="pt-24 pb-20 gradient-radial min-h-screen flex items-center">
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
      <div class="grid lg:grid-cols-2 gap-12 items-center">
        <!-- Left: Content -->
        <div class="fade-in-up">
          <div class="inline-block px-4 py-2 rounded-full text-sm font-semibold mb-6" style="background: ${primaryColor}15; color: ${primaryColor}">
            ✨ ${industry.charAt(0).toUpperCase() + industry.slice(1)}
          </div>
          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6" style="color: #111827">
            ${escapeHtml(heroTitle)}
          </h1>
          <p class="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed max-w-xl">
            ${escapeHtml(heroSubtitle)}
          </p>
          <div class="flex flex-col sm:flex-row gap-4">
            <a href="#contacto" class="px-8 py-4 rounded-lg font-semibold text-white text-center hover:opacity-90 transition shadow-lg" style="background: ${primaryColor}">
              Comenzar Ahora →
            </a>
            <a href="${url}" target="_blank" class="px-8 py-4 rounded-lg font-semibold border-2 text-center hover:bg-gray-50 transition" style="border-color: ${primaryColor}; color: ${primaryColor}">
              Ver Sitio Original
            </a>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-3 gap-6 mt-12 pt-12 border-t border-gray-200">
            <div>
              <div class="text-3xl font-bold mb-1" style="color: ${primaryColor}">+250</div>
              <div class="text-sm text-gray-600">Proyectos</div>
            </div>
            <div>
              <div class="text-3xl font-bold mb-1" style="color: ${primaryColor}">98%</div>
              <div class="text-sm text-gray-600">Satisfacción</div>
            </div>
            <div>
              <div class="text-3xl font-bold mb-1" style="color: ${primaryColor}">24/7</div>
              <div class="text-sm text-gray-600">Soporte</div>
            </div>
          </div>
        </div>

        <!-- Right: Visual -->
        <div class="hidden lg:block float">
          <div class="relative">
            <div class="w-full aspect-square rounded-3xl shadow-2xl" style="background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}90 100%)">
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-white text-center p-8">
                  <div class="text-7xl mb-4">🚀</div>
                  <div class="text-2xl font-bold">Nuevo Diseño</div>
                  <div class="text-lg opacity-90 mt-2">Moderno · Profesional · Efectivo</div>
                </div>
              </div>
            </div>
            <!-- Floating card -->
            <div class="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-6 max-w-xs">
              <div class="flex items-center gap-3 mb-2">
                <div class="w-3 h-3 rounded-full bg-green-500"></div>
                <span class="font-semibold">En línea ahora</span>
              </div>
              <p class="text-sm text-gray-600">Rediseño generado con tecnología IA de última generación</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Servicios -->
  <section id="servicios" class="py-20 bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
      <div class="text-center mb-16">
        <h2 class="text-3xl sm:text-4xl font-bold mb-4" style="color: #111827">
          Lo que Ofrecemos
        </h2>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          Soluciones completas para transformar tu presencia digital
        </p>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        ${generateServiceCards(primaryColor, realServices, industry)}
      </div>
    </div>
  </section>

  <!-- Proceso -->
  <section id="proceso" class="py-20 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
      <div class="text-center mb-16">
        <h2 class="text-3xl sm:text-4xl font-bold mb-4" style="color: #111827">
          Cómo Funciona
        </h2>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          Proceso simple en 4 pasos
        </p>
      </div>

      <div class="grid md:grid-cols-4 gap-8">
        ${generateProcessSteps(primaryColor)}
      </div>
    </div>
  </section>

  <!-- Testimonios -->
  <section class="py-20 bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
      <div class="text-center mb-16">
        <h2 class="text-3xl sm:text-4xl font-bold mb-4" style="color: #111827">
          Lo que Dicen Nuestros Clientes
        </h2>
      </div>

      <div class="grid md:grid-cols-3 gap-8">
        ${generateTestimonials(primaryColor)}
      </div>
    </div>
  </section>

  <!-- CTA Final -->
  <section id="contacto" class="py-24" style="background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}e6 100%)">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 text-center text-white">
      <h2 class="text-4xl sm:text-5xl font-bold mb-6">
        ¿Listo para el Cambio?
      </h2>
      <p class="text-xl mb-10 opacity-95 leading-relaxed">
        Transforma tu presencia digital hoy mismo. Contáctanos para una consulta gratuita.
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="https://growby.tech/contacto" class="px-10 py-4 bg-white rounded-lg font-semibold text-lg hover:scale-105 transition shadow-xl" style="color: ${primaryColor}">
          Contactar Ahora
        </a>
        <a href="https://growby.tech" class="px-10 py-4 border-2 border-white rounded-lg font-semibold text-lg text-white hover:bg-white/10 transition">
          Conocer Más
        </a>
      </div>
    </div>
  </section>

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
          © ${new Date().getFullYear()} ${brandName} · Rediseño generado con IA
        </div>
        <div class="flex gap-6 text-sm">
          <a href="#" class="hover:text-white transition">Privacidad</a>
          <a href="#" class="hover:text-white transition">Términos</a>
          <a href="${url}" class="hover:text-white transition">Sitio Original</a>
        </div>
      </div>
    </div>
  </footer>

</body>
</html>`;
}

function generateServiceCards(primaryColor, realServices = [], industry = '') {
  // Si hay servicios reales del scraping, usarlos (max 4)
  let services;
  if (realServices.length >= 3) {
    services = realServices.slice(0, 4).map((svc, i) => ({
      icon: ['🎯', '⚡', '🚀', '💡'][i],
      title: svc.length > 40 ? svc.slice(0, 40) + '...' : svc,
      desc: `Servicio especializado de ${industry}`
    }));
  } else {
    // Fallback a servicios genéricos
    services = [
      { icon: '🎨', title: 'Diseño UI/UX', desc: 'Interfaces modernas y experiencias intuitivas' },
      { icon: '📱', title: 'Responsive Design', desc: 'Perfecto en todos los dispositivos' },
      { icon: '⚡', title: 'Performance', desc: 'Carga ultra rápida optimizada' },
      { icon: '🔍', title: 'SEO Optimizado', desc: 'Mejor posicionamiento en Google' }
    ];
  }

  return services.map(s => `
    <div class="bg-white p-8 rounded-xl shadow-md card-hover">
      <div class="text-5xl mb-4">${s.icon}</div>
      <h3 class="text-xl font-bold mb-3" style="color: #111827">${s.title}</h3>
      <p class="text-gray-600">${s.desc}</p>
    </div>
  `).join('');
}

function generateProcessSteps(primaryColor) {
  const steps = [
    { num: 1, title: 'Análisis', desc: 'Estudiamos tu sitio actual y objetivos' },
    { num: 2, title: 'Diseño', desc: 'Creamos el nuevo diseño optimizado' },
    { num: 3, title: 'Desarrollo', desc: 'Construimos tu sitio profesional' },
    { num: 4, title: 'Lanzamiento', desc: 'Publicamos y optimizamos' }
  ];

  return steps.map((s, i) => `
    <div class="text-center">
      <div class="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold" style="background: ${primaryColor}">
        ${s.num}
      </div>
      <h3 class="text-lg font-bold mb-2" style="color: #111827">${s.title}</h3>
      <p class="text-sm text-gray-600">${s.desc}</p>
      ${i < steps.length - 1 ? `
        <div class="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gray-200" style="z-index: -1"></div>
      ` : ''}
    </div>
  `).join('');
}

function generateTestimonials(primaryColor) {
  const testimonials = [
    { name: 'María González', role: 'CEO', company: 'TechStart', text: 'El rediseño superó nuestras expectativas. Conversiones +40% en 2 meses.' },
    { name: 'Carlos Ruiz', role: 'Director', company: 'Innovación SA', text: 'Proceso ágil y resultados profesionales. Totalmente recomendado.' },
    { name: 'Ana Martínez', role: 'Founder', company: 'EcoVerde', text: 'Diseño moderno que refleja perfectamente nuestra identidad de marca.' }
  ];

  return testimonials.map(t => `
    <div class="bg-white p-8 rounded-xl shadow-md">
      <div class="flex gap-1 mb-4">
        ${'⭐'.repeat(5)}
      </div>
      <p class="text-gray-700 mb-6 leading-relaxed">"${t.text}"</p>
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white" style="background: ${primaryColor}">
          ${t.name.charAt(0)}
        </div>
        <div>
          <div class="font-semibold" style="color: #111827">${t.name}</div>
          <div class="text-sm text-gray-500">${t.role}, ${t.company}</div>
        </div>
      </div>
    </div>
  `).join('');
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
