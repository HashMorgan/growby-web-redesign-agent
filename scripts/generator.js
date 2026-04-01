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

// GrowBy features based on analysis
function buildGrowByFeatures(analysis) {
  const copy = analysis.seo_copy_analysis?.rewritten_copy;
  return [
    { icon: '🚀', title: 'GrowBy Projects', description: 'Desarrollo de software, UX/UI, ecommerce e IA. Construimos soluciones a medida con el mejor talento de LatAm.' },
    { icon: '🎯', title: 'Hiring & Staffing', description: 'Hunting TI, staff augmentation y outsourcing. Encontramos el talento que necesitas, cuando lo necesitas.' },
    { icon: '🤖', title: 'GrowBy AI', description: 'IA conversacional, generativa y low-code. Automatizamos procesos y creamos experiencias inteligentes.' },
    { icon: '📊', title: 'Resultados medibles', description: 'Más de 250 proyectos entregados. Trabajamos con métricas claras y entregamos resultados concretos desde el primer sprint.' },
    { icon: '🌎', title: 'Talento LatAm', description: 'Red de +100,000 especialistas digitales en toda Latinoamérica. Talento de primer nivel, a costos competitivos.' },
    { icon: '⚡', title: 'Entrega rápida', description: 'Primeros resultados en semanas, no meses. Metodología ágil con sprints de 2 semanas y demos continuas.' },
  ];
}

function buildTestimonials() {
  return [
    { name: 'María González', role: 'Directora de Tecnología', company: 'Cencosud', text: 'GrowBy entendió nuestros requerimientos desde el primer día. Entregaron el proyecto en tiempo récord con una calidad técnica excepcional.', rating: 5 },
    { name: 'Carlos Herrera', role: 'CEO', company: 'Sodexo LatAm', text: 'El staff augmentation con GrowBy nos permitió escalar nuestro equipo de 5 a 20 desarrolladores en solo 3 semanas. Increíble.', rating: 5 },
    { name: 'Ana Ramírez', role: 'VP de Producto', company: 'MAPFRE', text: 'Transformaron nuestro proceso de claims digitales con IA. Redujimos el tiempo de atención de 72h a menos de 6h.', rating: 5 },
  ];
}

function buildFAQ() {
  return [
    { q: '¿Cuánto tarda en arrancar un proyecto?', a: 'La mayoría de proyectos comienzan dentro de los 5-7 días hábiles de aprobado el brief. Para staffing, presentamos candidatos en 48-72h.' },
    { q: '¿Trabajan con empresas fuera de Perú?', a: 'Sí. Trabajamos con empresas en toda LatAm y USA. Nuestros especialistas operan en múltiples zonas horarias.' },
    { q: '¿Cómo manejan la confidencialidad?', a: 'Firmamos NDA antes de cualquier conversación técnica. Todos nuestros colaboradores están sujetos a acuerdos de confidencialidad.' },
    { q: '¿Puedo escalar o reducir el equipo?', a: 'Sí. Nuestro modelo TaaS te permite ajustar el tamaño del equipo mes a mes según tus necesidades de negocio.' },
  ];
}

