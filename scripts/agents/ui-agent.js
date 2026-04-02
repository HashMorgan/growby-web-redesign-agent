/**
 * ui-agent.js — UI/UX Design System Generator
 * v3.5.0 — Basado en principios de skills/ui-ux-pro-max/
 *
 * Extrae de ui-ux-pro-max SKILL.md:
 * - 50+ visual styles
 * - 161 color palettes
 * - 57 font pairings (Google Fonts modernas)
 * - UX guidelines (accessibility, touch targets, performance)
 * - Spacing systems (4/8px base)
 */

// ══════════════════════════════════════════════════════════════
// DESIGN SYSTEMS POR INDUSTRIA
// Paletas profesionales + tipografías modernas + spacing + effects
// ══════════════════════════════════════════════════════════════

const DESIGN_SYSTEMS = {
  // ── Legal (abogados, estudios jurídicos) ──
  legal: {
    visual_style: 'minimal-professional',
    palette: {
      primary: '#1E3A8A',      // Azul marino (confianza, autoridad)
      secondary: '#0EA5E9',     // Azul claro (accesibilidad)
      accent: '#FBBF24',        // Dorado (prestigio)
      neutral_dark: '#1F2937',
      neutral_mid: '#6B7280',
      neutral_light: '#F3F4F6',
      background: '#FFFFFF',
      surface: '#F9FAFB',
    },
    typography: {
      heading_font: 'Playfair Display',  // Serif elegante
      body_font: 'Inter',
      heading_weights: [600, 700],
      body_weight: 400,
      scale: { h1: '3rem', h2: '2.25rem', h3: '1.5rem', body: '1rem', small: '0.875rem' },
    },
    spacing_base: 8,
    border_radius: { sm: '4px', md: '8px', lg: '12px', xl: '16px', full: '9999px' },
    shadows: {
      sm: '0 1px 3px rgba(0,0,0,0.08)',
      md: '0 4px 12px rgba(0,0,0,0.1)',
      lg: '0 12px 32px rgba(0,0,0,0.15)',
    },
  },

  // ── Construcción e Ingeniería ──
  construcción: {
    visual_style: 'bold-technical',
    palette: {
      primary: '#F97316',       // Naranja (energía, construcción)
      secondary: '#0EA5E9',     // Azul (confiabilidad)
      accent: '#84CC16',        // Verde lima (innovación)
      neutral_dark: '#0F172A',
      neutral_mid: '#64748B',
      neutral_light: '#F1F5F9',
      background: '#FFFFFF',
      surface: '#F8FAFC',
    },
    typography: {
      heading_font: 'Outfit',   // Sans moderna, técnica
      body_font: 'Inter',
      heading_weights: [700, 800],
      body_weight: 400,
      scale: { h1: '3.5rem', h2: '2.5rem', h3: '1.75rem', body: '1.0625rem', small: '0.875rem' },
    },
    spacing_base: 8,
    border_radius: { sm: '6px', md: '10px', lg: '16px', xl: '24px', full: '9999px' },
    shadows: {
      sm: '0 2px 4px rgba(0,0,0,0.1)',
      md: '0 6px 16px rgba(0,0,0,0.12)',
      lg: '0 16px 48px rgba(0,0,0,0.18)',
    },
  },

  // ── Tecnología / SaaS ──
  tecnología: {
    visual_style: 'modern-gradient',
    palette: {
      primary: '#6366F1',       // Indigo (innovación)
      secondary: '#EC4899',     // Pink (creatividad)
      accent: '#8B5CF6',        // Purple (tech)
      neutral_dark: '#0F172A',
      neutral_mid: '#475569',
      neutral_light: '#F1F5F9',
      background: '#FFFFFF',
      surface: '#FAFAFA',
    },
    typography: {
      heading_font: 'Plus Jakarta Sans',  // Moderna, tech-forward
      body_font: 'Inter',
      heading_weights: [700, 800],
      body_weight: 400,
      scale: { h1: '3.75rem', h2: '2.5rem', h3: '1.75rem', body: '1.0625rem', small: '0.875rem' },
    },
    spacing_base: 8,
    border_radius: { sm: '8px', md: '12px', lg: '20px', xl: '32px', full: '9999px' },
    shadows: {
      sm: '0 1px 3px rgba(99,102,241,0.12)',
      md: '0 8px 20px rgba(99,102,241,0.15)',
      lg: '0 20px 48px rgba(99,102,241,0.2)',
    },
  },

  // ── Salud / Clínicas ──
  salud: {
    visual_style: 'clean-accessible',
    palette: {
      primary: '#059669',       // Verde (salud, bienestar)
      secondary: '#3B82F6',     // Azul (confianza médica)
      accent: '#F59E0B',        // Ámbar (calidez)
      neutral_dark: '#1F2937',
      neutral_mid: '#6B7280',
      neutral_light: '#F3F4F6',
      background: '#FFFFFF',
      surface: '#F9FAFB',
    },
    typography: {
      heading_font: 'Sora',     // Legible, cálida
      body_font: 'Inter',
      heading_weights: [600, 700],
      body_weight: 400,
      scale: { h1: '3rem', h2: '2.25rem', h3: '1.5rem', body: '1.0625rem', small: '0.875rem' },
    },
    spacing_base: 8,
    border_radius: { sm: '6px', md: '12px', lg: '16px', xl: '24px', full: '9999px' },
    shadows: {
      sm: '0 1px 3px rgba(0,0,0,0.06)',
      md: '0 4px 12px rgba(0,0,0,0.08)',
      lg: '0 12px 32px rgba(0,0,0,0.12)',
    },
  },

  // ── Educación ──
  educación: {
    visual_style: 'friendly-approachable',
    palette: {
      primary: '#7C3AED',       // Violeta (creatividad, educación)
      secondary: '#F59E0B',     // Ámbar (energía)
      accent: '#EF4444',        // Rojo (atención)
      neutral_dark: '#1F2937',
      neutral_mid: '#6B7280',
      neutral_light: '#F3F4F6',
      background: '#FFFFFF',
      surface: '#F9FAFB',
    },
    typography: {
      heading_font: 'Bricolage Grotesque',  // Amigable, única
      body_font: 'Inter',
      heading_weights: [600, 700],
      body_weight: 400,
      scale: { h1: '3.25rem', h2: '2.25rem', h3: '1.625rem', body: '1.0625rem', small: '0.875rem' },
    },
    spacing_base: 8,
    border_radius: { sm: '8px', md: '14px', lg: '20px', xl: '28px', full: '9999px' },
    shadows: {
      sm: '0 2px 4px rgba(124,58,237,0.1)',
      md: '0 8px 16px rgba(124,58,237,0.12)',
      lg: '0 16px 40px rgba(124,58,237,0.15)',
    },
  },

  // ── Consultoría / Servicios Profesionales ──
  consultoría: {
    visual_style: 'sophisticated-minimal',
    palette: {
      primary: '#1F2937',       // Gris oscuro (seriedad)
      secondary: '#3B82F6',     // Azul (profesionalismo)
      accent: '#10B981',        // Verde (crecimiento)
      neutral_dark: '#111827',
      neutral_mid: '#6B7280',
      neutral_light: '#F3F4F6',
      background: '#FFFFFF',
      surface: '#F9FAFB',
    },
    typography: {
      heading_font: 'Sora',
      body_font: 'Inter',
      heading_weights: [600, 700],
      body_weight: 400,
      scale: { h1: '3rem', h2: '2.25rem', h3: '1.5rem', body: '1rem', small: '0.875rem' },
    },
    spacing_base: 8,
    border_radius: { sm: '4px', md: '8px', lg: '12px', xl: '16px', full: '9999px' },
    shadows: {
      sm: '0 1px 3px rgba(0,0,0,0.08)',
      md: '0 4px 12px rgba(0,0,0,0.1)',
      lg: '0 12px 32px rgba(0,0,0,0.12)',
    },
  },

  // ── Financiero / Fintech ──
  financiero: {
    visual_style: 'corporate-trust',
    palette: {
      primary: '#0F172A',       // Navy oscuro (confianza financiera)
      secondary: '#0EA5E9',     // Azul cielo (accesibilidad)
      accent: '#F59E0B',        // Ámbar (atención, premiums)
      neutral_dark: '#1E293B',
      neutral_mid: '#64748B',
      neutral_light: '#F1F5F9',
      background: '#FFFFFF',
      surface: '#F8FAFC',
    },
    typography: {
      heading_font: 'Inter',    // Clean, confiable
      body_font: 'Inter',
      heading_weights: [600, 700],
      body_weight: 400,
      scale: { h1: '3rem', h2: '2rem', h3: '1.5rem', body: '1rem', small: '0.875rem' },
    },
    spacing_base: 8,
    border_radius: { sm: '4px', md: '8px', lg: '12px', xl: '16px', full: '9999px' },
    shadows: {
      sm: '0 1px 2px rgba(0,0,0,0.05)',
      md: '0 4px 8px rgba(0,0,0,0.08)',
      lg: '0 12px 24px rgba(0,0,0,0.12)',
    },
  },

  // ── Retail / Ecommerce ──
  retail: {
    visual_style: 'bold-conversion',
    palette: {
      primary: '#DC2626',       // Rojo (urgencia, acción)
      secondary: '#FBBF24',     // Amarillo (ofertas)
      accent: '#8B5CF6',        // Violeta (premium)
      neutral_dark: '#1C1917',
      neutral_mid: '#57534E',
      neutral_light: '#F5F5F4',
      background: '#FFFFFF',
      surface: '#FAFAF9',
    },
    typography: {
      heading_font: 'Plus Jakarta Sans',
      body_font: 'Inter',
      heading_weights: [700, 800],
      body_weight: 400,
      scale: { h1: '3.5rem', h2: '2.25rem', h3: '1.625rem', body: '1rem', small: '0.875rem' },
    },
    spacing_base: 8,
    border_radius: { sm: '6px', md: '10px', lg: '16px', xl: '24px', full: '9999px' },
    shadows: {
      sm: '0 2px 4px rgba(0,0,0,0.1)',
      md: '0 6px 12px rgba(0,0,0,0.12)',
      lg: '0 16px 32px rgba(0,0,0,0.15)',
    },
  },

  // ── Servicios Generales (fallback) ──
  'servicios profesionales': {
    visual_style: 'modern-clean',
    palette: {
      primary: '#5D55D7',       // GrowBy purple (default)
      secondary: '#FFCC00',     // GrowBy yellow
      accent: '#10B981',        // Verde (crecimiento)
      neutral_dark: '#1F2937',
      neutral_mid: '#6B7280',
      neutral_light: '#F3F4F6',
      background: '#FFFFFF',
      surface: '#F9FAFB',
    },
    typography: {
      heading_font: 'Sora',
      body_font: 'Inter',
      heading_weights: [600, 700],
      body_weight: 400,
      scale: { h1: '3rem', h2: '2.25rem', h3: '1.5rem', body: '1rem', small: '0.875rem' },
    },
    spacing_base: 8,
    border_radius: { sm: '6px', md: '12px', lg: '16px', xl: '24px', full: '9999px' },
    shadows: {
      sm: '0 1px 3px rgba(0,0,0,0.08)',
      md: '0 4px 12px rgba(0,0,0,0.1)',
      lg: '0 12px 32px rgba(0,0,0,0.12)',
    },
  },
};

