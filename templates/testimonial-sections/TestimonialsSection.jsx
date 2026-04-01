import React, { useState } from 'react';

const TESTIMONIALS_STYLE = `
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.shimmer-bg {
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
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

// ─── TRUST SIGNALS ─────────────────────────────────────────────────────────

function StarRating({ rating = 5, color = '#f59e0b' }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className="w-4 h-4" fill={i <= rating ? color : '#d1d5db'} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function Avatar({ src, name, size = 12 }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() : 'U';
  return src ? (
    <img src={src} alt={name} className={`w-${size} h-${size} rounded-full object-cover border-2 border-white shadow`} />
  ) : (
    <div className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow`}
      style={{ background: '#3b82f6', fontSize: size > 10 ? '1.2rem' : '0.875rem' }}>
      {initials}
    </div>
  );
}

// ─── CARDS VARIANT ─────────────────────────────────────────────────────────

function CardsTestimonials({ testimonials, designSystem }) {
  const ds = designSystem || {};
  const colors = ds.colors || {};
  const fonts = ds.fonts || {};
  const br = ds.borderRadius || '12px';

  return (
    <section className="py-20 px-4" style={{ background: colors.neutral || '#f8fafc', fontFamily: fonts.body || 'inherit' }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white p-8 flex flex-col gap-4" style={{ borderRadius: br, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              <StarRating rating={t.rating || 5} color={colors.accent || '#f59e0b'} />
              <blockquote className="text-gray-700 leading-relaxed text-base flex-1">
                <span className="text-4xl leading-none text-gray-200 font-serif">"</span>
                {t.text}
              </blockquote>
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                <Avatar src={t.avatar} name={t.name} size={12} />
                <div>
                  <p className="font-semibold text-sm" style={{ color: colors.primary || '#1e40af' }}>{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}{t.company ? ` · ${t.company}` : ''}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── QUOTE VARIANT ─────────────────────────────────────────────────────────

function QuoteTestimonial({ testimonials, designSystem }) {
  const ds = designSystem || {};
  const colors = ds.colors || {};
  const fonts = ds.fonts || {};
  // Show first testimonial for 'quote' variant
  const t = testimonials[0] || {};

  return (
    <section className="py-24 px-4 text-center" style={{ background: colors.primary || '#1e40af', fontFamily: fonts.body || 'inherit' }}>
      <div className="max-w-3xl mx-auto">
        <svg className="w-16 h-16 mx-auto mb-8 opacity-30" fill="white" viewBox="0 0 32 32">
          <path d="M10 8C5.6 8 2 11.6 2 16s3.6 8 8 8a8 8 0 008-8H14c0 2.2-1.8 4-4 4s-4-1.8-4-4 1.8-4 4-4V8zm16 0c-4.4 0-8 3.6-8 8s3.6 8 8 8a8 8 0 008-8H30c0 2.2-1.8 4-4 4s-4-1.8-4-4 1.8-4 4-4V8z"/>
        </svg>
        <p className="text-2xl md:text-3xl font-light text-white leading-relaxed mb-10" style={{ fontFamily: fonts.heading || 'inherit' }}>
          {t.text || 'Testimonio destacado aquí.'}
        </p>
        <div className="flex flex-col items-center gap-3">
          <Avatar src={t.avatar} name={t.name} size={16} />
          <div>
            <p className="font-semibold text-white text-lg">{t.name || 'Cliente'}</p>
            <p className="text-white/70 text-sm">{t.role}{t.company ? ` · ${t.company}` : ''}</p>
          </div>
          <StarRating rating={t.rating || 5} color={colors.accent || '#f59e0b'} />
        </div>
      </div>
    </section>
  );
}

// ─── CAROUSEL VARIANT ──────────────────────────────────────────────────────

function CarouselTestimonials({ testimonials, designSystem }) {
  const [current, setCurrent] = useState(0);
  const ds = designSystem || {};
  const colors = ds.colors || {};
  const fonts = ds.fonts || {};
  const br = ds.borderRadius || '12px';
  const t = testimonials[current] || {};

  const prev = () => setCurrent(c => (c - 1 + testimonials.length) % testimonials.length);
  const next = () => setCurrent(c => (c + 1) % testimonials.length);

  return (
    <section className="py-20 px-4" style={{ background: colors.neutral || '#f8fafc', fontFamily: fonts.body || 'inherit' }}>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-10 relative" style={{ borderRadius: br, boxShadow: '0 4px 32px rgba(0,0,0,0.1)' }}>
          <StarRating rating={t.rating || 5} color={colors.accent || '#f59e0b'} />
          <blockquote className="text-gray-700 text-lg leading-relaxed my-6">
            "{t.text || 'Testimonio aquí.'}"
          </blockquote>
          <div className="flex items-center gap-4">
            <Avatar src={t.avatar} name={t.name} size={14} />
            <div>
              <p className="font-semibold" style={{ color: colors.primary || '#1e40af' }}>{t.name || 'Cliente'}</p>
              <p className="text-sm text-gray-500">{t.role}{t.company ? ` · ${t.company}` : ''}</p>
            </div>
          </div>
        </div>
        {/* Controls */}
        <div className="flex items-center justify-center gap-6 mt-8">
          <button
            onClick={prev}
            className="w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-200 hover:bg-gray-100"
            style={{ borderColor: colors.primary || '#1e40af' }}
            aria-label="Anterior"
          >
            <svg className="w-5 h-5" fill="none" stroke={colors.primary || '#1e40af'} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex gap-2">
            {testimonials.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className="w-2.5 h-2.5 rounded-full transition-all duration-200"
                style={{ background: i === current ? colors.primary || '#1e40af' : '#d1d5db' }}
                aria-label={`Ir a ${i+1}`}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-200 hover:bg-gray-100"
            style={{ borderColor: colors.primary || '#1e40af' }}
            aria-label="Siguiente"
          >
            <svg className="w-5 h-5" fill="none" stroke={colors.primary || '#1e40af'} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── PREVIEW MODE ──────────────────────────────────────────────────────────

function TestimonialsPreview() {
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <ShimmerBlock className="h-8 w-56 mx-auto mb-4" />
          <ShimmerBlock className="h-4 w-80 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[0,1,2].map(i => (
            <div key={i} className="bg-white rounded-xl p-8 shadow-sm flex flex-col gap-4">
              <div className="flex gap-1">
                {[0,1,2,3,4].map(j => <ShimmerBlock key={j} className="w-4 h-4 rounded" />)}
              </div>
              <ShimmerBlock className="h-4 w-full" />
              <ShimmerBlock className="h-4 w-5/6" />
              <ShimmerBlock className="h-4 w-4/5" />
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <ShimmerBlock className="w-12 h-12 rounded-full flex-shrink-0" />
                <div className="flex flex-col gap-2 flex-1">
                  <ShimmerBlock className="h-4 w-28" />
                  <ShimmerBlock className="h-3 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── MAIN EXPORT ────────────────────────────────────────────────────────────

const DEFAULT_TESTIMONIALS = [
  { name: 'María González', role: 'CEO', company: 'TechCorp', text: 'Increíble experiencia. El equipo entregó resultados que superaron todas nuestras expectativas en tiempo récord.', rating: 5 },
  { name: 'Carlos Ruiz', role: 'CTO', company: 'InnovateLab', text: 'La calidad técnica y la comunicación durante el proyecto fueron excepcionales. Los recomiendo ampliamente.', rating: 5 },
  { name: 'Ana Torres', role: 'Directora de Marketing', company: 'BrandCo', text: 'Transformaron nuestra presencia digital por completo. ROI demostrable desde el primer mes de lanzamiento.', rating: 5 },
];

export default function TestimonialsSection({
  testimonials = DEFAULT_TESTIMONIALS,
  variant = 'cards',
  designSystem,
  previewMode = false,
}) {
  injectStyle('testimonials-section-styles', TESTIMONIALS_STYLE);

  if (previewMode) return <TestimonialsPreview />;

  const props = { testimonials, designSystem };

  switch (variant) {
    case 'quote':    return <QuoteTestimonial {...props} />;
    case 'carousel': return <CarouselTestimonials {...props} />;
    default:         return <CardsTestimonials {...props} />;
  }
}
