import 'dotenv/config';

// ─── Brand color inference — same logic as generator.js ──────────────────────
function isGrayish(hex) {
  if (!hex || hex.length < 7) return true;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;
  return saturation < 0.15;
}

function isVeryLight(hex) {
  if (!hex || hex.length < 7) return true;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r + g + b) / 3 > 230;
}

function isVeryDark(hex) {
  if (!hex || hex.length < 7) return true;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r + g + b) / 3 < 25;
}

export function inferBrandColors(assets) {
  if (!assets?.colors?.length) return null;

  const brandColors = assets.colors
    .filter(c => c && c.startsWith('#') && c.length === 7)
    .filter(c => !isGrayish(c) && !isVeryLight(c) && !isVeryDark(c));

  if (!brandColors.length) return null;

  return {
    primary: brandColors[0] || null,
    secondary: brandColors[1] || null,
    accent: brandColors[2] || null,
  };
}

// ─── Industry default design systems ─────────────────────────────────────────
const INDUSTRY_DESIGN_SYSTEMS = {
  industrial: {
    palette: {
      primary: '#E65100',
      secondary: '#0D1B2A',
      accent: '#FF8F00',
      neutral_light: '#F5F5F5',
      neutral_dark: '#0D1B2A',
      neutral_mid: '#546E7A',
      background: '#FFFFFF',
      surface: '#FAFAFA',
    },
    typography: { heading_font: 'Barlow Condensed', body_font: 'Inter' },
    visual_style: 'bold_technical',
    border_radius: { sm: '4px', md: '6px', lg: '10px', full: '9999px' },
  },
  elevator_company: {
    palette: {
      primary: '#8B6914',
      secondary: '#1A1A2E',
      accent: '#C9A84C',
      neutral_light: '#F8F6F1',
      neutral_dark: '#1A1A2E',
      neutral_mid: '#6B6B80',
      background: '#FFFFFF',
      surface: '#FAFAF7',
    },
    typography: { heading_font: 'Playfair Display', body_font: 'Source Sans 3' },
    visual_style: 'professional_refined',
    border_radius: { sm: '4px', md: '8px', lg: '16px', full: '9999px' },
  },
  saas: {
    palette: {
      primary: '#5D55D7',
      secondary: '#0891B2',
      accent: '#F59E0B',
      neutral_light: '#F4F4F5',
      neutral_dark: '#18181B',
      neutral_mid: '#52525B',
      background: '#FFFFFF',
      surface: '#FAFAFA',
    },
    typography: { heading_font: 'Sora', body_font: 'Inter' },
    visual_style: 'modern_minimal',
    border_radius: { sm: '6px', md: '12px', lg: '20px', full: '9999px' },
  },
  agency: {
    palette: {
      primary: '#7C3AED',
      secondary: '#0F172A',
      accent: '#F97316',
      neutral_light: '#F8FAFC',
      neutral_dark: '#0F172A',
      neutral_mid: '#64748B',
      background: '#FFFFFF',
      surface: '#F8FAFC',
    },
    typography: { heading_font: 'Plus Jakarta Sans', body_font: 'Inter' },
    visual_style: 'creative_bold',
    border_radius: { sm: '6px', md: '12px', lg: '24px', full: '9999px' },
  },
  fintech: {
    palette: {
      primary: '#1E3A5F',
      secondary: '#00875A',
      accent: '#E8F5E9',
      neutral_light: '#F4F7FB',
      neutral_dark: '#1A2332',
      neutral_mid: '#6B7A8D',
      background: '#FFFFFF',
      surface: '#F8FBFF',
    },
    typography: { heading_font: 'DM Sans', body_font: 'Inter' },
    visual_style: 'trustworthy_clean',
    border_radius: { sm: '4px', md: '8px', lg: '16px', full: '9999px' },
  },
  healthcare: {
    palette: {
      primary: '#0EA5E9',
      secondary: '#0F766E',
      accent: '#6EE7B7',
      neutral_light: '#F0F9FF',
      neutral_dark: '#1E3A5F',
      neutral_mid: '#6B8CAE',
      background: '#FFFFFF',
      surface: '#F0F9FF',
    },
    typography: { heading_font: 'Nunito', body_font: 'Inter' },
    visual_style: 'calm_professional',
    border_radius: { sm: '8px', md: '16px', lg: '24px', full: '9999px' },
  },
  general: {
    palette: {
      primary: '#3B82F6',
      secondary: '#1E293B',
      accent: '#F59E0B',
      neutral_light: '#F1F5F9',
      neutral_dark: '#1E293B',
      neutral_mid: '#64748B',
      background: '#FFFFFF',
      surface: '#F8FAFC',
    },
    typography: { heading_font: 'Plus Jakarta Sans', body_font: 'Inter' },
    visual_style: 'professional_approachable',
    border_radius: { sm: '6px', md: '12px', lg: '20px', full: '9999px' },
  },
};

