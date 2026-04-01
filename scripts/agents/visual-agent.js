/**
 * Visual Agent — Gemini API Image Prompt Generator
 * Generates section-specific prompts based on design system + industry
 */

const INDUSTRY_VISUAL_PROFILES = {
  elevator_company: {
    mood: 'professional, trustworthy, technical, reliable',
    style: 'architectural photography, elevator installations in modern buildings, technical precision',
    color_direction: 'navy blue and steel grey with gold accents, corporate but modern',
    avoid: 'generic office photos, unrelated to vertical mobility, cheerful lifestyle shots',
  },
  agency: {
    mood: 'professional, creative, collaborative, energetic',
    style: 'modern photography with editorial quality, clean backgrounds, authentic people',
    color_direction: 'vibrant with purple and teal accents, warm artificial lighting',
    avoid: 'generic stock photos, cheesy handshakes, isolated white backgrounds',
  },
  saas: {
    mood: 'clean, efficient, modern, trustworthy',
    style: 'product screenshots and mockups, minimal UI illustrations, dark-mode friendly',
    color_direction: 'indigo and cyan accents on white/dark backgrounds, soft gradients',
    avoid: 'clipart, 3D cartoon characters, overcrowded UI screenshots',
  },
  fintech: {
    mood: 'secure, trustworthy, authoritative, modern',
    style: 'abstract geometric patterns, data visualizations, professional lifestyle',
    color_direction: 'deep blue and green palette, cool tones, subtle gold accents',
    avoid: 'cash/money imagery (cliché), piggy banks, old banking iconography',
  },
  ecommerce: {
    mood: 'aspirational, energetic, desire-inducing, lifestyle-focused',
    style: 'product in lifestyle context, natural light photography, real people using product',
    color_direction: 'warm and vibrant, product colors dominant, clean white space',
    avoid: 'isolated product on white, overly commercial, studio-only shots',
  },
  healthcare: {
    mood: 'caring, clean, reassuring, professional',
    style: 'real medical professionals, patients in positive contexts, clinical cleanliness',
    color_direction: 'whites and light blues, green for health, calming tones',
    avoid: 'scary medical imagery, syringes, overly clinical sterile environments',
  },
  industrial: {
    mood: 'professional, technical, reliable, authoritative',
    style: 'industrial photography, heavy equipment in operation, factory environments, technical precision',
    color_direction: 'navy blue and steel grey, corporate and trustworthy',
    avoid: 'generic office photos, lifestyle shots unrelated to industry, cartoon illustrations',
  },
  general: {
    mood: 'professional, approachable, modern',
    style: 'diverse people in professional settings, clean environments',
    color_direction: 'neutral with brand color accents',
    avoid: 'generic clipart, cheesy stock poses, overcrowded compositions',
  },
};

