/**
 * animate-agent.js — Animation Strategy Agent
 * v3.5.0 — Basado en principios de skills/animate/
 *
 * Extrae de animate SKILL.md:
 * - 4 capas de animación (Hero, Feedback, Transitions, Delight)
 * - Timings por propósito (100-150ms micro, 200-300ms state, 300-500ms layout, 500-800ms entrance)
 * - Easing curves recomendadas (ease-out-quart, ease-out-quint, ease-out-expo)
 * - NUNCA usar bounce/elastic (se ven dated)
 * - SIEMPRE respetar prefers-reduced-motion
 * - Animar solo transform + opacity (GPU-accelerated)
 */

// ══════════════════════════════════════════════════════════════
// ANIMATION STRATEGY — 4 CAPAS
// ══════════════════════════════════════════════════════════════

/**
 * Capa 1: HERO MOMENT
 * UNA animación principal al cargar la página
 */
const HERO_ANIMATIONS = {
  'fade-slide-up': {
    type: 'fade + slide',
    duration: 600,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)', // ease-out-quint (del skill)
    description: 'H1 + subheadline fade in con slide up suave',
    css: `
      @keyframes fadeSlideUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .hero-animate {
        animation: fadeSlideUp 600ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
      }
    `,
  },
  'scale-fade': {
    type: 'scale + fade',
    duration: 500,
    easing: 'cubic-bezier(0.25, 1, 0.5, 1)', // ease-out-quart
    description: 'Hero visual scale up con fade in',
    css: `
      @keyframes scaleFade {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      .hero-visual {
        animation: scaleFade 500ms cubic-bezier(0.25, 1, 0.5, 1) forwards;
      }
    `,
  },
};

/**
 * Capa 2: FEEDBACK LAYER
 * Hover/click effects en elementos interactivos
 */
const FEEDBACK_ANIMATIONS = {
  button_hover: {
    scale: 1.02, // Sutil, no 1.1 (demasiado agresivo)
    duration: 200, // 200-300ms para state changes
    easing: 'ease-out',
    css: `
      .btn-hover {
        transition: transform 200ms ease-out, box-shadow 200ms ease-out;
      }
      .btn-hover:hover {
        transform: scale(1.02);
        box-shadow: 0 12px 28px rgba(0,0,0,0.15);
      }
    `,
  },
  button_click: {
    scale_down: 0.95,
    duration: 150, // 100-150ms para instant feedback
    easing: 'ease-out',
    css: `
      .btn-hover:active {
        transform: scale(0.95);
      }
    `,
  },
  card_hover: {
    translateY: -8,
    duration: 300,
    easing: 'ease-out',
    css: `
      .card-hover {
        transition: transform 300ms ease-out, box-shadow 300ms ease-out;
      }
      .card-hover:hover {
        transform: translateY(-8px);
        box-shadow: 0 20px 40px rgba(0,0,0,0.12);
      }
    `,
  },
};

/**
 * Capa 3: TRANSITION LAYER
 * Scroll-triggered reveals y transiciones de estado
 */
const TRANSITION_ANIMATIONS = {
  scroll_reveal: {
    trigger: 'IntersectionObserver',
    stagger: 50, // 50ms entre elementos (del skill)
    duration: 300, // 300-500ms para layout changes
    easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    css: `
      .scroll-reveal {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 300ms cubic-bezier(0.25, 1, 0.5, 1),
                    transform 300ms cubic-bezier(0.25, 1, 0.5, 1);
      }
      .scroll-reveal.visible {
        opacity: 1;
        transform: translateY(0);
      }
    `,
    js: `
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      }, { threshold: 0.1 });

      document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));
    `,
  },
  fade_in: {
    duration: 400,
    easing: 'ease-out',
    css: `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .fade-in {
        opacity: 0;
        animation: fadeIn 400ms ease-out forwards;
      }
    `,
  },
};

/**
 * Capa 4: DELIGHT LAYER
 * UN micro-interaction sorpresa (no abusar)
 */
const DELIGHT_ANIMATIONS = {
  counter_animation: {
    type: 'number count-up',
    duration: 1500,
    trigger: 'in-viewport',
    description: 'Stats counters que suben desde 0',
    js: `
      document.querySelectorAll('[data-counter]').forEach(counter => {
        const target = parseInt(counter.getAttribute('data-counter'));
        let current = 0;
        const increment = target / 60; // 60 frames
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            counter.textContent = target + (target < 100 ? '%' : '+');
            clearInterval(timer);
          } else {
            counter.textContent = Math.floor(current) + (target < 100 ? '%' : '+');
          }
        }, 25);
      });
    `,
  },
  float_animation: {
    type: 'subtle floating',
    duration: 3000,
    easing: 'ease-in-out',
    description: 'Elementos que flotan suavemente (hero visual)',
    css: `
      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      .float {
        animation: float 3s ease-in-out infinite;
      }
    `,
  },
};

// ══════════════════════════════════════════════════════════════
// ACCESSIBILITY — prefers-reduced-motion
// ══════════════════════════════════════════════════════════════