// ─── Merge AI design system with brand colors ─────────────────────────────────
function buildDesignSystem(analysis) {
  const industry = analysis.meta?.industria || analysis.scraping?.business?.industry || 'general';
  const assets = analysis.scraping?.assets;
  const uiDs = analysis.ui_analysis?.design_system || {};

  // Start from industry defaults
  const base = INDUSTRY_DESIGN_SYSTEMS[industry] || INDUSTRY_DESIGN_SYSTEMS.general;
  const p = uiDs.palette || {};
  const t = uiDs.typography || {};
  const br = uiDs.border_radius || {};

  let primary   = p.primary    || base.palette.primary;
  let secondary = p.secondary  || base.palette.secondary;
  let accent    = p.accent     || base.palette.accent;

  // Override with real brand colors if detected (REGLA 2)
  const brandColors = inferBrandColors(assets);
  if (brandColors?.primary)   primary   = brandColors.primary;
  if (brandColors?.secondary) secondary = brandColors.secondary;
  if (brandColors?.accent)    accent    = brandColors.accent || accent;

  // Override fonts with detected real fonts (REGLA 3)
  let headingFont = t.heading_font || base.typography.heading_font;
  let bodyFont    = t.body_font    || base.typography.body_font;
  if (assets?.fonts?.length > 0) {
    headingFont = assets.fonts[0] || headingFont;
    bodyFont    = assets.fonts[1] || assets.fonts[0] || bodyFont;
  }

  return {
    colors: {
      primary,
      secondary,
      accent,
      neutral:    p.neutral_light || base.palette.neutral_light,
      dark:       p.neutral_dark  || base.palette.neutral_dark,
      mid:        p.neutral_mid   || base.palette.neutral_mid,
      background: p.background   || base.palette.background,
      surface:    p.surface      || base.palette.surface,
      success:    p.success      || '#22c55e',
    },
    fonts: {
      heading: headingFont,
      body:    bodyFont,
    },
    borderRadius:     br.md   || base.border_radius.md,
    borderRadiusSm:   br.sm   || base.border_radius.sm,
    borderRadiusLg:   br.lg   || base.border_radius.lg,
    borderRadiusFull: br.full || base.border_radius.full,
    shadows:     uiDs.shadows || { md: '0 4px 16px rgba(0,0,0,0.08)', lg: '0 8px 32px rgba(0,0,0,0.12)' },
    spacingBase: uiDs.spacing_base || 8,
    visual_style: uiDs.visual_style || base.visual_style,
  };
}