function buildPrompt(section, industry, designSystem) {
  const profile = INDUSTRY_VISUAL_PROFILES[industry] || INDUSTRY_VISUAL_PROFILES.general;
  const palette = designSystem?.palette || {};
  const primaryColor = palette.primary || '#3b82f6';
  const primaryLight = palette.primary_light || '#60a5fa';

  const sectionSpecs = {
    hero_image: {
      description: 'Main hero image above the fold',
      aspect_ratio: '16:9',
      composition: 'subject on right third, space on left for text overlay',
      content: industry === 'elevator_company' ? 'Modern elevator installation in luxury residential building lobby, stainless steel doors open, architectural photography, warm professional lighting, ultra realistic' :
               industry === 'agency' ? 'Diverse creative team collaborating around modern screens in a bright open-plan office, authentic candid moment' :
               industry === 'saas' ? 'Clean laptop/desktop showing modern dashboard UI with charts, placed on minimal desk, soft natural light from left' :
               industry === 'fintech' ? 'Abstract 3D flowing network of glowing nodes representing secure financial transactions, deep blue background' :
               'Professional person in modern environment, confident expression, natural lighting',
    },
    features_image: {
      description: 'Features section supporting image',
      aspect_ratio: '4:3',
      composition: 'centered with generous padding, icon-friendly negative space',
      content: industry === 'saas' ? 'Clean isometric illustration of interconnected workflow nodes, minimal flat design, indigo and cyan colors' :
               industry === 'agency' ? 'Modern workspace detail: dual monitors with design work, coffee, notebook, shallow depth of field' :
               'Abstract geometric pattern representing growth or connection, clean and minimal',
    },
    testimonial_bg: {
      description: 'Background for testimonials section',
      aspect_ratio: '16:9',
      composition: 'subtle texture or gradient, not distracting, text will overlay',
      content: `Soft abstract gradient from ${primaryColor} to ${primaryLight}, subtle geometric pattern, low opacity overlay ready, professional atmosphere`,
    },
    about_image: {
      description: 'About us / team section image',
      aspect_ratio: '4:3',
      composition: 'group photo or office environment, authentic not staged',
      content: industry === 'agency' ? 'Energetic startup team of 8-10 diverse professionals in casual-smart attire, modern office with plants, authentic smiles, warm natural light' :
               'Professional team portrait, diverse ages and backgrounds, modern office setting, natural lighting, genuine interactions',
    },
    cta_bg: {
      description: 'Call to action section background',
      aspect_ratio: '16:9',
      composition: 'gradient or texture, high contrast for text readability',
      content: `Bold gradient from ${primaryColor} to a darker shade, subtle geometric mesh pattern overlay, conveys momentum and action, ${profile.mood}`,
    },
    process_image: {
      description: 'How it works / process section',
      aspect_ratio: '4:3',
      composition: 'horizontal flow or step-by-step visual',
      content: 'Clean minimal infographic-style illustration showing 3 connected steps, flat design with subtle shadows, brand primary color accents',
    },
    social_proof_bg: {
      description: 'Background for client logos / social proof',
      aspect_ratio: '16:9',
      composition: 'very subtle, almost white, non-distracting',
      content: 'Ultra-minimal off-white texture with very subtle dot grid pattern, clean and professional, barely visible',
    },
  };

  const spec = sectionSpecs[section] || sectionSpecs.hero_image;

  return {
    section,
    prompt: `${spec.content}. Style: ${profile.style}. Mood: ${profile.mood}. Color direction: ${profile.color_direction}. Composition: ${spec.composition}. High quality, photorealistic where applicable. Avoid: ${profile.avoid}.`,
    aspect_ratio: spec.aspect_ratio,
    style_notes: `Industry: ${industry}. ${profile.mood}. Use ${primaryColor} as accent where appropriate.`,
    description: spec.description,
  };
}

// Accepts either full scrapingData or { assets, brand, business } slice
export function runVisualAgent(slice, uiData) {
  const industry = slice.industria_detectada || slice.business?.industry || 'general';
  const designSystem = uiData?.design_system || {};
  const realImages = slice.assets?.images || [];

  console.log(`  🖼️  [Visual Agent] Industria: ${industry} · Imágenes reales disponibles: ${realImages.length}`);

  const sections = ['hero_image', 'features_image', 'testimonial_bg', 'about_image', 'cta_bg', 'process_image', 'social_proof_bg'];

  const prompts = sections.map((section, idx) => {
    const base = buildPrompt(section, industry, designSystem);

    // Real client images have ABSOLUTE PRIORITY — use them directly when available
    const realImage = realImages[idx] || null;
    if (realImage) {
      return {
        ...base,
        real_image_url: realImage,
        use_real: true,
        note: 'Using real client image — skip AI generation for this section',
      };
    }

    // Fallback: Pollinations.ai (free, no API key needed)
    const encodedPrompt = encodeURIComponent(base.prompt);
    const [w, h] = base.aspect_ratio === '16:9' ? [1280, 720] : base.aspect_ratio === '4:3' ? [1024, 768] : [1024, 1024];
    return {
      ...base,
      pollinations_url: `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${w}&height=${h}&nologo=true`,
      use_real: false,
    };
  });

  return {
    industry,
    image_prompts: prompts,
    real_images_available: realImages.length,
    gemini_model: 'gemini-2.0-flash-exp',
    generation_config: {
      responseModalities: ['TEXT', 'IMAGE'],
      note: 'Real client images used first. Pollinations.ai as free fallback.',
    },
  };
}
