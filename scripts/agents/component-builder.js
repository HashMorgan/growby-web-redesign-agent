import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

// ─── Template engine — load file and replace {{key}} placeholders ─────────────
function loadTemplate(name) {
  const filePath = path.join(TEMPLATES_DIR, `${name}.html`);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

function fillTemplate(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : ''
  );
}

// ─── SVG icons per industry ───────────────────────────────────────────────────
const INDUSTRY_SVG_ICONS = {
  industrial: [
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><path d="M5 6h14M5 18h14"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  ],
  elevator_company: [
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 7v4M9 10l3-3 3 3M12 17v-4M9 14l3 3 3-3"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
  ],
  saas: [
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7M6 9v12"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  ],
  general: [
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>`,
  ],
};

function getSVGIcons(industry) {
  return INDUSTRY_SVG_ICONS[industry] || INDUSTRY_SVG_ICONS.general;
}

// ─── HTML escape ──────────────────────────────────────────────────────────────
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── Component builders ───────────────────────────────────────────────────────

function buildNav(layoutPlan, analysis) {
  const companyName = layoutPlan.company_name;
  const logoUrl = analysis.scraping?.assets?.logo_url || null;
  const navItems = analysis.scraping?.business?.nav_items || [];
  const ctaText = analysis.seo_copy_analysis?.rewritten_copy?.cta_primary || 'Contáctanos';

  const navLinks = navItems.length > 0
    ? navItems.slice(0, 5).map(item => `<a href="#" class="nav-link">${esc(item)}</a>`).join('\n      ')
    : `<a href="#servicios" class="nav-link">Servicios</a>
      <a href="#nosotros" class="nav-link">Nosotros</a>
      <a href="#contacto" class="nav-link">Contacto</a>`;

  const logoHtml = logoUrl
    ? `<img src="${esc(logoUrl)}" alt="${esc(companyName)} logo" class="nav-logo-img" loading="eager">`
    : `<span class="nav-logo-text">${esc(companyName)}</span>`;

  const tpl = loadTemplate('nav');
  if (tpl) return fillTemplate(tpl, { company_name: esc(companyName), logo_html: logoHtml, nav_links: navLinks, cta_text: esc(ctaText) });

  // Inline fallback
  return `<nav class="nav" id="navbar" role="navigation" aria-label="Navegación principal">
  <div class="nav-inner">
    <a href="#" class="nav-brand" aria-label="${esc(companyName)} - Inicio">${logoHtml}</a>
    <div class="nav-links" id="nav-links">${navLinks}</div>
    <a href="#contacto" class="btn btn-primary btn-sm nav-cta">${esc(ctaText)}</a>
    <button class="nav-hamburger" id="nav-hamburger" aria-label="Abrir menú" aria-expanded="false" aria-controls="nav-links">
      <span></span><span></span><span></span>
    </button>
  </div>
</nav>`;
}

function buildHero(props, ds) {
  const hasImage = !!props.hero_image;
  const heroStyle = hasImage
    ? `style="background-image: url('${esc(props.hero_image)}'); background-size: cover; background-position: center;"`
    : '';

  const tpl = loadTemplate('hero');
  if (tpl) {
    return fillTemplate(tpl, {
      hero_image_class: hasImage ? ' hero--image' : '',
      hero_style: heroStyle,
      hero_overlay: hasImage ? '<div class="hero-overlay"></div>' : '',
      badge_html: props.badge_text ? `<div class="hero-badge reveal-item">${esc(props.badge_text)}</div>` : '',
      headline: esc(props.headline),
      subheadline: esc(props.subheadline),
      cta_primary: esc(props.cta_primary),
      cta_secondary_html: props.cta_secondary ? `<a href="#servicios" class="btn btn-ghost hero-cta-secondary reveal-item">${esc(props.cta_secondary)}</a>` : '',
      trust_html: props.trust_micro ? `<p class="hero-trust reveal-item">${esc(props.trust_micro)}</p>` : '',
    });
  }

  // Inline fallback
  return `<section class="hero${hasImage ? ' hero--image' : ''}" ${heroStyle} aria-labelledby="hero-heading">
  ${hasImage ? '<div class="hero-overlay"></div>' : ''}
  <div class="hero-content container">
    ${props.badge_text ? `<div class="hero-badge reveal-item">${esc(props.badge_text)}</div>` : ''}
    <h1 id="hero-heading" class="hero-heading reveal-item">${esc(props.headline)}</h1>
    <p class="hero-sub reveal-item">${esc(props.subheadline)}</p>
    <div class="hero-actions reveal-item">
      <a href="#contacto" class="btn btn-primary btn-lg">${esc(props.cta_primary)}</a>
      ${props.cta_secondary ? `<a href="#servicios" class="btn btn-ghost hero-cta-secondary reveal-item">${esc(props.cta_secondary)}</a>` : ''}
    </div>
    ${props.trust_micro ? `<p class="hero-trust reveal-item">${esc(props.trust_micro)}</p>` : ''}
  </div>
</section>`;
}

function buildLogoCarousel(props) {
  if (!props.logos || props.logos.length === 0) return '';

  // Duplicate list for seamless CSS marquee
  const logoItems = props.logos.map(logo =>
    `<li class="logo-item"><img src="${esc(logo)}" alt="Cliente" loading="lazy"></li>`
  ).join('\n      ');

  return `<section class="logos" aria-label="${esc(props.label || 'Clientes')}">
  <div class="logos-inner">
    <ul class="logos-track" aria-hidden="true">
      ${logoItems}
      ${logoItems}
    </ul>
  </div>
</section>`;
}

function buildStatsBanner(props, ds) {
  const statsItems = (props.stats || []).map(stat =>
    `<div class="stat-item reveal-item">
      <span class="stat-value">${esc(stat.value)}</span>
      <span class="stat-label">${esc(stat.label)}</span>
    </div>`
  ).join('\n      ');

  const tpl = loadTemplate('impact');
  if (tpl) return fillTemplate(tpl, { stats_items: statsItems });

  return `<section class="stats" aria-label="Cifras de impacto">
  <div class="container stats-grid">${statsItems}</div>
</section>`;
}

function buildFeaturesList(props, ds, industry) {
  const icons = getSVGIcons(industry);
  const r = parseInt(ds.colors.primary.slice(1,3),16);
  const g = parseInt(ds.colors.primary.slice(3,5),16);
  const b = parseInt(ds.colors.primary.slice(5,7),16);
  const featuresBg = `rgba(${r},${g},${b},0.04)`;

  const featureItems = (props.features || []).slice(0, 8).map((f, i) => {
    const icon = icons[i % icons.length];
    return `<article class="feature-item reveal-item" style="--stagger-delay: ${i * 50}ms">
      <div class="feature-icon" aria-hidden="true">${icon}</div>
      <h3 class="feature-title">${esc(f.name || f.title)}</h3>
      <p class="feature-desc">${esc(f.description || f.name)}</p>
    </article>`;
  }).join('\n      ');

  const tpl = loadTemplate('services');
  if (tpl) return fillTemplate(tpl, {
    features_bg: featuresBg,
    section_title: esc(props.headline || 'Nuestros servicios'),
    section_sub: props.subheadline ? esc(props.subheadline) : '',
    feature_items: featureItems,
  });

  return `<section class="features" id="servicios" aria-labelledby="features-heading" style="background:${featuresBg}">
  <div class="container">
    <div class="section-header">
      <h2 id="features-heading" class="section-title reveal-item">${esc(props.headline || 'Nuestros servicios')}</h2>
      ${props.subheadline ? `<p class="section-sub reveal-item">${esc(props.subheadline)}</p>` : ''}
    </div>
    <div class="features-grid">${featureItems}</div>
  </div>
</section>`;
}

function buildFeaturesBento(props, ds, industry) {
  const icons = getSVGIcons(industry);
  const features = (props.features || []).slice(0, 4);

  const bentoItems = features.map((f, i) => {
    const icon = icons[i % icons.length];
    const isLarge = i === 0;
    return `<article class="bento-item${isLarge ? ' bento-item--large' : ''} reveal-item" style="--stagger-delay: ${i * 75}ms">
      <div class="bento-icon" aria-hidden="true">${icon}</div>
      <h3 class="bento-title">${esc(f.name || f.title)}</h3>
      <p class="bento-desc">${esc(f.description || f.name)}</p>
    </article>`;
  }).join('\n    ');

  return `<section class="features features--bento" id="servicios" aria-labelledby="features-heading">
  <div class="container">
    <div class="section-header">
      <h2 id="features-heading" class="section-title reveal-item">${esc(props.headline || 'Nuestros servicios')}</h2>
      ${props.subheadline ? `<p class="section-sub reveal-item">${esc(props.subheadline)}</p>` : ''}
    </div>
    <div class="bento-grid">
      ${bentoItems}
    </div>
  </div>
</section>`;
}

function buildProcess(props) {
  const stepsHtml = (props.steps || []).map((step, i) =>
    `<div class="process-step reveal-item" style="--stagger-delay: ${i * 100}ms">
      <div class="process-number" aria-hidden="true">${esc(step.number || String(i + 1).padStart(2, '0'))}</div>
      <div class="process-content">
        <h3 class="process-title">${esc(step.title)}</h3>
        <p class="process-desc">${esc(step.description)}</p>
      </div>
    </div>`
  ).join('\n    ');

  return `<section class="process" aria-labelledby="process-heading">
  <div class="container">
    <div class="section-header">
      <h2 id="process-heading" class="section-title reveal-item">${esc(props.headline || 'Cómo trabajamos')}</h2>
    </div>
    <div class="process-steps">
      ${stepsHtml}
    </div>
  </div>
</section>`;
}

function buildTestimonials(props) {
  const cardsHtml = (props.testimonials || []).map((t, i) =>
    `<article class="testimonial-card reveal-item" style="--stagger-delay: ${i * 75}ms">
      <div class="testimonial-quote" aria-hidden="true">"</div>
      <blockquote class="testimonial-text">${esc(t.quote || t.text)}</blockquote>
      <footer class="testimonial-footer">
        <div class="testimonial-avatar" aria-hidden="true">${esc((t.name || 'C')[0].toUpperCase())}</div>
        <div class="testimonial-meta">
          <cite class="testimonial-name">${esc(t.name || 'Cliente')}</cite>
          ${t.company ? `<span class="testimonial-company">${esc(t.company)}</span>` : ''}
        </div>
      </footer>
    </article>`
  ).join('\n    ');

  return `<section class="testimonials" aria-labelledby="testimonials-heading">
  <div class="container">
    <div class="section-header">
      <h2 id="testimonials-heading" class="section-title reveal-item">${esc(props.headline || 'Lo que dicen nuestros clientes')}</h2>
    </div>
    <div class="testimonials-grid">
      ${cardsHtml}
    </div>
  </div>
</section>`;
}

function buildCTA(props, ds) {
  const phoneHtml = props.contact_phone
    ? `<a href="tel:${esc(props.contact_phone.replace(/\s/g,''))}" class="btn btn-ghost-light">${esc(props.contact_phone)}</a>`
    : '';
  const r=parseInt(ds.colors.primary.slice(1,3),16),g=parseInt(ds.colors.primary.slice(3,5),16),b=parseInt(ds.colors.primary.slice(5,7),16);
  const darkened = `rgb(${Math.round(r*0.7)},${Math.round(g*0.7)},${Math.round(b*0.7)})`;

  const tpl = loadTemplate('cta');
  if (tpl) return fillTemplate(tpl, {
    cta_bg: `linear-gradient(135deg, ${ds.colors.primary} 0%, ${darkened} 100%)`,
    cta_image_overlay: '',
    cta_headline: esc(props.headline),
    cta_subtext: esc(props.subtext),
    contact_email: esc(props.contact_email || '#'),
    cta_button_text: esc(props.cta_primary),
    phone_html: phoneHtml,
  });

  return `<section class="cta-section" id="contacto" aria-labelledby="cta-heading" style="background:linear-gradient(135deg,${ds.colors.primary},${darkened})">
  <div class="container cta-inner">
    <h2 id="cta-heading" class="cta-heading reveal-item">${esc(props.headline)}</h2>
    <p class="cta-sub reveal-item">${esc(props.subtext)}</p>
    <div class="cta-actions reveal-item">
      <a href="mailto:${esc(props.contact_email||'#')}" class="btn btn-cta btn-lg">${esc(props.cta_primary)}</a>
      ${phoneHtml}
    </div>
  </div>
</section>`;
}

function buildFooter(props, ds) {
  const logoHtml = props.logo_url
    ? `<img src="${esc(props.logo_url)}" alt="${esc(props.company_name)} logo" class="footer-logo-img" loading="lazy">`
    : `<span class="footer-logo-text">${esc(props.company_name)}</span>`;

  const serviceLinks = (props.links || []).slice(0, 5).map(link =>
    `<li><a href="#" class="footer-link">${esc(link)}</a></li>`
  ).join('\n      ');

  const contactHtml = [
    props.contact_email ? `<a href="mailto:${esc(props.contact_email)}" class="footer-contact-link">${esc(props.contact_email)}</a>` : '',
    props.contact_phone ? `<a href="tel:${esc(props.contact_phone.replace(/\s/g,''))}" class="footer-contact-link">${esc(props.contact_phone)}</a>` : '',
  ].filter(Boolean).join('\n      ');

  const tpl = loadTemplate('footer');
  if (tpl) return fillTemplate(tpl, {
    footer_logo_html: `<a href="#" aria-label="${esc(props.company_name)}">${logoHtml}</a>`,
    tagline: esc(props.tagline || ''),
    footer_service_links: serviceLinks,
    footer_contact_html: contactHtml,
    year: new Date().getFullYear(),
    company_name: esc(props.company_name),
  });

  return `<footer class="footer" role="contentinfo">
  <div class="container footer-grid">
    <div class="footer-brand"><a href="#" aria-label="${esc(props.company_name)}">${logoHtml}</a>${props.tagline?`<p class="footer-tagline">${esc(props.tagline)}</p>`:''}</div>
    ${serviceLinks?`<nav class="footer-nav" aria-label="Servicios"><ul>${serviceLinks}</ul></nav>`:''}
    <div class="footer-contact">${contactHtml}</div>
  </div>
  <div class="footer-bottom"><div class="container"><p class="footer-copy">&copy; ${new Date().getFullYear()} ${esc(props.company_name)}.</p></div></div>
</footer>`;
}

// ─── Global CSS ───────────────────────────────────────────────────────────────
function buildGlobalCSS(ds, industry) {
  const p = ds.colors;
  const f = ds.fonts;

  return `/* ── Reset & Base ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; font-size: 16px; }
body {
  font-family: var(--font-body);
  color: var(--color-dark);
  background: var(--color-bg);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
img { max-width: 100%; height: auto; display: block; }
a { color: inherit; text-decoration: none; }
ul, ol { list-style: none; }

/* ── CSS Custom Properties ── */
:root {
  --color-primary:   ${p.primary};
  --color-secondary: ${p.secondary};
  --color-accent:    ${p.accent};
  --color-dark:      ${p.dark};
  --color-mid:       ${p.mid};
  --color-neutral:   ${p.neutral};
  --color-bg:        ${p.background};
  --color-surface:   ${p.surface};
  --color-success:   ${p.success};
  --font-heading: '${f.heading}', system-ui, sans-serif;
  --font-body:    '${f.body}', system-ui, sans-serif;
  --radius:    ${ds.borderRadius};
  --radius-sm: ${ds.borderRadiusSm};
  --radius-lg: ${ds.borderRadiusLg};
  --radius-full: ${ds.borderRadiusFull};
  --shadow-md: 0 4px 16px rgba(0,0,0,0.08);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.12);
  --ease-out: cubic-bezier(0.25, 1, 0.5, 1);
  --container-max: 1280px;
}

/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* ── Skip link ── */
.skip-link {
  position: absolute; top: -40px; left: 0;
  background: var(--color-primary); color: #fff;
  padding: 8px 16px; z-index: 9999;
  font-family: var(--font-body);
}
.skip-link:focus { top: 0; }

/* ── Layout ── */
.container {
  width: 100%;
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 0 clamp(16px, 5vw, 48px);
}

/* ── Buttons ── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--font-body);
  font-weight: 600;
  border-radius: var(--radius);
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 200ms var(--ease-out), box-shadow 200ms var(--ease-out), background-color 200ms var(--ease-out);
  text-decoration: none;
  white-space: nowrap;
  min-height: 44px;
}
.btn:hover { transform: translateY(-2px); }
.btn:active { transform: translateY(0); }
.btn-primary {
  background: var(--color-primary);
  color: #fff;
  padding: 12px 28px;
}
.btn-primary:hover { box-shadow: 0 8px 20px color-mix(in srgb, var(--color-primary) 40%, transparent); }
.btn-ghost {
  background: transparent;
  color: var(--color-primary);
  border-color: var(--color-primary);
  padding: 12px 28px;
}
.btn-ghost-light {
  background: transparent;
  color: #fff;
  border-color: rgba(255,255,255,0.5);
  padding: 12px 28px;
}
.btn-cta {
  background: #fff;
  color: var(--color-primary);
  padding: 14px 36px;
  font-size: 1.05rem;
}
.btn-cta:hover { box-shadow: 0 8px 24px rgba(255,255,255,0.2); }
.btn-sm { padding: 8px 20px; font-size: 0.875rem; min-height: 36px; }
.btn-lg { padding: 16px 40px; font-size: 1.05rem; }

/* ── Section shared ── */
.section-header {
  text-align: center;
  margin-bottom: clamp(32px, 5vw, 56px);
}
.section-title {
  font-family: var(--font-heading);
  font-size: clamp(1.75rem, 3.5vw, 2.75rem);
  font-weight: 700;
  color: var(--color-dark);
  line-height: 1.15;
  margin-bottom: 12px;
}
.section-sub {
  font-size: clamp(1rem, 2vw, 1.125rem);
  color: var(--color-mid);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

/* ── Scroll reveal ── */
.reveal-item {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 600ms var(--ease-out), transform 600ms var(--ease-out);
  transition-delay: var(--stagger-delay, 0ms);
}
.reveal-item.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* ── Navigation ── */
.nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 1000;
  background: transparent;
  transition: background 300ms var(--ease-out), box-shadow 300ms var(--ease-out);
}
.nav.nav--solid {
  background: var(--color-bg);
  box-shadow: var(--shadow-md);
}
.nav-inner {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 16px clamp(16px, 5vw, 48px);
  max-width: var(--container-max);
  margin: 0 auto;
}
.nav-brand { flex-shrink: 0; }
.nav-logo-img { height: 40px; width: auto; }
.nav-logo-text {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 700;
  color: #fff;
  transition: color 300ms;
}
.nav.nav--solid .nav-logo-text { color: var(--color-dark); }
.nav-links {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-left: auto;
}
.nav-link {
  font-size: 0.9375rem;
  font-weight: 500;
  color: rgba(255,255,255,0.9);
  transition: color 200ms;
}
.nav.nav--solid .nav-link { color: var(--color-dark); }
.nav-link:hover { color: var(--color-primary); }
.nav-cta { margin-left: 8px; }
.nav-hamburger {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  margin-left: auto;
}
.nav-hamburger span {
  display: block;
  width: 24px; height: 2px;
  background: currentColor;
  border-radius: 2px;
  transition: transform 300ms var(--ease-out);
}

/* ── Hero ── */
.hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, var(--color-secondary) 0%, color-mix(in srgb, var(--color-primary) 30%, var(--color-secondary)) 100%);
  position: relative;
  overflow: hidden;
  padding: clamp(80px, 12vw, 160px) 0 clamp(60px, 8vw, 100px);
}
.hero--image { background-size: cover; background-position: center; }
.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.4) 100%);
}
.hero-content {
  position: relative;
  z-index: 1;
  max-width: 700px;
}
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.25);
  color: #fff;
  font-size: 0.8125rem;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: var(--radius-full);
  margin-bottom: 20px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.hero-heading {
  font-family: var(--font-heading);
  font-size: clamp(2.25rem, 5.5vw, 4.5rem);
  font-weight: 800;
  line-height: 1.1;
  color: #fff;
  margin-bottom: 20px;
  animation: heroSlideUp 700ms var(--ease-out) both;
  animation-delay: 100ms;
}
.hero-sub {
  font-size: clamp(1rem, 2vw, 1.25rem);
  color: rgba(255,255,255,0.85);
  line-height: 1.6;
  margin-bottom: 32px;
  max-width: 560px;
  animation: heroSlideUp 700ms var(--ease-out) both;
  animation-delay: 250ms;
}
.hero-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 20px;
  animation: heroSlideUp 700ms var(--ease-out) both;
  animation-delay: 400ms;
}
.hero-trust {
  font-size: 0.8125rem;
  color: rgba(255,255,255,0.6);
  margin-top: 12px;
}
@keyframes heroSlideUp {
  from { opacity: 0; transform: translateY(32px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Logo carousel ── */
.logos {
  padding: clamp(24px, 4vw, 40px) 0;
  border-top: 1px solid var(--color-neutral);
  border-bottom: 1px solid var(--color-neutral);
  overflow: hidden;
  background: var(--color-bg);
}
.logos-inner { overflow: hidden; }
.logos-track {
  display: flex;
  align-items: center;
  gap: clamp(40px, 6vw, 80px);
  width: max-content;
  animation: logoScroll 28s linear infinite;
}
.logo-item { flex-shrink: 0; }
.logo-item img {
  height: 36px;
  width: auto;
  object-fit: contain;
  filter: grayscale(100%) opacity(0.5);
  transition: filter 300ms;
}
.logo-item img:hover { filter: grayscale(0%) opacity(1); }
@keyframes logoScroll {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.logos:hover .logos-track { animation-play-state: paused; }

/* ── Stats banner ── */
.stats {
  background: var(--color-dark);
  padding: clamp(48px, 7vw, 80px) 0;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: clamp(24px, 4vw, 48px);
  text-align: center;
}
.stat-value {
  display: block;
  font-family: var(--font-heading);
  font-size: clamp(2rem, 4.5vw, 3.5rem);
  font-weight: 800;
  color: var(--color-primary);
  line-height: 1;
  margin-bottom: 8px;
}
.stat-label {
  display: block;
  font-size: 0.9375rem;
  color: rgba(255,255,255,0.7);
  font-weight: 500;
}

/* ── Features list ── */
.features {
  padding: clamp(64px, 9vw, 120px) 0;
  background: var(--color-bg);
}
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: clamp(24px, 3vw, 36px);
}
.feature-item {
  padding: clamp(24px, 3vw, 36px);
  background: color-mix(in srgb, var(--color-primary) 4%, transparent);
  border-radius: var(--radius);
  border: 1px solid color-mix(in srgb, var(--color-primary) 10%, transparent);
  transition: transform 250ms var(--ease-out), box-shadow 250ms var(--ease-out);
}
.feature-item:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }
.feature-icon {
  color: var(--color-primary);
  margin-bottom: 16px;
  display: flex;
}
.feature-title {
  font-family: var(--font-heading);
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-dark);
  margin-bottom: 8px;
  line-height: 1.3;
}
.feature-desc {
  font-size: 0.9375rem;
  color: var(--color-mid);
  line-height: 1.6;
}

/* ── Features bento ── */
.features--bento .bento-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: auto;
  gap: clamp(16px, 2vw, 24px);
}
.bento-item {
  padding: clamp(24px, 3vw, 36px);
  background: color-mix(in srgb, var(--color-primary) 4%, transparent);
  border-radius: var(--radius-lg);
  border: 1px solid color-mix(in srgb, var(--color-primary) 10%, transparent);
  transition: transform 250ms var(--ease-out), box-shadow 250ms var(--ease-out);
}
.bento-item--large {
  grid-column: 1 / -1;
  background: var(--color-primary);
  color: #fff;
}
.bento-item--large .bento-icon { color: rgba(255,255,255,0.8); }
.bento-item--large .bento-title { color: #fff; }
.bento-item--large .bento-desc { color: rgba(255,255,255,0.8); }
.bento-item:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }
.bento-icon { color: var(--color-primary); margin-bottom: 16px; display: flex; }
.bento-title {
  font-family: var(--font-heading);
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 8px;
  line-height: 1.3;
}
.bento-desc { font-size: 0.9375rem; color: var(--color-mid); line-height: 1.6; }

