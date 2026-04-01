import React, { useState } from 'react';
import HeroSection from './hero-sections/HeroSection.jsx';
import FeaturesSection from './feature-sections/FeaturesSection.jsx';
import TestimonialsSection from './testimonial-sections/TestimonialsSection.jsx';
import CTASection from './cta-sections/CTASection.jsx';

// Sample design system for previews
const SAMPLE_DS = {
  colors: {
    primary: '#1e40af',
    secondary: '#3b82f6',
    accent: '#f59e0b',
    neutral: '#f8fafc',
  },
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
  },
  borderRadius: '10px',
};

const SAMPLE_FEATURES = [
  { icon: '⚡', title: 'Velocidad', description: 'Resultados desde el primer sprint con metodología ágil.' },
  { icon: '🎯', title: 'Precisión', description: 'Métricas claras y entregables medibles en cada etapa.' },
  { icon: '🔒', title: 'Seguridad', description: 'Infraestructura enterprise con certificaciones internacionales.' },
  { icon: '🚀', title: 'Escalabilidad', description: 'Soluciones que crecen con tu negocio sin fricciones.' },
];

const SAMPLE_TESTIMONIALS = [
  { name: 'María González', role: 'CEO', company: 'TechCorp', text: 'Increíble equipo. Entregaron resultados que superaron todas las expectativas en tiempo récord.', rating: 5 },
  { name: 'Carlos Ruiz', role: 'CTO', company: 'InnovateLab', text: 'Calidad técnica y comunicación excepcional durante todo el proyecto. Los recomiendo ampliamente.', rating: 5 },
  { name: 'Ana Torres', role: 'Directora de Marketing', company: 'BrandCo', text: 'Transformaron nuestra presencia digital. ROI demostrable desde el primer mes de lanzamiento.', rating: 5 },
];

// ─── SECTION PREVIEW CARD ──────────────────────────────────────────────────

function SectionCard({ title, variants, activeVariant, onVariantChange, children }) {
  return (
    <div className="mb-16 border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 bg-white border-b border-gray-100 gap-3">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        <div className="flex gap-2 flex-wrap">
          {variants.map(v => (
            <button
              key={v}
              onClick={() => onVariantChange(v)}
              className="px-4 py-1.5 text-sm rounded-full font-medium transition-colors duration-150"
              style={{
                background: activeVariant === v ? '#1e40af' : '#f1f5f9',
                color: activeVariant === v ? '#fff' : '#374151',
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      {/* Preview */}
      <div className="bg-gray-50">
        {children}
      </div>
    </div>
  );
}

// ─── MAIN GALLERY ──────────────────────────────────────────────────────────

export default function PreviewGallery() {
  const [heroVariant, setHeroVariant] = useState('centered');
  const [featuresVariant, setFeaturesVariant] = useState('grid');
  const [testimonialsVariant, setTestimonialsVariant] = useState('cards');
  const [ctaVariant, setCtaVariant] = useState('simple');
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Template Preview Gallery</h1>
          <p className="text-sm text-gray-500">Fase 3 — growby-web-redesign-agent</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <span>Preview mode</span>
          <div
            onClick={() => setShowPreview(p => !p)}
            className="w-11 h-6 rounded-full transition-colors duration-200 flex items-center px-1 cursor-pointer"
            style={{ background: showPreview ? '#1e40af' : '#d1d5db' }}
          >
            <div
              className="w-4 h-4 bg-white rounded-full shadow transition-transform duration-200"
              style={{ transform: showPreview ? 'translateX(20px)' : 'translateX(0)' }}
            />
          </div>
        </label>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">

        {/* HERO */}
        <SectionCard
          title="HeroSection"
          variants={['centered', 'split', 'video']}
          activeVariant={heroVariant}
          onVariantChange={setHeroVariant}
        >
          <HeroSection
            headline="Transforma tu negocio digital"
            subheadline="Soluciones de alto impacto para empresas que quieren crecer en LatAm y USA."
            ctaText="Comenzar ahora"
            ctaUrl="#"
            variant={heroVariant}
            designSystem={SAMPLE_DS}
            previewMode={showPreview}
          />
        </SectionCard>

        {/* FEATURES */}
        <SectionCard
          title="FeaturesSection"
          variants={['grid', 'list', 'alternating']}
          activeVariant={featuresVariant}
          onVariantChange={setFeaturesVariant}
        >
          <FeaturesSection
            features={SAMPLE_FEATURES}
            variant={featuresVariant}
            designSystem={SAMPLE_DS}
            previewMode={showPreview}
          />
        </SectionCard>

        {/* TESTIMONIALS */}
        <SectionCard
          title="TestimonialsSection"
          variants={['cards', 'carousel', 'quote']}
          activeVariant={testimonialsVariant}
          onVariantChange={setTestimonialsVariant}
        >
          <TestimonialsSection
            testimonials={SAMPLE_TESTIMONIALS}
            variant={testimonialsVariant}
            designSystem={SAMPLE_DS}
            previewMode={showPreview}
          />
        </SectionCard>

        {/* CTA */}
        <SectionCard
          title="CTASection"
          variants={['simple', 'banner', 'split']}
          activeVariant={ctaVariant}
          onVariantChange={setCtaVariant}
        >
          <CTASection
            headline="¿Listo para transformar tu negocio?"
            subtext="Hablemos de cómo podemos ayudarte a alcanzar tus objetivos digitales."
            ctaText="Hablar con un experto"
            ctaUrl="#"
            variant={ctaVariant}
            designSystem={SAMPLE_DS}
            previewMode={showPreview}
          />
        </SectionCard>

      </main>
    </div>
  );
}
