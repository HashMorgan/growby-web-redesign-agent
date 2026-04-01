import React, { useEffect, useRef, useState } from 'react';

const FEATURES_STYLE = `
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes featureFadeIn {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .feature-animate { animation: none !important; opacity: 1 !important; }
}
.shimmer-bg {
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
.feature-hidden { opacity: 0; transform: translateY(24px); }
.feature-visible {
  animation: featureFadeIn 0.6s ease forwards;
}
`;

function injectStyle(id, css) {
  if (typeof document !== 'undefined' && !document.getElementById(id)) {
    const tag = document.createElement('style');
    tag.id = id;
    tag.textContent = css;
    document.head.appendChild(tag);
  }
}

function ShimmerBlock({ className = '' }) {
  return <div className={`shimmer-bg rounded-lg ${className}`} />;
}

// Animated wrapper using Intersection Observer
function AnimatedFeature({ children, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={visible ? 'feature-visible feature-animate' : 'feature-hidden'}
      style={visible ? { animationDelay: `${delay}ms` } : {}}
    >
      {children}
    </div>
  );
}

// Default icon if none provided
function DefaultIcon({ color = '#3b82f6' }) {
  return (
    <svg className="w-8 h-8" fill="none" stroke={color} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

// ─── GRID VARIANT ──────────────────────────────────────────────────────────

function GridFeatures({ features, designSystem }) {
  const ds = designSystem || {};
  const colors = ds.colors || {};
  const fonts = ds.fonts || {};
  const br = ds.borderRadius || '12px';

  return (
    <section className="py-20 px-4" style={{ background: colors.neutral || '#f8fafc', fontFamily: fonts.body || 'inherit' }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feat, i) => (
            <AnimatedFeature key={i} delay={i * 120}>
              <div
                className="p-8 bg-white"
                style={{ borderRadius: br, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
              >
                <div className="mb-5 w-14 h-14 flex items-center justify-center rounded-xl"
                  style={{ background: `${colors.primary || '#1e40af'}18` }}>
                  {feat.icon
                    ? <span className="text-2xl">{feat.icon}</span>
                    : <DefaultIcon color={colors.primary || '#1e40af'} />
                  }
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: colors.primary || '#1e40af', fontFamily: fonts.heading || 'inherit' }}>
                  {feat.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{feat.description}</p>
              </div>
            </AnimatedFeature>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── LIST VARIANT ──────────────────────────────────────────────────────────

function ListFeatures({ features, designSystem }) {
  const ds = designSystem || {};
  const colors = ds.colors || {};
  const fonts = ds.fonts || {};
  const br = ds.borderRadius || '12px';

  return (
    <section className="py-20 px-4" style={{ fontFamily: fonts.body || 'inherit' }}>
      <div className="max-w-4xl mx-auto flex flex-col gap-12">
        {features.map((feat, i) => (
          <AnimatedFeature key={i} delay={i * 100}>
            <div className={`flex flex-col md:flex-row gap-8 items-center ${i % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
              <div
                className="flex-shrink-0 w-24 h-24 flex items-center justify-center"
                style={{ background: `${colors.secondary || '#3b82f6'}18`, borderRadius: br }}
              >
                {feat.icon
                  ? <span className="text-4xl">{feat.icon}</span>
                  : <DefaultIcon color={colors.secondary || '#3b82f6'} />
                }
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3" style={{ color: colors.primary || '#1e40af', fontFamily: fonts.heading || 'inherit' }}>
                  {feat.title}
                </h3>
                <p className="text-gray-600 text-lg leading-relaxed">{feat.description}</p>
              </div>
            </div>
          </AnimatedFeature>
        ))}
      </div>
    </section>
  );
}

// ─── ALTERNATING VARIANT ────────────────────────────────────────────────────

function AlternatingFeatures({ features, designSystem }) {
  const ds = designSystem || {};
  const colors = ds.colors || {};
  const fonts = ds.fonts || {};

  return (
    <section className="py-20 px-4" style={{ background: colors.neutral || '#f8fafc', fontFamily: fonts.body || 'inherit' }}>
      <div className="max-w-5xl mx-auto flex flex-col gap-16">
        {features.map((feat, i) => {
          const isEven = i % 2 === 0;
          return (
            <AnimatedFeature key={i} delay={i * 100}>
              <div className={`flex flex-col md:flex-row gap-10 items-center ${!isEven ? 'md:flex-row-reverse' : ''}`}>
                <div
                  className="flex-shrink-0 w-32 h-32 flex items-center justify-center text-5xl"
                  style={{ background: isEven
                    ? `${colors.primary || '#1e40af'}15`
                    : `${colors.accent || '#f59e0b'}20`,
                    borderRadius: '50%' }}
                >
                  {feat.icon || <DefaultIcon color={isEven ? colors.primary || '#1e40af' : colors.accent || '#f59e0b'} />}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3" style={{ color: colors.primary || '#1e40af', fontFamily: fonts.heading || 'inherit' }}>
                    {feat.title}
                  </h3>
                  <p className="text-gray-600 text-lg leading-relaxed">{feat.description}</p>
                </div>
              </div>
            </AnimatedFeature>
          );
        })}
      </div>
    </section>
  );
}

// ─── PREVIEW MODE ──────────────────────────────────────────────────────────

function FeaturesPreview() {
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <ShimmerBlock className="h-8 w-48 mx-auto mb-4" />
          <ShimmerBlock className="h-4 w-72 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[0,1,2].map(i => (
            <div key={i} className="p-8 bg-white rounded-xl shadow-sm flex flex-col gap-4">
              <ShimmerBlock className="w-14 h-14 rounded-xl" />
              <ShimmerBlock className="h-6 w-3/4" />
              <ShimmerBlock className="h-4 w-full" />
              <ShimmerBlock className="h-4 w-5/6" />
              <ShimmerBlock className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── MAIN EXPORT ────────────────────────────────────────────────────────────

const DEFAULT_FEATURES = [
  { icon: '⚡', title: 'Rendimiento', description: 'Soluciones optimizadas para velocidad y escala en entornos de alta demanda.' },
  { icon: '🎯', title: 'Precisión', description: 'Resultados medibles con métricas claras y reportes en tiempo real.' },
  { icon: '🔒', title: 'Seguridad', description: 'Infraestructura robusta con certificaciones y protocolos de nivel enterprise.' },
];

export default function FeaturesSection({
  features = DEFAULT_FEATURES,
  variant = 'grid',
  designSystem,
  previewMode = false,
}) {
  injectStyle('features-section-styles', FEATURES_STYLE);

  if (previewMode) return <FeaturesPreview />;

  const props = { features, designSystem };

  switch (variant) {
    case 'list':        return <ListFeatures {...props} />;
    case 'alternating': return <AlternatingFeatures {...props} />;
    default:            return <GridFeatures {...props} />;
  }
}
