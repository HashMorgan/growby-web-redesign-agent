import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateAllImages } from './gemini-client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');

function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }

// ─── REGLA 2: Inferir colores de marca desde assets ──────────────────────────
// Filtra colores que son blancos/negros/grises para quedarse con los de marca
function inferBrandColors(assets) {
  if (!assets?.colors?.length) return null;

  const isGrayish = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    return saturation < 0.15; // very gray/neutral
  };

  const isVeryLight = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r + g + b) / 3 > 230;
  };

  // Prefer non-gray, non-white colors from assets
  const brandColors = assets.colors
    .filter(c => c && c.startsWith('#') && c.length === 7)
    .filter(c => !isGrayish(c) && !isVeryLight(c));

  if (!brandColors.length) return null;

  return {
    primary: brandColors[0] || null,
    secondary: brandColors[1] || null,
    accent: brandColors[2] || null,
  };
}

// Map analysis design_system → template-compatible DS format
// REGLA 2: Brand colors from assets OVERRIDE the AI-generated design system
function mapDesignSystem(ds, assets) {
  const p = ds.palette || {};
  const t = ds.typography || {};
  const br = ds.border_radius || {};

  // Start with AI design system defaults
  let primary   = p.primary    || '#7c3aed';
  let secondary = p.secondary  || '#0891b2';
  let accent    = p.accent     || '#f59e0b';

  // REGLA 2: Override with real brand colors if detected
  const brandColors = inferBrandColors(assets);
  if (brandColors) {
    if (brandColors.primary)   primary   = brandColors.primary;
    if (brandColors.secondary) secondary = brandColors.secondary;
    if (brandColors.accent)    accent    = brandColors.accent || accent;
  }

  // REGLA 3: Override fonts if detected from real site
  let headingFont = t.heading_font || 'Sora';
  let bodyFont    = t.body_font    || 'Inter';
  if (assets?.fonts?.length > 0) {
    // Use first detected font as heading, second as body
    headingFont = assets.fonts[0] || headingFont;
    bodyFont    = assets.fonts[1] || assets.fonts[0] || bodyFont;
  }

  return {
    colors: {
      primary,
      secondary,
      accent,
      neutral:    p.neutral_light || '#f4f4f5',
      dark:       p.neutral_dark  || '#18181b',
      mid:        p.neutral_mid   || '#52525b',
      background: p.background   || '#ffffff',
      surface:    p.surface      || '#fafafa',
      success:    p.success      || '#22c55e',
    },
    fonts: {
      heading: headingFont,
      body:    bodyFont,
    },
    borderRadius: br.md || '12px',
    borderRadiusSm: br.sm || '6px',
    borderRadiusLg: br.lg || '20px',
    borderRadiusFull: br.full || '9999px',
    shadows: ds.shadows || {},
    spacingBase: ds.spacing_base || 8,
  };
}

// REGLA 4: Get best available image for a section
// Priority: 1) real site image, 2) Gemini generated, 3) null (gradient)
function pickImage(siteImages, geminiImages, key, siteIndex = 0) {
  // Try Gemini first if available (higher quality)
  if (geminiImages[key]) return { src: `data:image/jpeg;base64,${geminiImages[key]}`, type: 'gemini' };
  // Fall back to real site image
  if (siteImages && siteImages[siteIndex]) return { src: siteImages[siteIndex], type: 'real' };
  return null;
}

// ─── Extract client info from analysis ────────────────────────────────────────
function extractClientInfo(analysis) {
  const industry = analysis.meta?.industria || analysis.ui_analysis?.industria || 'general';
  const scrapingBusiness = analysis.scraping?.business || {};
  const scrapingBrand = analysis.scraping?.brand || {};
  const metaTitle = analysis.scraping?.title || '';
  const companyName = scrapingBusiness.company_name
    || scrapingBrand.name
    || metaTitle.split(/[\|—\-·]/)[0]?.trim()
    || 'Empresa';
  return { industry, companyName, business: scrapingBusiness, brand: scrapingBrand };
}

// ─── Client features — from scraped services or industry defaults ─────────────
function buildClientFeatures(analysis) {
  const { industry, companyName, business } = extractClientInfo(analysis);

  // Use scraped services if we have enough
  if (business.key_services?.length >= 3) {
    const icons = ['🏢','🔧','⚙️','✅','📐','🏗️','🔑','📊'];
    return business.key_services.slice(0, 6).map((s, i) => ({
      icon: icons[i % icons.length],
      title: s.name,
      description: s.description || s.name,
    }));
  }

  // Industry-specific defaults — NO GrowBy content
  const defaults = {
    elevator_company: [
      { icon: '🏢', title: 'Elevadores Residenciales', description: 'Soluciones de movilidad vertical para edificios residenciales y condominios. Diseño personalizado, instalación y garantía.' },
      { icon: '🏗️', title: 'Elevadores Comerciales', description: 'Sistemas de transporte vertical para centros comerciales, oficinas y proyectos corporativos de alto tráfico.' },
      { icon: '🏭', title: 'Elevadores Industriales', description: 'Montacargas y plataformas de carga para almacenes, plantas industriales y centros de distribución.' },
      { icon: '🔧', title: 'Mantenimiento y Soporte', description: 'Contratos de mantenimiento preventivo y correctivo. Respuesta técnica rápida y piezas de repuesto originales.' },
      { icon: '✅', title: 'Certificaciones y Garantía', description: 'Cumplimiento de normativas nacionales e internacionales (EN 81, ASME A17.1). Garantía en todos los equipos instalados.' },
      { icon: '📐', title: 'Consultoría Técnica', description: 'Asesoría desde el diseño del proyecto hasta la puesta en marcha. Soluciones a medida para cada inmueble.' },
    ],
    saas: [
      { icon: '⚡', title: 'Automatización de procesos', description: 'Elimina tareas repetitivas y reduce errores operacionales desde el primer día.' },
      { icon: '📊', title: 'Reportes en tiempo real', description: 'Dashboards con métricas clave para tomar decisiones con datos, no intuiciones.' },
      { icon: '🔗', title: 'Integraciones nativas', description: 'Conecta con las herramientas que ya usas sin código ni configuraciones complejas.' },
      { icon: '🔒', title: 'Seguridad empresarial', description: 'Cifrado de datos, backups automáticos y cumplimiento de normativas de privacidad.' },
      { icon: '📱', title: 'Acceso desde cualquier lugar', description: 'Web, iOS y Android. Tu equipo trabaja desde donde esté.' },
      { icon: '🎯', title: 'Soporte dedicado', description: 'Asistencia técnica real con tiempo de respuesta garantizado, no solo bots.' },
    ],
    agency: [
      { icon: '🎨', title: 'Diseño UX/UI', description: 'Interfaces que convierten visitantes en clientes. Diseño centrado en el usuario con base en datos.' },
      { icon: '💻', title: 'Desarrollo Web y Mobile', description: 'Aplicaciones web y móviles robustas, escalables y con arquitectura moderna.' },
      { icon: '🤖', title: 'Inteligencia Artificial', description: 'Automatización inteligente, chatbots y análisis de datos para escalar tu operación.' },
      { icon: '📈', title: 'Marketing Digital', description: 'Estrategias SEO, SEM y contenido con métricas claras y resultados medibles.' },
      { icon: '🛒', title: 'eCommerce', description: 'Tiendas online de alto rendimiento con pasarelas de pago y gestión de inventario.' },
      { icon: '⚙️', title: 'ERP & CRM', description: 'Implementación y personalización de sistemas de gestión empresarial.' },
    ],
    industrial: [
      { icon: '⚡', title: 'Transformadores de Potencia', description: 'Transformadores de distribución y potencia para proyectos industriales, mineros y de infraestructura.' },
      { icon: '🔌', title: 'Sub Estaciones Eléctricas', description: 'Diseño y construcción de sub-estaciones eléctricas completas, desde la ingeniería hasta la puesta en marcha.' },
      { icon: '🏭', title: 'Tableros Eléctricos', description: 'Tableros de distribución, control y protección para cualquier capacidad y aplicación industrial.' },
      { icon: '🔧', title: 'Ducto de Barras', description: 'Sistemas de distribución de energía por ducto de barras blindado para plantas industriales.' },
      { icon: '📊', title: 'Filtros Activos de Armónicos', description: 'Soluciones de calidad de energía para reducir distorsión armónica y mejorar la eficiencia eléctrica.' },
      { icon: '✅', title: 'Mantenimiento y Servicio Técnico', description: 'Contratos de mantenimiento preventivo y correctivo con respuesta técnica especializada.' },
    ],
    general: [
      { icon: '✅', title: 'Calidad garantizada', description: 'Todos nuestros productos y servicios cumplen con los más altos estándares de calidad.' },
      { icon: '⚡', title: 'Respuesta rápida', description: 'Atención oportuna y soluciones ágiles. Respetamos los plazos acordados.' },
      { icon: '🤝', title: 'Servicio personalizado', description: 'Entendemos las necesidades específicas de cada cliente y ofrecemos soluciones a medida.' },
      { icon: '🔒', title: 'Confianza y seguridad', description: 'Años de experiencia respaldan nuestra reputación en el mercado.' },
      { icon: '💡', title: 'Innovación constante', description: 'Nos actualizamos continuamente para ofrecer las mejores soluciones del mercado.' },
      { icon: '📊', title: 'Resultados medibles', description: 'Definimos métricas claras y reportamos resultados concretos en cada proyecto.' },
    ],
  };
  return defaults[industry] || defaults.general;
}

