/**
 * html-builder.js — Genera HTML simple a partir de design system de Stitch
 * v2.0.0 — Fallback cuando Stitch no retorna HTML directo
 */

/**
 * Construye HTML básico usando los parámetros del sitio
 * @param {string} url - URL del sitio original
 * @param {object} scrapeData - Datos del scraping
 * @param {object} designSystem - Design system de Stitch (opcional)
 * @returns {string} HTML completo
 */
export function buildHTML(url, scrapeData, designSystem = null) {
  const title = scrapeData.title || url;
  const description = scrapeData.description || `Rediseño del sitio web`;

  // Colores por defecto o del design system
  const primaryColor = designSystem?.theme?.customColor || '#5D55D7';
  const font = designSystem?.theme?.headlineFont || 'Inter';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: ${font}, sans-serif; }
  </style>
</head>
<body class="antialiased">

  <!-- Hero Section -->
  <section class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
    <div class="max-w-4xl mx-auto px-6 text-center">
      <h1 class="text-5xl md:text-6xl font-bold mb-6" style="color: ${primaryColor}">
        ${escapeHtml(title)}
      </h1>
      <p class="text-xl text-gray-600 mb-8 leading-relaxed">
        ${escapeHtml(description)}
      </p>
      <div class="flex gap-4 justify-center">
        <a href="${url}" class="px-8 py-4 rounded-lg font-semibold text-white hover:opacity-90 transition" style="background-color: ${primaryColor}">
          Visitar Sitio Original
        </a>
        <a href="https://growby.tech" class="px-8 py-4 rounded-lg font-semibold border-2 hover:bg-gray-50 transition" style="border-color: ${primaryColor}; color: ${primaryColor}">
          Conocer GrowBy
        </a>
      </div>
    </div>
  </section>

  <!-- Features -->
  <section class="py-20 bg-white">
    <div class="max-w-6xl mx-auto px-6">
      <h2 class="text-3xl font-bold text-center mb-12" style="color: ${primaryColor}">
        Rediseño Profesional
      </h2>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="p-8 rounded-xl bg-gray-50">
          <div class="text-4xl mb-4">🎨</div>
          <h3 class="text-xl font-semibold mb-3">Diseño Moderno</h3>
          <p class="text-gray-600">Interfaz actualizada con las mejores prácticas de UX/UI</p>
        </div>
        <div class="p-8 rounded-xl bg-gray-50">
          <div class="text-4xl mb-4">⚡</div>
          <h3 class="text-xl font-semibold mb-3">Carga Rápida</h3>
          <p class="text-gray-600">Optimizado para máxima velocidad y rendimiento</p>
        </div>
        <div class="p-8 rounded-xl bg-gray-50">
          <div class="text-4xl mb-4">📱</div>
          <h3 class="text-xl font-semibold mb-3">Responsive</h3>
          <p class="text-gray-600">Perfecto en móvil, tablet y desktop</p>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="py-20" style="background-color: ${primaryColor}">
    <div class="max-w-4xl mx-auto px-6 text-center text-white">
      <h2 class="text-4xl font-bold mb-6">¿Listo para transformar tu sitio web?</h2>
      <p class="text-xl mb-8 opacity-90">Contacta con GrowBy para un rediseño completo</p>
      <a href="https://growby.tech/contacto" class="inline-block px-8 py-4 bg-white rounded-lg font-semibold hover:scale-105 transition" style="color: ${primaryColor}">
        Contactar Ahora
      </a>
    </div>
  </section>

  <!-- Footer -->
  <footer class="py-12 bg-gray-900 text-white">
    <div class="max-w-6xl mx-auto px-6">
      <div class="flex flex-col md:flex-row items-center justify-between">
        <div class="flex items-center gap-3 mb-4 md:mb-0">
          <span>Powered by</span>
          <a href="https://growby.tech" class="flex items-center gap-2 hover:opacity-80 transition">
            <img src="https://growby.tech/favicon.ico" alt="GrowBy" class="w-6 h-6">
            <span class="font-semibold">GrowBy</span>
          </a>
        </div>
        <div class="text-sm text-gray-400">
          © ${new Date().getFullYear()} Rediseño generado con IA
        </div>
      </div>
    </div>
  </footer>

</body>
</html>`;
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
