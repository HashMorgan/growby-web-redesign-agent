import HeroSection from './hero-sections/HeroSection.jsx';
import FeaturesSection from './feature-sections/FeaturesSection.jsx';
import TestimonialsSection from './testimonial-sections/TestimonialsSection.jsx';
import CTASection from './cta-sections/CTASection.jsx';

export { HeroSection, FeaturesSection, TestimonialsSection, CTASection };

export const TEMPLATES = {
  hero: {
    component: HeroSection,
    variants: ['centered', 'split', 'video'],
  },
  features: {
    component: FeaturesSection,
    variants: ['grid', 'list', 'alternating'],
  },
  testimonials: {
    component: TestimonialsSection,
    variants: ['cards', 'carousel', 'quote'],
  },
  cta: {
    component: CTASection,
    variants: ['simple', 'banner', 'split'],
  },
};