// ─── Hero stats — from impact_numbers or industry defaults ───────────────────
function buildHeroStats(analysis) {
  const { industry, business } = extractClientInfo(analysis);

  if (business.impact_numbers?.length >= 2) {
    return business.impact_numbers.slice(0, 4).map(n => ({ number: n.value, label: n.label }));
  }

  const defaults = {
    elevator_company: [
      { number: '20+', label: 'Años de experiencia' },
      { number: '500+', label: 'Instalaciones completadas' },
      { number: '98%', label: 'Clientes satisfechos' },
      { number: '24h', label: 'Tiempo de respuesta' },
    ],
    saas: [
      { number: '10k+', label: 'Usuarios activos' },
      { number: '99.9%', label: 'Uptime garantizado' },
      { number: '70%', label: 'Reducción de trabajo manual' },
      { number: '14 días', label: 'Prueba gratis' },
    ],
    agency: [
      { number: '100+', label: 'Proyectos entregados' },
      { number: '8+', label: 'Años de experiencia' },
      { number: '50+', label: 'Clientes activos' },
      { number: '48h', label: 'Tiempo de respuesta' },
    ],
    industrial: [
      { number: '25+', label: 'Años de experiencia' },
      { number: '300+', label: 'Proyectos ejecutados' },
      { number: '100%', label: 'Entregas certificadas' },
      { number: '24h', label: 'Soporte técnico' },
    ],
    general: [
      { number: '10+', label: 'Años de trayectoria' },
      { number: '200+', label: 'Clientes atendidos' },
      { number: '98%', label: 'Satisfacción' },
      { number: '24h', label: 'Soporte' },
    ],
  };
  return defaults[industry] || defaults.general;
}

// ─── Hero badge text ──────────────────────────────────────────────────────────
function buildHeroBadge(analysis) {
  const { industry, business } = extractClientInfo(analysis);
  const first = business.impact_numbers?.[0];
  if (first) return `${first.value} ${first.label.toLowerCase()} ✓`;
  const badges = {
    elevator_company: 'Instalaciones certificadas con garantía técnica',
    industrial:       'Equipos certificados con respaldo técnico especializado',
    saas:             'Prueba gratis 14 días — sin tarjeta de crédito',
    agency:           'Proyectos entregados con resultados medibles',
    fintech:          'Seguro, regulado y sin comisiones ocultas',
    general:          'Calidad y confianza en cada proyecto',
  };
  return badges[industry] || badges.general;
}

// ─── Process steps — industry-specific ──────────────────────────────────────
function buildClientProcess(analysis) {
  const { industry, companyName } = extractClientInfo(analysis);
  const defaults = {
    elevator_company: [
      { n: '01', title: 'Consultoría técnica', desc: 'Evaluamos tu proyecto y recomendamos la solución ideal de elevación según el tipo de inmueble, tráfico esperado y normativas locales.' },
      { n: '02', title: 'Diseño e instalación', desc: 'Nuestro equipo técnico certificado instala el sistema cumpliendo todas las normativas de seguridad vigentes, con mínima interferencia en la obra.' },
      { n: '03', title: 'Mantenimiento y garantía', desc: 'Soporte post-instalación con contratos de mantenimiento preventivo y correctivo. Garantía en equipos y repuestos originales.' },
    ],
    saas: [
      { n: '01', title: 'Configuración express', desc: 'Crea tu cuenta y conecta tus herramientas actuales en menos de 30 minutos. Sin instalaciones.' },
      { n: '02', title: 'Onboarding guiado', desc: 'Tu equipo aprende a usar la plataforma con tutoriales interactivos y soporte en vivo.' },
      { n: '03', title: 'Optimiza y escala', desc: 'Analiza tus métricas, automatiza más procesos y ajusta la plataforma según tu crecimiento.' },
    ],
    agency: [
      { n: '01', title: 'Discovery y brief', desc: 'Entendemos tu negocio, competencia y objetivos. Definimos el alcance con métricas claras.' },
      { n: '02', title: 'Diseño y desarrollo', desc: 'Entregas iterativas cada 2 semanas con demos. Tú validas antes de continuar.' },
      { n: '03', title: 'Lanzamiento y soporte', desc: 'Deploy con monitoreo. Soporte post-lanzamiento incluido los primeros 30 días.' },
    ],
    industrial: [
      { n: '01', title: 'Ingeniería y consultoría', desc: 'Evaluamos los requerimientos técnicos de tu proyecto y diseñamos la solución óptima con ingeniería especializada.' },
      { n: '02', title: 'Fabricación y suministro', desc: 'Producción o suministro de equipos certificados según especificaciones técnicas. Control de calidad en cada etapa.' },
      { n: '03', title: 'Instalación y puesta en marcha', desc: 'Nuestro equipo técnico realiza la instalación, pruebas y comisionamiento con todos los protocolos de seguridad.' },
    ],
    general: [
      { n: '01', title: 'Consulta inicial', desc: 'Nos contás tu necesidad y evaluamos la mejor solución para tu caso específico.' },
      { n: '02', title: 'Propuesta a medida', desc: 'Presentamos propuesta detallada con alcance, tiempos y costos claros. Sin sorpresas.' },
      { n: '03', title: 'Entrega y seguimiento', desc: 'Ejecutamos con compromiso y hacemos seguimiento hasta tu completa satisfacción.' },
    ],
  };
  return defaults[industry] || defaults.general;
}