// ══════════════════════════════════════════════════════════════
// HELPER: Inferir colores de marca reales del scraping
// ══════════════════════════════════════════════════════════════

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

/**
 * Inferir colores de marca REALES del scraping
 * Prioriza colores scrapeados sobre defaults del design system
 */
function inferBrandColors(scrapeData, baseDesignSystem) {
  const scrapedColors = scrapeData.brand?.colors?.all || [];

  const brandColors = scrapedColors
    .filter(c => c && c.startsWith('#') && c.length === 7)
    .filter(c => !isGrayish(c) && !isVeryLight(c) && !isVeryDark(c));

  if (brandColors.length === 0) {
    // No hay colores reales → usar design system por industria
    return baseDesignSystem.palette;
  }

  // Hay colores reales → combinar con design system
  return {
    ...baseDesignSystem.palette,
    primary: brandColors[0] || baseDesignSystem.palette.primary,
    secondary: brandColors[1] || baseDesignSystem.palette.secondary,
    accent: brandColors[2] || baseDesignSystem.palette.accent,
  };
}

// ══════════════════════════════════════════════════════════════
// MAIN EXPORT: runUIAgent
// ══════════════════════════════════════════════════════════════

/**
 * UI Agent — Genera design system completo basado en industria
 * @param {object} scrapeData - Datos del scraping (brand, business, colors)
 * @returns {object} Design system completo (palette, typography, spacing, shadows, etc.)
 */
export function runUIAgent(scrapeData) {
  const industry = scrapeData.business?.industry || 'servicios profesionales';

  // Seleccionar design system base por industria
  const baseDesignSystem = DESIGN_SYSTEMS[industry] || DESIGN_SYSTEMS['servicios profesionales'];

  // Combinar con colores REALES del scraping
  const finalPalette = inferBrandColors(scrapeData, baseDesignSystem);

  console.log(`\n🎨 UI Agent — Design System:`);
  console.log(`   Industry: ${industry}`);
  console.log(`   Visual Style: ${baseDesignSystem.visual_style}`);
  console.log(`   Primary Color: ${finalPalette.primary} ${scrapeData.brand?.colors?.primary ? '(real)' : '(default)'}`);
  console.log(`   Fonts: ${baseDesignSystem.typography.heading_font} / ${baseDesignSystem.typography.body_font}`);

  return {
    industry,
    visual_style: baseDesignSystem.visual_style,
    palette: finalPalette,
    typography: baseDesignSystem.typography,
    spacing_base: baseDesignSystem.spacing_base,
    border_radius: baseDesignSystem.border_radius,
    shadows: baseDesignSystem.shadows,
  };
}
