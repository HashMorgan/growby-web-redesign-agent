import React, { useEffect, useRef } from 'react';

// Shimmer animation keyframes injected once
const SHIMMER_STYLE = `
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(32px); }
  to { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .hero-animate { animation: none !important; }
}
.shimmer-bg {
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
.hero-fade { animation: fadeIn 0.8s ease forwards; }
.hero-slide { animation: slideUp 0.9s ease forwards; }
.hero-slide-delay { animation: slideUp 1.1s ease forwards; }
.hero-slide-cta { animation: slideUp 1.3s ease forwards; }
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

function StarRating() {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// ─── VARIANTS ──────────────────────────────────────────────────────────────

function CenteredHero({ headline, subheadline, ctaText, ctaUrl, designSystem, heroImage, animations }) {
  const ds = designSystem || {};
  const colors = ds.colors || {};
  const fonts = ds.fonts || {};
  const br = ds.borderRadius || '8px';

  const sectionStyle = {
    background: heroImage
      ? `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${heroImage}) center/cover no-repeat`
      : colors.primary || '#1e40af',
    fontFamily: fonts.body || 'inherit',
  };

  return (
    <section
      className="relative min-h-screen flex items-center justify-center px-4 py-24 text-center"
      style={sectionStyle}
    >
      <div className="max-w-3xl mx-auto">
        <h1
          className={`text-4xl md:text-6xl font-bold mb-6 text-white hero-animate hero-slide`}
          style={{ fontFamily: fonts.heading || 'inherit' }}
        >
          {headline}
        </h1>
        <p className={`text-lg md:text-2xl mb-10 text-white/90 hero-animate hero-slide-delay`}>
          {subheadline}
        </p>
        <a
          href={ctaUrl || '#'}
          className={`inline-block px-8 py-4 font-semibold text-white transition-transform duration-200 hover:scale-105 hero-animate hero-slide-cta`}
          style={{
            background: colors.accent || '#f59e0b',
            borderRadius: br,
            boxShadow: `0 4px 24px ${colors.accent || '#f59e0b'}44`,
          }}
        >
          {ctaText || 'Comenzar'}
        </a>
      </div>
    </section>
  );
}

function SplitHero({ headline, subheadline, ctaText, ctaUrl, designSystem, heroImage }) {
  const ds = designSystem || {};
  const colors = ds.colors || {};
  const fonts = ds.fonts || {};
  const br = ds.borderRadius || '8px';

  return (
    <section
      className="min-h-screen flex flex-col md:flex-row"
      style={{ background: colors.neutral || '#f8fafc' }}
    >
      {/* Left: text */}
      <div className="flex-1 flex items-center justify-center px-8 py-16 md:py-0">
        <div className="max-w-lg">
          <h1
            className="text-4xl md:text-5xl font-bold mb-5 hero-animate hero-slide"
            style={{ color: colors.primary || '#1e40af', fontFamily: fonts.heading || 'inherit' }}
          >
            {headline}
          </h1>
          <p className="text-lg mb-8 text-gray-600 hero-animate hero-slide-delay" style={{ fontFamily: fonts.body || 'inherit' }}>
            {subheadline}
          </p>
          <a
            href={ctaUrl || '#'}
            className="inline-block px-8 py-4 font-semibold text-white transition-transform duration-200 hover:scale-105 hero-animate hero-slide-cta"
            style={{ background: colors.accent || '#f59e0b', borderRadius: br }}
          >
            {ctaText || 'Comenzar'}
          </a>
        </div>
      </div>
      {/* Right: image */}
      <div className="flex-1 min-h-64 md:min-h-screen overflow-hidden">
        {heroImage ? (
          <img src={heroImage} alt="Hero" className="w-full h-full object-cover hero-animate hero-fade" />
        ) : (
          <div className="w-full h-full min-h-64" style={{ background: colors.secondary || '#3b82f6' }} />
        )}
      </div>
    </section>
  );
}

function VideoHero({ headline, subheadline, ctaText, ctaUrl, designSystem }) {
  const ds = designSystem || {};
  const colors = ds.colors || {};
  const fonts = ds.fonts || {};
  const br = ds.borderRadius || '8px';

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden text-center px-4 py-24">
      {/* Video placeholder — swap src for real video */}
      <div className="absolute inset-0 bg-gray-900">
        <div className="w-full h-full opacity-40" style={{ background: `linear-gradient(135deg, ${colors.primary || '#1e40af'}, ${colors.secondary || '#3b82f6'})` }} />
      </div>
      <div className="relative z-10 max-w-3xl mx-auto">
        <span className="inline-block px-4 py-1 mb-6 text-xs font-semibold uppercase tracking-widest text-white rounded-full" style={{ background: colors.accent || '#f59e0b' }}>
          Video Hero
        </span>
        <h1
          className="text-4xl md:text-6xl font-bold mb-6 text-white hero-animate hero-slide"
          style={{ fontFamily: fonts.heading || 'inherit' }}
        >
          {headline}
        </h1>
        <p className="text-xl mb-10 text-white/80 hero-animate hero-slide-delay">{subheadline}</p>
        <a
          href={ctaUrl || '#'}
          className="inline-block px-8 py-4 font-semibold text-white border-2 border-white transition-all duration-200 hover:bg-white hover:text-gray-900 hero-animate hero-slide-cta"
          style={{ borderRadius: br }}
        >
          {ctaText || 'Comenzar'}
        </a>
      </div>
    </section>
  );
}

// ─── PREVIEW MODE ──────────────────────────────────────────────────────────

function HeroPreview() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-24 text-center bg-gray-100 overflow-hidden">
      <div className="max-w-2xl mx-auto w-full flex flex-col items-center gap-6">
        <ShimmerBlock className="h-10 w-3/4" />
        <ShimmerBlock className="h-6 w-1/2" />
        <ShimmerBlock className="h-6 w-5/8" />
        <ShimmerBlock className="h-12 w-40 mt-2" />
        <div className="flex gap-2 mt-4 items-center">
          <StarRating />
          <ShimmerBlock className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ────────────────────────────────────────────────────────────

export default function HeroSection({
  headline = 'Transforma tu negocio digital',
  subheadline = 'Soluciones de alto impacto para empresas que quieren crecer.',
  ctaText = 'Comenzar ahora',
  ctaUrl = '#',
  variant = 'centered',
  designSystem,
  heroImage,
  animations = {},
  previewMode = false,
}) {
  injectStyle('hero-section-styles', SHIMMER_STYLE);

  if (previewMode) return <HeroPreview />;

  const props = { headline, subheadline, ctaText, ctaUrl, designSystem, heroImage, animations };

  switch (variant) {
    case 'split': return <SplitHero {...props} />;
    case 'video': return <VideoHero {...props} />;
    default:      return <CenteredHero {...props} />;
  }
}