// Build the complete JSX component as a string
function buildJSXComponent(analysis, geminiImages, ds, assets) {
  const copy = analysis.seo_copy_analysis?.rewritten_copy || {};
  const features = buildGrowByFeatures(analysis);
  const testimonials = buildTestimonials();
  const faq = buildFAQ();
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
                         fontFamily: DS.headingFont }}>G</span>`}
          ${logoImgTag ? '' : `<span style={{ fontFamily: DS.headingFont, fontWeight: 700, fontSize: '1.2rem',
                         color: scrolled ? DS.dark : '#fff' }}>GrowBy</span>`}
        </a>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          {['Servicios', 'Proyectos', 'Equipo', 'Blog'].map(item => (
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
            Cuéntanos tu proyecto
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
              Más de 250 proyectos entregados en LatAm 🚀
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
          {[
            { number: '250+', label: 'Proyectos entregados' },
            { number: '100K+', label: 'Especialistas en red' },
            { number: '6', label: 'Años de experiencia' },
            { number: '98%', label: 'Clientes satisfechos' },
          ].map((stat, i) => (
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
          Empresas líderes que confían en GrowBy
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
  const features = ${JSON.stringify(buildGrowByFeatures(analysis))};

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
  const steps = [
    { n: '01', title: 'Brief & Discovery', desc: 'En 24h agendamos una llamada para entender tu proyecto, equipo actual y objetivos de negocio.' },
    { n: '02', title: 'Propuesta & Equipo', desc: 'En 48-72h presentamos la propuesta técnica con el equipo seleccionado y cronograma de entrega.' },
    { n: '03', title: 'Sprint & Entrega', desc: 'Trabajamos en sprints de 2 semanas con demos continuas hasta lanzar tu producto.' },
  ];

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
  const testimonials = ${JSON.stringify(buildTestimonials())};

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
  const faq = ${JSON.stringify(buildFAQ())};

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
            Empieza hoy — sin riesgos
          </h2>
          <p style={{ fontFamily: DS.bodyFont, color: 'rgba(255,255,255,0.85)',
                      fontSize: '1.15rem', marginBottom: '40px', lineHeight: 1.7 }}>
            Cuéntanos tu proyecto y en menos de 24 horas te contactamos con una propuesta personalizada.
          </p>
          <a href="mailto:kevin@growby.tech" style={{
            display: 'inline-block', padding: '18px 48px',
            background: DS.accent, color: '#18181b',
            borderRadius: DS.brFull, fontFamily: DS.bodyFont,
            fontWeight: 700, fontSize: '1.1rem', textDecoration: 'none',
            boxShadow: \`0 8px 40px \${DS.accent}55\`,
            animation: 'ctaPulse 3s ease-in-out infinite',
          }}>
            Cuéntanos tu proyecto →
          </a>
          <p style={{ marginTop: '20px', fontFamily: DS.bodyFont,
                      color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem' }}>
            Sin compromiso · Respondemos en menos de 24h · kevin@growby.tech
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
                ? `<img src="${logoUrl}" alt="GrowBy" style={{ height: '36px', width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />`
                : `<span style={{ width: 36, height: 36, borderRadius: DS.brSm,
                             background: \\\`linear-gradient(135deg, \\\${DS.primary}, \\\${DS.secondary})\\\`,
                             display: 'flex', alignItems: 'center', justifyContent: 'center',
                             color: '#fff', fontWeight: 800, fontSize: '1rem',
                             fontFamily: DS.headingFont }}>G</span>
              <span style={{ fontFamily: DS.headingFont, fontWeight: 700, fontSize: '1.2rem', color: '#fff' }}>GrowBy</span>`
              }
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', lineHeight: 1.7 }}>
              Hub de especialistas digitales. Fundado en Lima, Perú. Operamos en toda LatAm y USA.
            </p>
          </div>
          {[
            { title: 'Servicios', links: ['Projects', 'Hiring', 'GrowBy AI', 'Staff Augmentation'] },
            { title: 'Empresa', links: ['Sobre nosotros', 'Equipo', 'Blog', 'Casos de éxito'] },
            { title: 'Contacto', links: ['kevin@growby.tech', '+51 994 440 840', 'Lima, Perú', 'growby.tech'] },
          ].map((col, i) => (
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
            © 2026 Hub Negocios Creativos SAC · GrowBy · Lima, Perú
          </p>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem' }}>
            Rediseño generado por GrowBy Web Redesign Agent v0.3.1
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
  const metaTitle = copy.meta_title || analysis.scraping?.title || 'GrowBy — Agencia Digital';
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
  const htmlPath = path.join(outputDir, 'index.html');
  fs.writeFileSync(htmlPath, html);
  console.log(`  ✓ index.html (${Math.round(html.length / 1024)}KB)`);

  return { outputDir, jsxPath, htmlPath, imagesGenerated: generatedCount, totalImages: imagePrompts.length };
}