// ─── Testimonials — from scraped data or industry defaults (NO GrowBy clients) ─
function buildClientTestimonials(analysis) {
  const { industry, business } = extractClientInfo(analysis);

  if (business.testimonials?.length >= 2) {
    return business.testimonials.slice(0, 3);
  }

  const defaults = {
    elevator_company: [
      { name: 'Roberto Sánchez', role: 'Gerente de Proyectos', company: 'Constructora Andina', text: 'La instalación fue impecable y cumplieron con los tiempos prometidos. El equipo técnico siempre disponible para resolver cualquier consulta.', rating: 5 },
      { name: 'Carmen Torres', role: 'Administradora', company: 'Edificio San Martín', text: 'Llevamos 3 años con su servicio de mantenimiento y jamás hemos tenido problemas. Totalmente confiables y profesionales.', rating: 5 },
      { name: 'Miguel Flores', role: 'Director de Operaciones', company: 'Centro Comercial Norte', text: 'Instalaron múltiples elevadores en nuestro centro comercial. Profesionalismo y calidad en cada detalle del proyecto.', rating: 5 },
    ],
    saas: [
      { name: 'Ana García', role: 'COO', company: 'Distribuidora Regional', text: 'Redujimos el tiempo de reporte semanal de 4 horas a 20 minutos. La plataforma es intuitiva y el soporte responde muy rápido.', rating: 5 },
      { name: 'Carlos Ríos', role: 'Gerente de Operaciones', company: 'Grupo Retail SA', text: 'Automatizamos 3 procesos críticos en el primer mes. El ROI se ve desde las primeras semanas de uso.', rating: 5 },
      { name: 'Laura Méndez', role: 'Directora de TI', company: 'Servicios Integrados', text: 'La integración con nuestras herramientas actuales fue sencilla. El equipo de soporte nos acompañó en cada paso.', rating: 5 },
    ],
    industrial: [
      { name: 'Héctor Ramírez', role: 'Gerente de Planta', company: 'Minera Pacífico', text: 'Los transformadores instalados llevan 4 años operando sin incidentes. Soporte técnico siempre disponible y piezas en stock.', rating: 5 },
      { name: 'Claudia Vera', role: 'Directora de Proyectos', company: 'Constructora NorAndina', text: 'Cumplieron con los plazos de entrega y la calidad de los tableros eléctricos superó las especificaciones del proyecto.', rating: 5 },
      { name: 'Rodrigo Espinoza', role: 'Jefe de Mantenimiento', company: 'Planta Industrial Sur', text: 'Excelente respaldo técnico post-venta. El equipo de ingeniería siempre disponible para resolver cualquier consulta.', rating: 5 },
    ],
    general: [
      { name: 'Jorge Palomino', role: 'Director General', company: 'Empresa Alpha', text: 'Profesionalismo y resultados concretos desde el primer día. Superaron nuestras expectativas en tiempo y calidad.', rating: 5 },
      { name: 'Sofía Castro', role: 'Gerente Comercial', company: 'Empresa Beta', text: 'El equipo entiende nuestro negocio y propone soluciones reales. Comunicación clara y entregables puntuales.', rating: 5 },
      { name: 'Andrés Vidal', role: 'CEO', company: 'Empresa Gamma', text: 'Excelente relación calidad-precio. Recomendamos sus servicios a cualquier empresa que busque resultados.', rating: 5 },
    ],
  };
  return defaults[industry] || defaults.general;
}

// ─── FAQ — industry-specific, NO GrowBy content ──────────────────────────────
function buildClientFAQ(analysis) {
  const { industry, companyName } = extractClientInfo(analysis);
  const defaults = {
    elevator_company: [
      { q: '¿Cuánto tiempo tarda la instalación de un elevador?', a: 'El tiempo varía según el tipo de proyecto. Para instalaciones residenciales, entre 2 y 4 semanas. Para proyectos comerciales o industriales, entre 4 y 8 semanas. Especificamos el cronograma exacto en la propuesta.' },
      { q: '¿Qué normativas de seguridad cumplen?', a: 'Todos nuestros equipos cumplen con las normativas nacionales vigentes y estándares internacionales (EN 81, ASME A17.1). Nuestros técnicos están certificados y actualizados.' },
      { q: '¿Ofrecen servicio de mantenimiento post-instalación?', a: 'Sí, contamos con contratos de mantenimiento preventivo y correctivo, revisiones periódicas, repuestos originales y atención de emergencias con tiempo de respuesta garantizado.' },
      { q: '¿Trabajan con edificios ya construidos?', a: 'Sí. Tenemos soluciones para obras nuevas y retrofitting (instalación en edificios existentes). Evaluamos las condiciones del inmueble y proponemos la solución técnica más adecuada.' },
    ],
    saas: [
      { q: '¿Cuánto tiempo toma implementar la plataforma?', a: 'La mayoría de empresas están operativas en menos de una semana. La configuración básica toma 30 minutos y ofrecemos onboarding guiado sin costo.' },
      { q: '¿Mis datos están seguros?', a: 'Sí. Utilizamos cifrado de extremo a extremo, backups automáticos diarios y servidores certificados ISO 27001. Tus datos nunca se comparten con terceros.' },
      { q: '¿Puedo cancelar cuando quiera?', a: 'Sí, sin penalidades ni períodos mínimos. Puedes cancelar tu suscripción en cualquier momento desde tu panel de administración.' },
      { q: '¿Tienen soporte técnico en español?', a: 'Sí, nuestro equipo de soporte atiende en español de lunes a viernes de 9am a 7pm, con ticket de emergencia disponible 24/7.' },
    ],
    industrial: [
      { q: '¿Cuáles son los plazos de entrega típicos?', a: 'Depende de la capacidad y especificación del equipo. Transformadores estándar: 4-8 semanas. Equipos especiales o de alta potencia: 12-20 semanas. Detallamos tiempos exactos en cada cotización.' },
      { q: '¿Qué normas y certificaciones cumplen sus equipos?', a: 'Nuestros equipos cumplen con normas IEC, IEEE, ANSI y normativas locales vigentes. Cada equipo se entrega con certificado de pruebas de fábrica y documentación técnica completa.' },
      { q: '¿Ofrecen instalación y puesta en marcha?', a: 'Sí, contamos con equipo técnico especializado para instalación, pruebas de aceptación en sitio (SAT) y puesta en marcha. También ofrecemos capacitación al personal de operación.' },
      { q: '¿Tienen repuestos disponibles?', a: 'Mantenemos inventario de repuestos críticos para los equipos que suministramos. Ofrecemos contratos de mantenimiento que incluyen repuestos y tiempo de respuesta garantizado.' },
    ],
    general: [
      { q: '¿Cómo puedo solicitar una cotización?', a: 'Contáctanos a través de nuestro formulario, correo o teléfono. Respondemos con una propuesta en menos de 24 horas hábiles.' },
      { q: '¿Cuáles son sus horarios de atención?', a: 'Atendemos de lunes a viernes de 9am a 6pm. Para urgencias contamos con canal de atención especial.' },
      { q: '¿Ofrecen garantía en sus servicios?', a: 'Sí, todos nuestros servicios y productos cuentan con garantía. Los términos específicos se detallan en la propuesta comercial.' },
      { q: '¿Tienen cobertura a nivel nacional?', a: 'Sí, trabajamos en las principales ciudades del país. Contáctanos para verificar cobertura en tu zona.' },
    ],
  };
  return defaults[industry] || defaults.general;
}

