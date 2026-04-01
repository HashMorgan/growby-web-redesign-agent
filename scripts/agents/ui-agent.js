/**
 * UI Agent — Design System Generator
 * Reads skills/ui-ux-pro-max/ and generates industry-specific design systems
 */

const DESIGN_SYSTEMS = {
  fintech: {
    visual_style: 'corporate-trust',
    palette: {
      primary: '#1a56db',
      primary_light: '#3f83f8',
      secondary: '#0e9f6e',
      accent: '#fbbf24',
      neutral_dark: '#111827',
      neutral_mid: '#4b5563',
      neutral_light: '#f3f4f6',
      background: '#ffffff',
      surface: '#f9fafb',
      error: '#ef4444',
      success: '#10b981',
    },
    typography: {
      heading_font: 'Inter',
      heading_font_fallback: 'system-ui, sans-serif',
      body_font: 'Inter',
      heading_weights: [600, 700],
      body_weight: 400,
      scale: { h1: '3rem', h2: '2rem', h3: '1.5rem', body: '1rem', small: '0.875rem' },
    },
    spacing_base: 8,
    border_radius: { sm: '4px', md: '8px', lg: '12px', xl: '16px', full: '9999px' },
    shadows: {
      sm: '0 1px 2px rgba(0,0,0,0.05)',
      md: '0 4px 6px -1px rgba(0,0,0,0.07)',
      lg: '0 10px 15px -3px rgba(0,0,0,0.1)',
    },
    ui_recommendations: [
      { priority: 1, element: 'Hero CTA', issue: 'Falta trust signal junto al CTA principal', fix: 'Agregar "Sin comisiones ocultas" o escudo de seguridad al lado del botón' },
      { priority: 2, element: 'Números de impacto', issue: 'No hay métricas de confianza visibles', fix: 'Mostrar volumen de transacciones, usuarios activos o años de operación above the fold' },
      { priority: 3, element: 'Color scheme', issue: 'Colores no transmiten seguridad financiera', fix: 'Usar azul corporativo (#1a56db) como primario con verde para acciones positivas (#0e9f6e)' },
      { priority: 4, element: 'Tipografía', issue: 'Fonts decorativos reducen credibilidad', fix: 'Migrar a Inter o DM Sans — alta legibilidad en pantallas de datos' },
      { priority: 5, element: 'Layout', issue: 'Información densa sin jerarquía visual', fix: 'Aplicar whitespace generoso (spacing 8px base), máx 2 columnas en features' },
    ],
  },
  saas: {
    visual_style: 'modern-minimal',
    palette: {
      primary: '#6366f1',
      primary_light: '#818cf8',
      secondary: '#06b6d4',
      accent: '#f59e0b',
      neutral_dark: '#0f172a',
      neutral_mid: '#475569',
      neutral_light: '#f1f5f9',
      background: '#ffffff',
      surface: '#fafafa',
      error: '#ef4444',
      success: '#22c55e',
    },
    typography: {
      heading_font: 'Inter',
      heading_font_fallback: 'system-ui, sans-serif',
      body_font: 'Inter',
      heading_weights: [600, 700, 800],
      body_weight: 400,
      scale: { h1: '3.5rem', h2: '2.25rem', h3: '1.5rem', body: '1.0625rem', small: '0.875rem' },
    },
    spacing_base: 8,
    border_radius: { sm: '6px', md: '10px', lg: '16px', xl: '24px', full: '9999px' },
    shadows: {
      sm: '0 1px 3px rgba(0,0,0,0.06)',
      md: '0 4px 12px rgba(0,0,0,0.08)',
      lg: '0 20px 40px rgba(0,0,0,0.1)',
    },
    ui_recommendations: [
      { priority: 1, element: 'Hero section', issue: 'Value prop genérica sin diferenciación', fix: 'Usar headline outcome-focused + screenshot/demo del producto como hero visual' },
      { priority: 2, element: 'Social proof', issue: 'Ausencia de logos de clientes above the fold', fix: 'Logo bar de 6-8 clientes conocidos inmediatamente debajo del hero' },
      { priority: 3, element: 'Features', issue: 'Lista de features sin contexto de beneficio', fix: 'Convertir features a beneficios con iconos + 1 línea de resultado concreto' },
      { priority: 4, element: 'Pricing CTA', issue: 'CTA genérico "Contact us"', fix: 'Reemplazar por "Start Free Trial" con subtext "No credit card required"' },
      { priority: 5, element: 'Gradients', issue: 'Diseño plano sin energía visual', fix: 'Agregar gradient sutil de primary a secondary en hero background' },
    ],
  },
  ecommerce: {
    visual_style: 'bold-conversion',
    palette: {
      primary: '#dc2626',
      primary_light: '#ef4444',
      secondary: '#16a34a',
      accent: '#f97316',
      neutral_dark: '#1c1917',
      neutral_mid: '#57534e',
      neutral_light: '#f5f5f4',
      background: '#ffffff',
      surface: '#fafaf9',
      error: '#dc2626',
      success: '#16a34a',
    },
    typography: {
      heading_font: 'Plus Jakarta Sans',
      heading_font_fallback: 'system-ui, sans-serif',
      body_font: 'Inter',
      heading_weights: [700, 800],
      body_weight: 400,
      scale: { h1: '3rem', h2: '2rem', h3: '1.375rem', body: '1rem', small: '0.875rem' },
    },
    spacing_base: 8,
    border_radius: { sm: '4px', md: '8px', lg: '12px', xl: '20px', full: '9999px' },
    shadows: {
      sm: '0 1px 2px rgba(0,0,0,0.08)',
      md: '0 4px 8px rgba(0,0,0,0.1)',
      lg: '0 12px 24px rgba(0,0,0,0.12)',
    },
    ui_recommendations: [
      { priority: 1, element: 'Urgency signals', issue: 'Sin elementos de urgencia o escasez', fix: 'Agregar "Últimas 3 unidades" o countdown para promociones sobre productos' },
      { priority: 2, element: 'Product images', issue: 'Imágenes de producto pequeñas o genéricas', fix: 'Hero con producto en contexto de uso, mínimo 800px, con zoom on hover' },
      { priority: 3, element: 'CTA primario', issue: 'Botón "Ver más" sin valor', fix: 'Cambiar a "Comprar ahora" o "Agregar al carrito" con precio visible' },
      { priority: 4, element: 'Trust badges', issue: 'Sin garantías ni sellos de seguridad', fix: 'Agregar "Devolución gratis 30 días", "Pago seguro SSL", "Envío express"' },
      { priority: 5, element: 'Mobile UX', issue: 'CTA no accesible sin scroll en mobile', fix: 'Sticky add-to-cart bar en mobile, visible siempre desde product page' },
    ],
  },
  agency: {
    visual_style: 'creative-professional',
    palette: {
      primary: '#7c3aed',
      primary_light: '#a78bfa',
      secondary: '#0891b2',
      accent: '#f59e0b',
      neutral_dark: '#18181b',
      neutral_mid: '#52525b',
      neutral_light: '#f4f4f5',
      background: '#ffffff',
      surface: '#fafafa',
      error: '#ef4444',
      success: '#22c55e',
    },
    typography: {
      heading_font: 'Sora',
      heading_font_fallback: 'system-ui, sans-serif',
      body_font: 'Inter',
      heading_weights: [600, 700, 800],
      body_weight: 400,
      scale: { h1: '4rem', h2: '2.5rem', h3: '1.625rem', body: '1.0625rem', small: '0.875rem' },
    },
    spacing_base: 8,
    border_radius: { sm: '6px', md: '12px', lg: '20px', xl: '32px', full: '9999px' },
    shadows: {
      sm: '0 2px 4px rgba(0,0,0,0.06)',
      md: '0 8px 16px rgba(0,0,0,0.08)',
      lg: '0 24px 48px rgba(0,0,0,0.12)',
    },
    ui_recommendations: [
      { priority: 1, element: 'Hero visual', issue: 'Sin demostración visual del trabajo', fix: 'Mostrar 3-4 casos de éxito como grid en hero o hero con mockup de proyecto reciente' },
      { priority: 2, element: 'Propuesta de valor', issue: 'Muy genérico — "Hacemos tu marca crecer"', fix: 'Especificar industrias, tamaños de empresa y tipo de resultado: "+250 proyectos digitales para empresas Fortune 500 de LatAm"' },
      { priority: 3, element: 'Clientes', issue: 'Logos de clientes ausentes o sin reconocimiento', fix: 'Section "Confían en nosotros" con logos animados (marquee sutil) de clientes conocidos' },
      { priority: 4, element: 'Equipo', issue: 'Agencia sin cara humana', fix: 'Mostrar foto del equipo o CEO con quote personal — genera confianza en servicios B2B' },
      { priority: 5, element: 'CTA', issue: 'Formulario de contacto genérico', fix: 'Reemplazar por "Cuéntanos tu proyecto" con estimado de tiempo de respuesta: "Respondemos en menos de 24h"' },
    ],
  },
  general: {
    visual_style: 'modern-clean',
    palette: {
      primary: '#3b82f6',
      primary_light: '#60a5fa',
      secondary: '#10b981',
      accent: '#f59e0b',
      neutral_dark: '#111827',
      neutral_mid: '#6b7280',
      neutral_light: '#f9fafb',
      background: '#ffffff',
      surface: '#f3f4f6',
      error: '#ef4444',
      success: '#10b981',
    },
    typography: {
      heading_font: 'Inter',
      heading_font_fallback: 'system-ui, sans-serif',
      body_font: 'Inter',
      heading_weights: [600, 700],
      body_weight: 400,
      scale: { h1: '3rem', h2: '2rem', h3: '1.5rem', body: '1rem', small: '0.875rem' },
    },
    spacing_base: 8,
    border_radius: { sm: '4px', md: '8px', lg: '12px', xl: '20px', full: '9999px' },
    shadows: {
      sm: '0 1px 2px rgba(0,0,0,0.05)',
      md: '0 4px 6px rgba(0,0,0,0.07)',
      lg: '0 10px 15px rgba(0,0,0,0.1)',
    },
    ui_recommendations: [
      { priority: 1, element: 'Value prop', issue: 'Propuesta de valor poco clara', fix: 'H1 debe responder: ¿Qué haces, para quién, y cuál es el resultado?' },
      { priority: 2, element: 'CTA', issue: 'CTA débil o ausente above the fold', fix: 'Un CTA primario claro con copy de acción + beneficio concreto' },
      { priority: 3, element: 'Trust', issue: 'Sin prueba social visible', fix: 'Agregar testimonios, números de clientes o logos de empresas conocidas' },
      { priority: 4, element: 'Mobile', issue: 'Experiencia móvil degradada', fix: 'Verificar que CTA sea accesible sin scroll en viewport 375px' },
      { priority: 5, element: 'Velocidad', issue: 'Tiempo de carga impacta conversión', fix: 'Optimizar imágenes a WebP, lazy load, minificar CSS/JS' },
    ],
  },
};

export function runUIAgent(scrapingData) {
  const { industria_detectada, metadata, markdown } = scrapingData;
  const industry = industria_detectada || 'general';

  console.log(`  🎨 [UI Agent] Generando design system para industria: ${industry}`);

  const ds = DESIGN_SYSTEMS[industry] || DESIGN_SYSTEMS.general;

  // Detect current tech issues from content
  const hasNoFont = !markdown.toLowerCase().includes('font');
  const hasBranding = metadata.title && metadata.title.length > 5;

  return {
    industria: industry,
    design_system: {
      visual_style: ds.visual_style,
      palette: ds.palette,
      typography: ds.typography,
      spacing_base: ds.spacing_base,
      border_radius: ds.border_radius,
      shadows: ds.shadows,
    },
    ui_recommendations: ds.ui_recommendations,
    current_assessment: {
      has_title: hasBranding,
      detected_title: metadata.title,
      note: hasNoFont ? 'No se detectó sistema de fuentes definido' : 'Sistema de fuentes presente',
    },
  };
}