/* ── Process ── */
.process {
  padding: clamp(64px, 9vw, 120px) 0;
  background: var(--color-surface);
}
.process-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: clamp(32px, 4vw, 56px);
  position: relative;
}
.process-step {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}
.process-number {
  font-family: var(--font-heading);
  font-size: clamp(3rem, 6vw, 5rem);
  font-weight: 800;
  color: var(--color-primary);
  opacity: 0.15;
  line-height: 1;
  margin-bottom: -8px;
}
.process-title {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-dark);
  line-height: 1.3;
}
.process-desc { font-size: 0.9375rem; color: var(--color-mid); line-height: 1.6; }

/* ── Testimonials ── */
.testimonials {
  padding: clamp(64px, 9vw, 120px) 0;
  background: var(--color-bg);
}
.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: clamp(20px, 3vw, 32px);
}
.testimonial-card {
  padding: clamp(24px, 3vw, 36px);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-neutral);
  position: relative;
}
.testimonial-quote {
  font-family: Georgia, serif;
  font-size: 4rem;
  line-height: 0.5;
  color: var(--color-primary);
  opacity: 0.2;
  margin-bottom: 12px;
}
.testimonial-text {
  font-size: 0.9375rem;
  color: var(--color-dark);
  line-height: 1.7;
  margin-bottom: 20px;
  font-style: italic;
}
.testimonial-footer { display: flex; align-items: center; gap: 12px; }
.testimonial-avatar {
  width: 40px; height: 40px;
  background: var(--color-primary);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;
}
.testimonial-name {
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--color-dark);
  font-style: normal;
  display: block;
}
.testimonial-company { font-size: 0.8125rem; color: var(--color-mid); }