// ─── Client logos section label ───────────────────────────────────────────────
function buildClientLogosLabel(analysis) {
  const { companyName } = extractClientInfo(analysis);
  return `Empresas que confían en ${companyName}`;
}

// ─── Header nav — dynamic per industry ───────────────────────────────────────
function buildHeaderNav(analysis) {
  const { industry, business } = extractClientInfo(analysis);
  if (business.nav_items?.length >= 3) {
    return business.nav_items.slice(0, 4);
  }
  const navDefaults = {
    elevator_company: ['Productos', 'Instalación', 'Mantenimiento', 'Contacto'],
    industrial:       ['Productos', 'Proyectos', 'Servicios Técnicos', 'Contacto'],
    saas:             ['Producto', 'Precios', 'Casos de éxito', 'Contacto'],
    agency:           ['Servicios', 'Proyectos', 'Equipo', 'Contacto'],
    fintech:          ['Cómo funciona', 'Planes', 'Seguridad', 'Contacto'],
    general:          ['Servicios', 'Nosotros', 'Proyectos', 'Contacto'],
  };
  return navDefaults[industry] || navDefaults.general;
}

// ─── CTA section content ─────────────────────────────────────────────────────
function buildCTAContent(analysis) {
  const { industry, companyName, business } = extractClientInfo(analysis);
  const copy = analysis.seo_copy_analysis?.rewritten_copy || {};
  const contactEmail = business.contact_email || '#contacto';
  const isEmail = contactEmail !== '#contacto';

  const templates = {
    elevator_company: {
      h2: 'Solicita tu cotización sin costo',
      body: 'Cuéntanos tu proyecto y te enviamos una propuesta técnica detallada. Nuestros especialistas evalúan tu inmueble y recomiendan la solución ideal.',
      btn: copy.ctas?.primary || 'Solicitar cotización →',
      micro: 'Respuesta en menos de 24 horas · Sin compromiso',
    },
    saas: {
      h2: 'Empieza tu prueba gratuita hoy',
      body: 'Sin tarjeta de crédito. Sin instalaciones. En menos de 5 minutos tu equipo tiene acceso a todas las funciones.',
      btn: copy.ctas?.primary || 'Empieza gratis →',
      micro: '14 días gratis · Cancela cuando quieras',
    },
    agency: {
      h2: 'Cuéntanos tu proyecto',
      body: 'Desde el brief hasta el lanzamiento, te acompañamos con un equipo dedicado y resultados medibles en cada entrega.',
      btn: copy.ctas?.primary || 'Iniciar proyecto →',
      micro: 'Respondemos en menos de 24 horas',
    },
    industrial: {
      h2: 'Solicita tu cotización técnica',
      body: 'Cuéntanos los requerimientos de tu proyecto y nuestro equipo de ingeniería te enviará una propuesta técnica detallada con plazos y especificaciones.',
      btn: copy.ctas?.primary || 'Solicitar cotización →',
      micro: 'Respuesta técnica en menos de 24 horas · Sin compromiso',
    },
    general: {
      h2: 'Comencemos hoy',
      body: `Contáctanos y te ayudamos a encontrar la mejor solución para tu proyecto. Sin compromiso.`,
      btn: copy.ctas?.primary || 'Contáctanos →',
      micro: 'Respuesta en menos de 24 horas · Sin compromiso',
    },
  };

  const t = templates[industry] || templates.general;
  return { ...t, contact: contactEmail, isEmail };
}

// ─── Footer data ──────────────────────────────────────────────────────────────
function buildFooterData(analysis) {
  const { industry, companyName, business } = extractClientInfo(analysis);
  const year = new Date().getFullYear();

  const navCols = {
    elevator_company: [
      { title: 'Productos', links: ['Elevadores Residenciales', 'Elevadores Comerciales', 'Montacargas', 'Escaleras Mecánicas'] },
      { title: 'Servicios', links: ['Instalación', 'Mantenimiento', 'Modernización', 'Consultoría Técnica'] },
      { title: 'Empresa', links: ['Nosotros', 'Certificaciones', 'Proyectos', 'Contacto'] },
    ],
    industrial: [
      { title: 'Productos', links: ['Transformadores', 'Sub Estaciones', 'Tableros Eléctricos', 'Ducto de Barras'] },
      { title: 'Servicios', links: ['Ingeniería', 'Instalación', 'Mantenimiento', 'Consultoría Técnica'] },
      { title: 'Empresa', links: ['Nosotros', 'Certificaciones', 'Proyectos', 'Contacto'] },
    ],
    saas: [
      { title: 'Producto', links: ['Funcionalidades', 'Integraciones', 'Seguridad', 'Precios'] },
      { title: 'Empresa', links: ['Sobre nosotros', 'Blog', 'Casos de éxito', 'Carreras'] },
      { title: 'Soporte', links: ['Documentación', 'Centro de ayuda', 'Estado del sistema', 'Contacto'] },
    ],
    agency: [
      { title: 'Servicios', links: ['Diseño UX/UI', 'Desarrollo Web', 'Móvil & Apps', 'IA & Automatización'] },
      { title: 'Empresa', links: ['Nosotros', 'Equipo', 'Blog', 'Casos de éxito'] },
      { title: 'Contacto', links: [business.contact_email || 'Escríbenos', business.contact_phone || 'Llámanos', 'Ubicación'] },
    ],
    general: [
      { title: 'Servicios', links: ['Servicio 1', 'Servicio 2', 'Servicio 3', 'Más servicios'] },
      { title: 'Empresa', links: ['Nosotros', 'Equipo', 'Proyectos', 'Contacto'] },
      { title: 'Contacto', links: [business.contact_email || 'Contáctenos', business.contact_phone || '', 'Ubicación'] },
    ],
  };

  return {
    companyName,
    navCols: navCols[industry] || navCols.general,
    copyright: `© ${year} ${companyName}. Todos los derechos reservados.`,
    tagline: {
      elevator_company: 'Soluciones de movilidad vertical con respaldo técnico certificado.',
      industrial: 'Equipos eléctricos e industriales con ingeniería especializada y soporte técnico.',
      general: 'Calidad y compromiso en cada proyecto.',
    }[industry] || 'Soluciones especializadas para tu empresa.',
  };
}

