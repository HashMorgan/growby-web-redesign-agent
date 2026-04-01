import React from 'react';

const CTA_STYLE = `
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.shimmer-bg {
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
.cta-btn {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.cta-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 32px rgba(0,0,0,0.22);
}
@media (prefers-reduced-motion: reduce) {
  .cta-btn { transition: none; }
  .cta-btn:hover { transform: none; }
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

function CTAButton({ text, url, accentColor = '#f59e0b', borderRadius = '8px' }) {
  return (
    <a
      href={url || '#'}
      className="cta-btn inline-block px-10 py-4 font-semibold text-white text-lg"
      style={{ background: accentColor, borderRadius }}
    >
      {text || 'Contáctanos'}
    </a>
  );
}

// ─── SIMPLE VARIANT ────────────────────────────────────────────────────────

function SimpleCTA({ headline, subtext, ctaText, ctaUrl, designSystem }) {
  const ds = designSystem || {};
  const colors = ds.colors || {};
  const fonts = ds.fonts || {};
  const br = ds.borderRadius || '8px';

  return (
    <section
      className="py-24 px-4 text-center"
      style={{ background: colors.primary || '#1e40af', fontFamily: fonts.body || 'inherit' }}
    >
      <div className="max-w-2xl mx-auto">
        <h2
          className="text-3xl md:text-5xl font-bold text-white mb-5"
          style={{ fontFamily: fonts.heading || 'inherit' }}
        >
          {headline}
        </h2>
        {subtext && (
          <p className="text-white/80 text-lg mb-10">{subtext}</p>
        )}
        <CTAButton text={ctaText} url={ctaUrl} accentColor={colors.accent || '#f59e0b'} borderRadius={br} />
      </div>
    </section>
  );
}

// ─── BANNER VARIANT ────────────────────────────────────────────────────────

function BannerCTA({ headline, subtext, ctaText, ctaUrl, designSystem, bgImage }) {
  const ds = designSystem || {};
  const colors = ds.colors || {};
  const fonts = ds.fonts || {};
  const br = ds.borderRadius || '8px';

  const sectionStyle = bgImage
    ? {
        background: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${bgImage}) center/cover no-repeat`,
        fontFamily: fonts.body || 'inherit',
      }
    : {
        background: `linear-gradient(135deg, ${colors.primary || '#1e40af'}, ${colors.secondary || '#3b82f6'})`,
        fontFamily: fonts.body || 'inherit',
      };

  return (
    <section className="py-28 px-4 text-center" style={sectionStyle}>
      <div className="max-w-3xl mx-auto">
        <h2
          className="text-4xl md:text-5xl font-bold text-white mb-5"
          style={{ fontFamily: fonts.heading || 'inherit' }}
        >
          {headline}
        </h2>
        {subtext && (
          <p className="text-white/80 text-xl mb-10 max-w-xl mx-auto">{subtext}</p>
        )}
        <CTAButton text={ctaText} url={ctaUrl} accentColor={colors.accent || '#f59e0b'} borderRadius={br} />
      </div>
    </section>
  );
}

// ─── SPLIT VARIANT ─────────────────────────────────────────────────────────

function SplitCTA({ headline, subtext, ctaText, ctaUrl, designSystem, bgImage }) {
  const ds = designSystem || {};
  const colors = ds.colors || {};
  const fonts = ds.fonts || {};
  const br = ds.borderRadius || '8px';

  return (
    <section
      className="flex flex-col md:flex-row min-h-64"
      style={{ fontFamily: fonts.body || 'inherit' }}
    >
      {/* Left: text */}
      <div
        className="flex-1 flex items-center justify-center px-10 py-16 md:py-0"
        style={{ background: colors.primary || '#1e40af' }}
      >
        <div className="max-w-md">
          <h2
            className="text-3xl md:text-4xl font-bold text-white mb-4"
            style={{ fontFamily: fonts.heading || 'inherit' }}
          >
            {headline}
          </h2>
          {subtext && <p className="text-white/80 text-lg mb-8">{subtext}</p>}
          <CTAButton text={ctaText} url={ctaUrl} accentColor={colors.accent || '#f59e0b'} borderRadius={br} />
        </div>
      </div>
      {/* Right: image */}
      <div className="flex-1 min-h-64 md:min-h-0 overflow-hidden">
        {bgImage ? (
          <img src={bgImage} alt="CTA" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full min-h-64" style={{ background: colors.secondary || '#3b82f6' }} />
        )}
      </div>
    </section>
  );
}

// ─── PREVIEW MODE ──────────────────────────────────────────────────────────

function CTAPreview() {
  return (
    <section className="py-24 px-4 bg-blue-50 text-center">
      <div className="max-w-2xl mx-auto flex flex-col items-center gap-6">
        <ShimmerBlock className="h-10 w-3/4" />
        <ShimmerBlock className="h-5 w-1/2" />
        <ShimmerBlock className="h-14 w-44 mt-4" />
      </div>
    </section>
  );
}

// ─── MAIN EXPORT ────────────────────────────────────────────────────────────

export default function CTASection({
  headline = '¿Listo para transformar tu negocio?',
  subtext = 'Hablemos de cómo podemos ayudarte a alcanzar tus objetivos digitales.',
  ctaText = 'Hablar con un experto',
  ctaUrl = '#',
  variant = 'simple',
  designSystem,
  bgImage,
  previewMode = false,
}) {
  injectStyle('cta-section-styles', CTA_STYLE);

  if (previewMode) return <CTAPreview />;

  const props = { headline, subtext, ctaText, ctaUrl, designSystem, bgImage };

  switch (variant) {
    case 'banner': return <BannerCTA {...props} />;
    case 'split':  return <SplitCTA {...props} />;
    default:       return <SimpleCTA {...props} />;
  }
}