/* ── CTA section ── */
.cta-section {
  padding: clamp(64px, 9vw, 120px) 0;
  background: var(--color-primary);
}
.cta-inner { text-align: center; }
.cta-heading {
  font-family: var(--font-heading);
  font-size: clamp(1.75rem, 4vw, 3rem);
  font-weight: 800;
  color: #fff;
  line-height: 1.2;
  margin-bottom: 16px;
}
.cta-sub {
  font-size: clamp(1rem, 2vw, 1.125rem);
  color: rgba(255,255,255,0.85);
  max-width: 560px;
  margin: 0 auto 32px;
  line-height: 1.6;
}
.cta-actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
.cta-contacts {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 32px;
  justify-content: center;
  margin-top: 24px;
}
.cta-contact-link {
  font-size: 0.9375rem;
  color: rgba(255,255,255,0.75);
  transition: color 200ms;
}
.cta-contact-link:hover { color: #fff; }

/* ── Footer ── */
.footer {
  background: var(--color-dark);
  padding-top: clamp(40px, 6vw, 72px);
}
.footer-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: clamp(24px, 4vw, 48px);
  padding-bottom: clamp(32px, 4vw, 48px);
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.footer-brand { max-width: 280px; }
.footer-logo-img { height: 36px; width: auto; margin-bottom: 12px; }
.footer-logo-text {
  font-family: var(--font-heading);
  font-size: 1.125rem;
  font-weight: 700;
  color: #fff;
  display: block;
  margin-bottom: 12px;
}
.footer-tagline { font-size: 0.875rem; color: rgba(255,255,255,0.5); line-height: 1.5; }
.footer-links { display: flex; flex-direction: column; gap: 10px; }
.footer-link {
  font-size: 0.9rem;
  color: rgba(255,255,255,0.6);
  transition: color 200ms;
}
.footer-link:hover { color: var(--color-primary); }
.footer-contact {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: right;
}
.footer-contact-link {
  font-size: 0.875rem;
  color: rgba(255,255,255,0.6);
  transition: color 200ms;
}
.footer-contact-link:hover { color: var(--color-primary); }
.footer-bottom { padding: 20px 0; }
.footer-copy { font-size: 0.8125rem; color: rgba(255,255,255,0.35); text-align: center; }

/* ── Responsive ── */
@media (max-width: 768px) {
  .nav-links { display: none; flex-direction: column; gap: 16px; }
  .nav-links.nav-links--open {
    display: flex;
    position: fixed;
    inset: 0;
    background: var(--color-bg);
    justify-content: center;
    align-items: center;
    z-index: 999;
  }
  .nav-links.nav-links--open .nav-link { font-size: 1.25rem; color: var(--color-dark) !important; }
  .nav-hamburger { display: flex; }
  .nav-cta { display: none; }
  .hero-content { max-width: 100%; }
  .hero-actions { flex-direction: column; align-items: flex-start; }
  .features--bento .bento-grid { grid-template-columns: 1fr; }
  .bento-item--large { grid-column: 1; }
  .process-steps { grid-template-columns: 1fr; }
  .footer-grid { grid-template-columns: 1fr; text-align: left; }
  .footer-contact { text-align: left; }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .features-grid { grid-template-columns: repeat(2, 1fr); }
  .testimonials-grid { grid-template-columns: repeat(2, 1fr); }
  .footer-grid { grid-template-columns: 1fr 1fr; }
  .footer-contact { grid-column: 1 / -1; text-align: left; flex-direction: row; flex-wrap: wrap; gap: 16px; }
}`;
}

// ─── Global JS ────────────────────────────────────────────────────────────────
function buildGlobalJS() {
  return `// ── Scroll reveal via IntersectionObserver ──
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
);
document.querySelectorAll('.reveal-item').forEach(el => revealObserver.observe(el));