// Build the complete JSX component as a string
function buildJSXComponent(analysis, geminiImages, ds, assets) {
  const copy = analysis.seo_copy_analysis?.rewritten_copy || {};
  const { industry, companyName } = extractClientInfo(analysis);
  const features = buildClientFeatures(analysis);
  const heroStats = buildHeroStats(analysis);
  const heroBadge = buildHeroBadge(analysis);
  const processSteps = buildClientProcess(analysis);
  const testimonials = buildClientTestimonials(analysis);
  const faq = buildClientFAQ(analysis);
  const clientLogosLabel = buildClientLogosLabel(analysis);
  const headerNav = buildHeaderNav(analysis);
  const ctaContent = buildCTAContent(analysis);
  const footerData = buildFooterData(analysis);
  const colors = ds.colors;
  const fonts = ds.fonts;
  const br = ds.borderRadius;

  // REGLA 1: Real logo URL from scraped assets
  const logoUrl = assets?.logo_url || null;
  const logoImgTag = logoUrl
    ? `<img src="${logoUrl}" alt="${analysis.meta?.company_name || 'Logo'}" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />`
    : null;

  // REGLA 4: Best available images for each section
  const siteImages = assets?.images || [];
  const heroImageData   = pickImage(siteImages, geminiImages, 'hero_image', 0);
  const ctaImageData    = pickImage(siteImages, geminiImages, 'cta_bg', 1);

  const heroImgStyle = heroImageData
    ? `\`linear-gradient(135deg, rgba(${hexToRgb(colors.primary)},0.88) 0%, rgba(${hexToRgb(colors.secondary)},0.82) 100%), url(${heroImageData.src}) center/cover no-repeat\``
    : `\`linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 60%, #05647a 100%)\``;

  const ctaBgStyle = ctaImageData
    ? `\`linear-gradient(135deg, rgba(${hexToRgb(colors.primary)},0.9), rgba(${hexToRgb(colors.secondary)},0.85)), url(${ctaImageData.src}) center/cover no-repeat\``
    : `\`linear-gradient(135deg, \${DS.primary} 0%, \${DS.secondary} 100%)\``;

  // REGLA 5: Client logos carousel data
  const clientLogoUrls = assets?.client_logos || [];
  const hasRealClientLogos = clientLogoUrls.length >= 3;
  const clientLogoNamesDefault = ['Cencosud', 'Sodexo', 'MAPFRE', 'Gloria', 'ENEL', 'San Fernando', 'Los Portales', 'USIL', 'ASBANC', 'Ferreyros'];

  const clientLogosData = hasRealClientLogos
    ? JSON.stringify(clientLogoUrls)
    : JSON.stringify(clientLogoNamesDefault);

  return `
// ─── GrowBy Redesign — generated by GrowBy Web Redesign Agent v0.3.1 ───────
// REGLA 2 — Brand colors: ${colors.primary} · REGLA 3 — Fonts: ${fonts.heading} + ${fonts.body}
// REGLA 1 — Logo: ${logoUrl ? 'real ✅' : 'fallback text'} · REGLA 5 — Client logos: ${hasRealClientLogos ? 'real ✅' : 'text names'}

const DS = {
  primary:   '${colors.primary}',
  secondary: '${colors.secondary}',
  accent:    '${colors.accent}',
  neutral:   '${colors.neutral}',
  dark:      '${colors.dark}',
  mid:       '${colors.mid}',
  bg:        '${colors.background}',
  surface:   '${colors.surface}',
  br:        '${br}',
  brSm:      '${ds.borderRadiusSm}',
  brLg:      '${ds.borderRadiusLg}',
  brFull:    '${ds.borderRadiusFull}',
  headingFont: '"${fonts.heading}", system-ui, sans-serif',
  bodyFont:    '"${fonts.body}", system-ui, sans-serif',
};

// ─── INTERSECTION OBSERVER HOOK ─────────────────────────────────────────────
function useFadeIn(delay = 0) {
  const ref = React.useRef(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible, delay];
}

function FadeIn({ children, delay = 0, className = '' }) {
  const [ref, visible] = useFadeIn(delay);
  return (
    <div ref={ref} className={className}
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(28px)',
               transition: \`opacity 0.6s ease \${delay}ms, transform 0.6s cubic-bezier(0.22,1,0.36,1) \${delay}ms\` }}>
      {children}
    </div>
  );
}

// ─── HEADER / NAV ─── REGLA 1: Logo real del sitio ───────────────────────────
function Header() {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(0,0,0,0.08)' : 'none',
      transition: 'all 0.3s ease',
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    height: '72px' }}>
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          ${logoImgTag || `<span style={{ width: 36, height: 36, borderRadius: DS.brSm,
                         background: \\\`linear-gradient(135deg, \\\${DS.primary}, \\\${DS.secondary})\\\`,
                         display: 'flex', alignItems: 'center', justifyContent: 'center',
                         color: '#fff', fontWeight: 800, fontSize: '1rem',
                         fontFamily: DS.headingFont }}>${companyName.slice(0,1)}</span>`}
          ${logoImgTag ? '' : `<span style={{ fontFamily: DS.headingFont, fontWeight: 700, fontSize: '1.2rem',
                         color: scrolled ? DS.dark : '#fff' }}>${companyName}</span>`}
        </a>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          {${JSON.stringify(headerNav)}.map(item => (
            <a key={item} href="#" style={{
              fontFamily: DS.bodyFont, fontSize: '0.9rem', fontWeight: 500,
              color: scrolled ? DS.mid : 'rgba(255,255,255,0.85)',
              textDecoration: 'none', transition: 'color 0.2s',
            }}
              onMouseEnter={e => e.target.style.color = DS.primary}
              onMouseLeave={e => e.target.style.color = scrolled ? DS.mid : 'rgba(255,255,255,0.85)'}>
              {item}
            </a>
          ))}
          <a href="#contacto" style={{
            padding: '10px 24px', borderRadius: DS.brFull,
            background: DS.primary, color: '#fff',
            fontFamily: DS.bodyFont, fontWeight: 600, fontSize: '0.875rem',
            textDecoration: 'none', transition: 'transform 0.15s, box-shadow 0.15s',
            boxShadow: \`0 4px 16px \${DS.primary}44\`,
          }}
            onMouseEnter={e => { e.target.style.transform = 'scale(1.04)'; e.target.style.boxShadow = \`0 8px 24px \${DS.primary}55\`; }}
            onMouseLeave={e => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = \`0 4px 16px \${DS.primary}44\`; }}>
            ${ctaContent.btn.replace(' →', '')}
          </a>
        </nav>
      </div>
    </header>
  );
}

// ─── HERO SECTION ─── REGLA 4: Imagen real del sitio como fondo ──────────────
function HeroSection() {
  const heroStyle = {
    minHeight: '100vh',
    display: 'flex', alignItems: 'center',
    position: 'relative', overflow: 'hidden',
    background: ${heroImgStyle},
    fontFamily: DS.bodyFont,
  };

  return (
    <section style={heroStyle}>
      <div style={{ position: 'absolute', top: '-15%', right: '-10%', width: '600px', height: '600px',
                    borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-20%', left: '-5%', width: '400px', height: '400px',
                    borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '100px 24px 80px',
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px',
                    alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px',
                        background: 'rgba(255,255,255,0.12)', borderRadius: DS.brFull,
                        padding: '6px 16px', marginBottom: '24px', animation: 'fadeInUp 0.5s ease forwards' }}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)', fontWeight: 600,
                           letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: DS.bodyFont }}>
              ${heroBadge}
            </span>
          </div>
          <h1 style={{ fontFamily: DS.headingFont, fontWeight: 800, fontSize: 'clamp(2.25rem,5vw,3.75rem)',
                       color: '#fff', lineHeight: 1.1, marginBottom: '24px',
                       animation: 'fadeInUp 0.7s ease 0.1s both' }}>
            ${copy.h1?.rewritten || 'Diseñamos y desarrollamos soluciones digitales que hacen crecer tu empresa'}
          </h1>
          <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.88)', lineHeight: 1.7,
                      marginBottom: '40px', maxWidth: '520px',
                      animation: 'fadeInUp 0.7s ease 0.2s both', fontFamily: DS.bodyFont }}>
            ${copy.subheadline || 'Conectamos empresas con especialistas digitales de primer nivel en diseño, desarrollo, IA y marketing.'}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', animation: 'fadeInUp 0.7s ease 0.3s both' }}>
            <a href="#contacto" style={{
              display: 'inline-block', padding: '16px 36px',
              background: DS.accent, color: '#18181b',
              borderRadius: DS.brFull, fontFamily: DS.bodyFont,
              fontWeight: 700, fontSize: '1rem', textDecoration: 'none',
              boxShadow: \`0 8px 32px \${DS.accent}55\`,
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
              ${copy.ctas?.primary || 'Cuéntanos tu proyecto'}
            </a>
            <a href="#proyectos" style={{
              display: 'inline-block', padding: '16px 32px',
              background: 'rgba(255,255,255,0.12)',
              border: '2px solid rgba(255,255,255,0.3)',
              color: '#fff', borderRadius: DS.brFull,
              fontFamily: DS.bodyFont, fontWeight: 600, fontSize: '1rem',
              textDecoration: 'none', transition: 'background 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}>
              ${copy.ctas?.secondary || 'Ver casos de éxito'}
            </a>
          </div>
          <p style={{ marginTop: '16px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)',
                      fontFamily: DS.bodyFont, animation: 'fadeInUp 0.7s ease 0.4s both' }}>
            ${copy.ctas?.micro_copy || 'Respondemos en menos de 24 horas'}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', animation: 'fadeInUp 0.8s ease 0.25s both' }}>
          {${JSON.stringify(heroStats)}.map((stat, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(8px)',
              borderRadius: DS.br,
              padding: '28px',
              border: '1px solid rgba(255,255,255,0.15)',
            }}>
              <div style={{ fontFamily: DS.headingFont, fontWeight: 800,
                            fontSize: '2.25rem', color: '#fff', lineHeight: 1 }}>
                {stat.number}
              </div>
              <div style={{ marginTop: '8px', fontSize: '0.85rem',
                            color: 'rgba(255,255,255,0.7)', fontFamily: DS.bodyFont }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CLIENT LOGOS ─── REGLA 5: Carrusel infinito CSS animation ───────────────
function ClientLogos() {
  const hasRealLogos = ${hasRealClientLogos};
  const items = ${clientLogosData};

  // Duplicate items for seamless loop
  const allItems = [...items, ...items];

  return (
    <section style={{ background: DS.surface, padding: '48px 0', overflow: 'hidden' }}>
      <FadeIn>
        <p style={{ textAlign: 'center', fontFamily: DS.bodyFont, fontSize: '0.85rem',
                    fontWeight: 600, color: DS.mid, textTransform: 'uppercase',
                    letterSpacing: '0.1em', marginBottom: '32px', padding: '0 24px' }}>
          ${clientLogosLabel}
        </p>
      </FadeIn>
      <div style={{ overflow: 'hidden', position: 'relative' }}>
        <div style={{
          display: 'flex',
          gap: hasRealLogos ? '48px' : '64px',
          animation: 'logoScroll 30s linear infinite',
          width: 'max-content',
          alignItems: 'center',
        }}>
          {allItems.map((item, i) => (
            hasRealLogos
              ? <img key={i} src={item} alt="client logo"
                  style={{ height: '40px', width: 'auto', objectFit: 'contain',
                           opacity: 0.6, filter: 'grayscale(100%)',
                           transition: 'opacity 0.2s, filter 0.2s', flexShrink: 0 }}
                  onMouseEnter={e => { e.target.style.opacity = '1'; e.target.style.filter = 'grayscale(0%)'; }}
                  onMouseLeave={e => { e.target.style.opacity = '0.6'; e.target.style.filter = 'grayscale(100%)'; }}
                />
              : <span key={i} style={{
                  fontFamily: DS.headingFont, fontWeight: 700, fontSize: '1rem',
                  color: DS.mid, opacity: 0.55, letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap', flexShrink: 0,
                  transition: 'opacity 0.2s, color 0.2s',
                }}
                  onMouseEnter={e => { e.target.style.opacity = '1'; e.target.style.color = DS.primary; }}
                  onMouseLeave={e => { e.target.style.opacity = '0.55'; e.target.style.color = DS.mid; }}>
                  {item}
                </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FEATURES ────────────────────────────────────────────────────────────────
function FeaturesSection() {
  const features = ${JSON.stringify(features)};

  return (
    <section id="servicios" style={{ background: DS.bg, padding: '96px 24px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <FadeIn>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontFamily: DS.headingFont, fontWeight: 800,
                         fontSize: 'clamp(2rem,4vw,2.75rem)', color: DS.dark, marginBottom: '16px' }}>
              ${copy.value_section?.h2 || '¿Por qué GrowBy?'}
            </h2>
            <p style={{ fontFamily: DS.bodyFont, fontSize: '1.1rem', color: DS.mid,
                        maxWidth: '560px', margin: '0 auto', lineHeight: 1.7 }}>
              ${copy.value_section?.body || 'Accedes a un equipo completo de especialistas digitales sin los costos de contratación tradicional.'}
            </p>
          </div>
        </FadeIn>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '28px' }}>
          {features.map((feat, i) => (
            <FadeIn key={i} delay={i * 100}>
              <div style={{
                background: DS.bg, borderRadius: DS.br,
                padding: '36px', border: \`1px solid rgba(0,0,0,0.06)\`,
                boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = \`0 12px 40px \${DS.primary}18\`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.05)'; }}>
                <div style={{ width: '56px', height: '56px', borderRadius: DS.br,
                              background: \`\${DS.primary}15\`, display: 'flex',
                              alignItems: 'center', justifyContent: 'center',
                              fontSize: '1.75rem', marginBottom: '20px' }}>
                  {feat.icon}
                </div>
                <h3 style={{ fontFamily: DS.headingFont, fontWeight: 700, fontSize: '1.2rem',
                             color: DS.dark, marginBottom: '12px' }}>{feat.title}</h3>
                <p style={{ fontFamily: DS.bodyFont, color: DS.mid,
                            lineHeight: 1.7, fontSize: '0.975rem' }}>{feat.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── PROCESS ─────────────────────────────────────────────────────────────────
function ProcessSection() {
  const steps = ${JSON.stringify(processSteps)};

  return (
    <section style={{ background: DS.surface, padding: '96px 24px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <FadeIn>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontFamily: DS.headingFont, fontWeight: 800,
                         fontSize: 'clamp(1.8rem,4vw,2.5rem)', color: DS.dark, marginBottom: '12px' }}>
              Cómo lo hacemos — simple y sin sorpresas
            </h2>
            <p style={{ fontFamily: DS.bodyFont, color: DS.mid, fontSize: '1.05rem' }}>
              Del brief al lanzamiento, siempre con comunicación directa
            </p>
          </div>
        </FadeIn>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
          {steps.map((step, i) => (
            <FadeIn key={i} delay={i * 120}>
              <div style={{ position: 'relative', padding: '40px 32px',
                            background: DS.bg, borderRadius: DS.brLg,
                            border: \`2px solid \${i === 1 ? DS.primary : 'transparent'}\`,
                            boxShadow: i === 1 ? \`0 8px 40px \${DS.primary}20\` : '0 2px 12px rgba(0,0,0,0.05)' }}>
                <span style={{ display: 'inline-block', fontFamily: DS.headingFont, fontWeight: 800,
                               fontSize: '3rem', color: \`\${DS.primary}20\`,
                               lineHeight: 1, marginBottom: '16px' }}>{step.n}</span>
                {i === 1 && (
                  <span style={{ position: 'absolute', top: '20px', right: '20px',
                                 background: DS.primary, color: '#fff', fontSize: '0.7rem',
                                 fontWeight: 700, padding: '4px 12px', borderRadius: DS.brFull,
                                 fontFamily: DS.bodyFont }}>MÁS POPULAR</span>
                )}
                <h3 style={{ fontFamily: DS.headingFont, fontWeight: 700, fontSize: '1.25rem',
                             color: DS.dark, marginBottom: '12px' }}>{step.title}</h3>
                <p style={{ fontFamily: DS.bodyFont, color: DS.mid, lineHeight: 1.7, fontSize: '0.95rem' }}>{step.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── TESTIMONIALS ────────────────────────────────────────────────────────────
function TestimonialsSection() {
  const testimonials = ${JSON.stringify(testimonials)};

  return (
    <section style={{ background: DS.bg, padding: '96px 24px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <FadeIn>
          <h2 style={{ textAlign: 'center', fontFamily: DS.headingFont, fontWeight: 800,
                       fontSize: 'clamp(1.8rem,4vw,2.5rem)', color: DS.dark, marginBottom: '56px' }}>
            Lo que dicen nuestros clientes
          </h2>
        </FadeIn>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '28px' }}>
          {testimonials.map((t, i) => (
            <FadeIn key={i} delay={i * 100}>
              <div style={{ background: DS.bg, borderRadius: DS.brLg, padding: '36px',
                            border: '1px solid rgba(0,0,0,0.07)',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.06)', display: 'flex',
                            flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1,2,3,4,5].map(s => (
                    <span key={s} style={{ color: DS.accent, fontSize: '1.1rem' }}>★</span>
                  ))}
                </div>
                <p style={{ fontFamily: DS.bodyFont, color: DS.mid, lineHeight: 1.75,
                            fontSize: '0.975rem', flex: 1 }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px',
                              paddingTop: '16px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%',
                                background: \`linear-gradient(135deg, \${DS.primary}, \${DS.secondary})\`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontWeight: 700, fontFamily: DS.headingFont,
                                fontSize: '1rem', flexShrink: 0 }}>
                    {t.name.split(' ').map(w => w[0]).join('').slice(0,2)}
                  </div>
                  <div>
                    <p style={{ fontFamily: DS.headingFont, fontWeight: 600, fontSize: '0.9rem',
                                color: DS.dark, margin: 0 }}>{t.name}</p>
                    <p style={{ fontFamily: DS.bodyFont, fontSize: '0.8rem', color: DS.mid, margin: 0 }}>
                      {t.role} · {t.company}
                    </p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────
function FAQSection() {
  const [open, setOpen] = React.useState(null);
  const faq = ${JSON.stringify(faq)};

  return (
    <section style={{ background: DS.surface, padding: '96px 24px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <FadeIn>
          <h2 style={{ textAlign: 'center', fontFamily: DS.headingFont, fontWeight: 800,
                       fontSize: 'clamp(1.8rem,4vw,2.5rem)', color: DS.dark, marginBottom: '48px' }}>
            Preguntas frecuentes
          </h2>
        </FadeIn>
        {faq.map((item, i) => (
          <FadeIn key={i} delay={i * 80}>
            <div style={{ borderBottom: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden' }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between',
                         alignItems: 'center', padding: '24px 0', background: 'none',
                         border: 'none', cursor: 'pointer', textAlign: 'left', gap: '16px' }}>
                <span style={{ fontFamily: DS.headingFont, fontWeight: 600, fontSize: '1.05rem',
                               color: DS.dark }}>{item.q}</span>
                <span style={{ color: DS.primary, fontSize: '1.5rem', fontWeight: 300,
                               transform: open === i ? 'rotate(45deg)' : 'rotate(0)',
                               transition: 'transform 0.25s ease', flexShrink: 0 }}>+</span>
              </button>
              {open === i && (
                <div style={{ padding: '0 0 24px', fontFamily: DS.bodyFont, color: DS.mid,
                              lineHeight: 1.75, fontSize: '0.975rem' }}>
                  {item.a}
                </div>
              )}
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

// ─── CTA FINAL ─── REGLA 4: Imagen real de fondo ─────────────────────────────
function CTASection() {
  const ctaStyle = {
    padding: '112px 24px',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
    background: ${ctaBgStyle},
  };

  return (
    <section id="contacto" style={ctaStyle}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)' }} />
      <div style={{ position: 'relative', maxWidth: '700px', margin: '0 auto' }}>
        <FadeIn>
          <h2 style={{ fontFamily: DS.headingFont, fontWeight: 800,
                       fontSize: 'clamp(2rem,5vw,3rem)', color: '#fff',
                       marginBottom: '20px', lineHeight: 1.15 }}>
            ${ctaContent.h2}
          </h2>
          <p style={{ fontFamily: DS.bodyFont, color: 'rgba(255,255,255,0.85)',
                      fontSize: '1.15rem', marginBottom: '40px', lineHeight: 1.7 }}>
            ${ctaContent.body}
          </p>
          <a href="mailto:${ctaContent.contact}" style={{
            display: 'inline-block', padding: '18px 48px',
            background: DS.accent, color: '#18181b',
            borderRadius: DS.brFull, fontFamily: DS.bodyFont,
            fontWeight: 700, fontSize: '1.1rem', textDecoration: 'none',
            boxShadow: \`0 8px 40px \${DS.accent}55\`,
            animation: 'ctaPulse 3s ease-in-out infinite',
          }}>
            ${ctaContent.btn}
          </a>
          <p style={{ marginTop: '20px', fontFamily: DS.bodyFont,
                      color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem' }}>
            Sin compromiso · Respondemos en menos de 24h · ${ctaContent.contact}
          </p>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── FOOTER ─── REGLA 1: Logo real del sitio ─────────────────────────────────
function Footer() {
  return (
    <footer style={{ background: DS.dark, padding: '64px 24px 32px', fontFamily: DS.bodyFont }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '48px', marginBottom: '48px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              ${logoUrl
                ? `<img src="${logoUrl}" alt="${companyName}" style={{ height: '36px', width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />`
                : `<span style={{ width: 36, height: 36, borderRadius: DS.brSm,
                             background: \\\`linear-gradient(135deg, \\\${DS.primary}, \\\${DS.secondary})\\\`,
                             display: 'flex', alignItems: 'center', justifyContent: 'center',
                             color: '#fff', fontWeight: 800, fontSize: '1rem',
                             fontFamily: DS.headingFont }}>${companyName.slice(0,1)}</span>
              <span style={{ fontFamily: DS.headingFont, fontWeight: 700, fontSize: '1.2rem', color: '#fff' }}>${companyName}</span>`
              }
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', lineHeight: 1.7 }}>
              ${footerData.tagline}
            </p>
          </div>
          {${JSON.stringify(footerData.navCols)}.map((col, i) => (
            <div key={i}>
              <h4 style={{ fontFamily: DS.headingFont, fontWeight: 700, fontSize: '0.9rem',
                           color: '#fff', marginBottom: '16px', textTransform: 'uppercase',
                           letterSpacing: '0.08em' }}>{col.title}</h4>
              {col.links.map(link => (
                <a key={link} href="#" style={{ display: 'block', color: 'rgba(255,255,255,0.5)',
                                               fontSize: '0.875rem', textDecoration: 'none',
                                               marginBottom: '10px', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color = DS.primary}
                  onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.5)'}>
                  {link}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div style={{ paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>
            ${footerData.copyright}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem' }}>
            Rediseño generado por GrowBy Web Redesign Agent
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── APP ROOT ────────────────────────────────────────────────────────────────
function App() {
  return (
    <div style={{ fontFamily: DS.bodyFont }}>
      <Header />
      <HeroSection />
      <ClientLogos />
      <FeaturesSection />
      <ProcessSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
}
`;
}

// Helper: hex → "r,g,b" string for rgba()
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0,0,0';
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}

// REGLA 3: Build HTML wrapper with real Google Fonts if available
function buildHTML(jsxComponent, analysis, ds, assets) {
  const copy = analysis.seo_copy_analysis?.rewritten_copy || {};
  const clientCompanyName = analysis.scraping?.business?.company_name || analysis.scraping?.brand?.name || 'Empresa';
  const metaTitle = copy.meta_title || analysis.scraping?.title || `${clientCompanyName} — Sitio Web`;
  const metaDesc = copy.meta_description || analysis.scraping?.description || 'Especialistas digitales.';
  const colors = ds.colors;

  // REGLA 3: Use real Google Fonts URL if detected, otherwise construct from detected fonts
  let fontsLink;
  if (assets?.google_fonts_url) {
    fontsLink = `<link href="${assets.google_fonts_url}" rel="stylesheet" />`;
  } else {
    const headingFont = ds.fonts.heading.replace(/\s+/g, '+');
    const bodyFont = ds.fonts.body.replace(/\s+/g, '+');
    fontsLink = `<link href="https://fonts.googleapis.com/css2?family=${headingFont}:wght@400;600;700;800&family=${bodyFont}:wght@400;500;600&display=swap" rel="stylesheet" />`;
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${metaTitle}</title>
  <meta name="description" content="${metaDesc}" />
  <meta property="og:title" content="${metaTitle}" />
  <meta property="og:description" content="${metaDesc}" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  ${fontsLink}
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { background: ${colors.background}; }
    :root {
      --color-primary:   ${colors.primary};
      --color-secondary: ${colors.secondary};
      --color-accent:    ${colors.accent};
      --color-dark:      ${colors.dark};
      --color-neutral:   ${colors.neutral};
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes ctaPulse {
      0%, 100% { transform: scale(1); box-shadow: 0 8px 40px ${colors.accent}66; }
      50%       { transform: scale(1.03); box-shadow: 0 12px 48px ${colors.accent}88; }
    }
    /* REGLA 5: Logo carousel animation */
    @keyframes logoScroll {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
    @media (max-width: 768px) {
      .grid-2-col { grid-template-columns: 1fr !important; }
      nav a:not(:last-child) { display: none; }
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
${jsxComponent}
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(App));
  </script>
</body>
</html>`;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export async function generate(analysisPath) {
  console.log('\n━━━ FASE 3: GENERACIÓN DEL ARTIFACT ━━━━━━━━━━━━━━━');
  console.log(`  📄 Leyendo: ${analysisPath}`);

  const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
  const outputDir = path.dirname(analysisPath);

  // REGLA 1-3: Load real assets from scraping
  const assets = analysis.scraping?.assets || null;

  // REGLA 2-3: Map DS using brand colors and fonts from assets
  const ds = mapDesignSystem(analysis.ui_analysis?.design_system || {}, assets);

  const imagePrompts = analysis.visual_analysis?.image_prompts || [];
  const timestamp = analysis.meta?.timestamp || Date.now();

  // Asset summary
  console.log('\n  📦 Assets del sitio original:');
  console.log(`     Logo:            ${assets?.logo_url ? '✅ ' + assets.logo_url.slice(0,60) : '❌ no encontrado'}`);
  console.log(`     Colores de marca: ${assets?.colors?.length ? '✅ ' + (assets.colors.slice(0,3).join(', ') || '-') : '❌'}`);
  console.log(`     Google Fonts:    ${assets?.google_fonts_url ? '✅' : '❌'}`);
  console.log(`     Imágenes reales: ${assets?.images?.length || 0}`);
  console.log(`     Logos clientes:  ${assets?.client_logos?.length || 0}`);
  console.log(`     Colores aplicados: ${ds.colors.primary} · ${ds.colors.secondary}`);

  // Generate Gemini images (REGLA 4: only for sections without real images)
  console.log(`\n  🖼️  Generando ${imagePrompts.length} imágenes via Gemini API...`);
  const geminiImages = await generateAllImages(imagePrompts, timestamp);
  const generatedCount = Object.values(geminiImages).filter(Boolean).length;
  console.log(`  ✓ ${generatedCount}/${imagePrompts.length} imágenes Gemini`);

  // Build artifact
  console.log('\n  🔨 Construyendo artifact React con assets reales...');
  const jsxComponent = buildJSXComponent(analysis, geminiImages, ds, assets);

  const jsxPath = path.join(outputDir, 'redesign.jsx');
  fs.writeFileSync(jsxPath, jsxComponent);
  console.log(`  ✓ redesign.jsx (${Math.round(jsxComponent.length / 1024)}KB)`);

  const html = buildHTML(jsxComponent, analysis, ds, assets);

  // Anti-contamination check — the output must NOT contain GrowBy brand references
  const contaminated = ['kevin@growby.tech', '+51 994 440 840', 'Hub Negocios Creativos', 'growby.tech', 'GrowBy AI', 'Staff Augmentation GrowBy']
    .some(t => html.includes(t));
  if (contaminated) {
    console.warn('  ⚠️  ADVERTENCIA: HTML contiene referencias a GrowBy — revisar buildJSXComponent()');
  } else {
    console.log('  ✅ Anti-contaminación OK — sin referencias a GrowBy en el output');
  }

  const htmlPath = path.join(outputDir, 'index.html');
  fs.writeFileSync(htmlPath, html);
  console.log(`  ✓ index.html (${Math.round(html.length / 1024)}KB)`);

  return { outputDir, jsxPath, htmlPath, imagesGenerated: generatedCount, totalImages: imagePrompts.length };
}