const REDUCED_MOTION_CSS = `
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

// ══════════════════════════════════════════════════════════════
// TIMING GUIDELINES (del skill)
// ══════════════════════════════════════════════════════════════

const TIMING_GUIDE = {
  micro_feedback: { min: 100, max: 150, use_for: 'button press, toggle' },
  state_change: { min: 200, max: 300, use_for: 'hover, menu open' },
  layout_change: { min: 300, max: 500, use_for: 'accordion, modal' },
  entrance: { min: 500, max: 800, use_for: 'page load' },
};

// ══════════════════════════════════════════════════════════════
// EASING CURVES (del skill — NUNCA bounce/elastic)
// ══════════════════════════════════════════════════════════════

const EASING_CURVES = {
  'ease-out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',      // Smooth, refined
  'ease-out-quint': 'cubic-bezier(0.22, 1, 0.36, 1)',     // Slightly snappier
  'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',       // Confident, decisive
  // AVOID:
  // 'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',       // ❌ Feels dated
  // 'elastic': 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',    // ❌ Tacky
};

// ══════════════════════════════════════════════════════════════
// ANTI-PATTERNS (del skill)
// ══════════════════════════════════════════════════════════════

const ANIMATION_ANTI_PATTERNS = [
  '❌ NUNCA animar width/height — usar transform en su lugar',
  '❌ NUNCA usar bounce/elastic easing — se ven dated',
  '❌ NUNCA duración > 500ms para feedback — se siente lento',
  '❌ NUNCA ignorar prefers-reduced-motion — violación de accesibilidad',
  '❌ NUNCA animar todo — fatiga visual',
  '❌ NUNCA bloquear interacción durante animaciones',
];

// ══════════════════════════════════════════════════════════════
// MAIN EXPORT: runAnimateAgent
// ══════════════════════════════════════════════════════════════

/**
 * Animate Agent — Define estrategia de animaciones en 4 capas
 * @returns {object} Animation strategy completa (CSS + JS + timings)
 */
export function runAnimateAgent() {
  console.log(`\n🎬 Animate Agent — Animation Strategy:`);
  console.log(`   Hero: fade-slide-up (600ms)`);
  console.log(`   Feedback: hover scale 1.02 (200ms)`);
  console.log(`   Transitions: scroll-reveal + stagger 50ms`);
  console.log(`   Delight: counter animation (números)`);

  return {
    // Capa 1: Hero Moment
    hero: {
      type: 'fade-slide-up',
      animation: HERO_ANIMATIONS['fade-slide-up'],
      css: HERO_ANIMATIONS['fade-slide-up'].css,
    },

    // Capa 2: Feedback Layer
    feedback: {
      button_hover: FEEDBACK_ANIMATIONS.button_hover,
      button_click: FEEDBACK_ANIMATIONS.button_click,
      card_hover: FEEDBACK_ANIMATIONS.card_hover,
    },

    // Capa 3: Transition Layer
    transitions: {
      scroll_reveal: TRANSITION_ANIMATIONS.scroll_reveal,
      fade_in: TRANSITION_ANIMATIONS.fade_in,
    },

    // Capa 4: Delight Layer
    delight: {
      counter_animation: DELIGHT_ANIMATIONS.counter_animation,
      float_animation: DELIGHT_ANIMATIONS.float_animation,
    },

    // Accessibility
    reduced_motion_css: REDUCED_MOTION_CSS,

    // Timing guidelines
    timing_guide: TIMING_GUIDE,

    // Easing curves recomendadas
    easing_curves: EASING_CURVES,

    // Anti-patterns a evitar
    anti_patterns: ANIMATION_ANTI_PATTERNS,

    // Full CSS bundle
    css_bundle: generateCSSBundle(),

    // Full JS bundle
    js_bundle: generateJSBundle(),
  };
}

/**
 * Genera CSS completo con todas las animaciones
 */
function generateCSSBundle() {
  return `
    /* ══════════════════════════════════════════════════ */
    /* ANIMATIONS — Generated by Animate Agent v3.5.0    */
    /* Based on skills/animate/ principles               */
    /* ══════════════════════════════════════════════════ */

    ${HERO_ANIMATIONS['fade-slide-up'].css}

    ${FEEDBACK_ANIMATIONS.button_hover.css}
    ${FEEDBACK_ANIMATIONS.button_click.css}
    ${FEEDBACK_ANIMATIONS.card_hover.css}

    ${TRANSITION_ANIMATIONS.scroll_reveal.css}
    ${TRANSITION_ANIMATIONS.fade_in.css}

    ${DELIGHT_ANIMATIONS.float_animation.css}

    ${REDUCED_MOTION_CSS}
  `;
}

/**
 * Genera JavaScript completo con intersection observer + counter
 */
function generateJSBundle() {
  return `
    /* ══════════════════════════════════════════════════ */
    /* ANIMATION SCRIPTS — Generated by Animate Agent    */
    /* ══════════════════════════════════════════════════ */

    ${TRANSITION_ANIMATIONS.scroll_reveal.js}

    ${DELIGHT_ANIMATIONS.counter_animation.js}
  `;
}