// ── Navbar transparency on scroll ──
const navbar = document.getElementById('navbar');
let lastScrollY = 0;
const handleScroll = () => {
  const currentScrollY = window.scrollY;
  if (currentScrollY > 60) {
    navbar.classList.add('nav--solid');
  } else {
    navbar.classList.remove('nav--solid');
  }
  lastScrollY = currentScrollY;
};
window.addEventListener('scroll', handleScroll, { passive: true });
handleScroll();

// ── Mobile hamburger menu ──
const hamburger = document.getElementById('nav-hamburger');
const navLinks = document.getElementById('nav-links');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('nav-links--open');
    hamburger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
  // Close menu on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('nav-links--open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
}`;
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function buildComponents(layoutPlan, analysis) {
  if (!layoutPlan || !analysis) {
    throw new Error('buildComponents: layoutPlan and analysis are required');
  }

  const ds = layoutPlan.design_system;
  const industry = layoutPlan.industry;
  const html = {};

  // Navigation
  html.nav = buildNav(layoutPlan, analysis);

  // Build each section from layout plan
  for (const section of layoutPlan.sections) {
    const { type, props } = section;
    switch (type) {
      case 'hero-fullbleed':
        html.hero = buildHero(props, ds);
        break;
      case 'logo-carousel':
        html.logos = buildLogoCarousel(props);
        break;
      case 'stats-banner':
        html.stats = buildStatsBanner(props, ds);
        break;
      case 'features-list':
        html.features = buildFeaturesList(props, ds, industry);
        break;
      case 'features-bento':
        html.features = buildFeaturesBento(props, ds, industry);
        break;
      case 'process-numbered':
        html.process = buildProcess(props);
        break;
      case 'testimonials-cards':
        html.testimonials = buildTestimonials(props);
        break;
      case 'cta-section':
        html.cta = buildCTA(props, ds);
        break;
      case 'footer-simple':
        html.footer = buildFooter(props, ds);
        break;
      default:
        console.warn(`  ⚠ Unknown section type: ${type}`);
    }
  }

  const css = buildGlobalCSS(ds, industry);
  const js = buildGlobalJS();

  console.log(`  🧱 Componentes construidos: ${Object.keys(html).join(', ')}`);

  return { html, css, js };
}