// ─── Build sections list based on available data ──────────────────────────────
function buildSections(analysis, designSystem) {
  const business  = analysis.scraping?.business || {};
  const assets    = analysis.scraping?.assets   || {};
  const seoData   = analysis.seo_copy_analysis  || {};
  const uxData    = analysis.ux_analysis        || {};
  const testimonials = analysis.testimonials    || business.testimonials || [];
  const faq          = analysis.faq             || [];
  const rewritten    = seoData.rewritten_copy   || {};

  const companyName = business.company_name || analysis.scraping?.brand?.name || 'Empresa';
  const h1 = rewritten.h1 || analysis.scraping?.metadata?.title || companyName;
  const subheadline = rewritten.subheadline || rewritten.h2s?.[0] || seoData.current_copy?.h1 || '';
  const ctaPrimary = rewritten.cta_primary || 'Contáctanos';
  const ctaSecondary = rewritten.cta_secondary || 'Ver servicios';
  const features = business.key_services || [];
  const impactNumbers = business.impact_numbers || [];
  const clientLogos = assets.client_logos || [];
  const navItems = business.nav_items || [];
  const contactEmail = business.contact_email || '';
  const contactPhone = business.contact_phone || '';
  const metaDescription = seoData.rewritten_meta?.description || analysis.scraping?.metadata?.description || '';

  const sections = [];

  // 1. Hero — always included
  sections.push({
    type: 'hero-fullbleed',
    props: {
      headline: h1,
      subheadline,
      cta_primary: ctaPrimary,
      cta_secondary: ctaSecondary,
      hero_image: assets.section_images?.hero || null,
      logo_url: assets.logo_url || null,
      trust_micro: rewritten.trust_micro || '',
      badge_text: rewritten.badge || '',
    },
  });

  // 2. Logo carousel — ONLY if real logos detected
  if (clientLogos.length >= 1) {
    sections.push({
      type: 'logo-carousel',
      props: {
        logos: clientLogos,
        label: 'Empresas que confían en nosotros',
      },
    });
  }

  // 3. Stats banner — ONLY if real impact numbers detected and > 0
  const validStats = impactNumbers.filter(n => {
    const numeric = parseInt(String(n.value).replace(/[+K%]/g, ''));
    return !isNaN(numeric) && numeric > 0;
  });
  if (validStats.length > 0) {
    sections.push({
      type: 'stats-banner',
      props: {
        stats: validStats,
        background: 'dark',
      },
    });
  }

  // 4. Features — bento for ≤4, list for 5-8
  if (features.length > 0) {
    const featureType = features.length <= 4 ? 'features-bento' : 'features-list';
    sections.push({
      type: featureType,
      props: {
        features: features.slice(0, 8),
        count: features.length,
        headline: rewritten.features_headline || 'Nuestros servicios',
        subheadline: rewritten.features_subheadline || '',
      },
    });
  }

  // 5. Process — include if UX analysis suggests it or enough detail is available
  const processSteps = rewritten.process_steps || uxData.suggested_process_steps || null;
  if (processSteps && processSteps.length >= 3) {
    sections.push({
      type: 'process-numbered',
      props: {
        steps: processSteps.slice(0, 3),
        headline: rewritten.process_headline || 'Cómo trabajamos',
      },
    });
  } else if (features.length > 0) {
    // Default process steps based on industry
    sections.push({
      type: 'process-numbered',
      props: {
        steps: [
          { number: '01', title: 'Consulta inicial', description: 'Analizamos tus necesidades y diseñamos la solución ideal para tu proyecto.' },
          { number: '02', title: 'Propuesta a medida', description: 'Preparamos una propuesta técnica y económica detallada sin costo ni compromiso.' },
          { number: '03', title: 'Implementación y soporte', description: 'Ejecutamos el proyecto con total acompañamiento y garantía de resultados.' },
        ],
        headline: 'Cómo trabajamos',
      },
    });
  }

  // 6. Testimonials — ONLY if real testimonials are scraped
  if (testimonials.length > 0) {
    sections.push({
      type: 'testimonials-cards',
      props: {
        testimonials: testimonials.slice(0, 6),
        headline: 'Lo que dicen nuestros clientes',
      },
    });
  }

  // 7. CTA section — always included
  sections.push({
    type: 'cta-section',
    props: {
      headline: rewritten.cta_headline || `¿Listo para trabajar con ${companyName}?`,
      subtext: rewritten.cta_subtext || metaDescription || 'Contáctanos hoy y recibe una propuesta personalizada para tu proyecto.',
      cta_primary: ctaPrimary,
      cta_secondary: ctaSecondary,
      contact_email: contactEmail,
      contact_phone: contactPhone,
    },
  });

  // 8. Footer — always included
  sections.push({
    type: 'footer-simple',
    props: {
      company_name: companyName,
      logo_url: assets.logo_url || null,
      links: navItems,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      tagline: subheadline || metaDescription || '',
    },
  });

  return sections;
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function planLayout(analysis) {
  if (!analysis) throw new Error('planLayout: analysis is required');

  const industry = analysis.meta?.industria
    || analysis.scraping?.business?.industry
    || 'general';

  const personality = analysis.scraping?.brand?.personality || 'professional_technical';

  const industryPersonalities = {
    industrial:       'professional_technical',
    elevator_company: 'professional_refined',
    saas:             'modern_direct',
    agency:           'creative_bold',
    fintech:          'trustworthy_clean',
    healthcare:       'calm_professional',
    general:          'professional_approachable',
  };

  const industryAesthetics = {
    industrial:       'bold_technical',
    elevator_company: 'professional_refined',
    saas:             'modern_minimal',
    agency:           'creative_bold',
    fintech:          'trustworthy_clean',
    healthcare:       'calm_professional',
    general:          'professional_approachable',
  };

  const designSystem = buildDesignSystem(analysis);
  const sections = buildSections(analysis, designSystem);

  const layoutPlan = {
    sections,
    design_system: designSystem,
    industry,
    personality: industryPersonalities[industry] || personality,
    aesthetic: industryAesthetics[industry] || 'professional_approachable',
    company_name: analysis.scraping?.business?.company_name
      || analysis.scraping?.brand?.name
      || 'Empresa',
    meta: {
      title: analysis.seo_copy_analysis?.rewritten_meta?.title
        || analysis.scraping?.metadata?.title
        || '',
      description: analysis.seo_copy_analysis?.rewritten_meta?.description
        || analysis.scraping?.metadata?.description
        || '',
    },
    adjustment_feedback: analysis.adjustment_feedback || null,
  };

  console.log(`  📐 Layout plan generado:`);
  console.log(`     Industria: ${industry} | Aesthetic: ${layoutPlan.aesthetic}`);
  console.log(`     Secciones: ${sections.map(s => s.type).join(' → ')}`);
  console.log(`     Primary color: ${designSystem.colors.primary}`);
  console.log(`     Heading font: ${designSystem.fonts.heading}`);

  return layoutPlan;
}
