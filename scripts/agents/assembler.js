import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..', '..');

function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }

// ─── Anti-contamination check ─────────────────────────────────────────────────
const GROWBY_FINGERPRINTS = [
  'growby',
  'GrowBy',
  'kevin@growby.tech',
  'PRY-AGT-001',
  'growby.tech',
  'Hub Negocios Creativos',
];

function antiContaminationCheck(html) {
  const found = GROWBY_FINGERPRINTS.filter(fp => html.includes(fp));
  if (found.length > 0) {
    throw new Error(
      `Anti-contamination check FAILED: output HTML contains GrowBy-specific strings: ${found.join(', ')}. ` +
      `The generated redesign must not contain internal GrowBy content.`
    );
  }
}

// ─── Build Google Fonts URL ───────────────────────────────────────────────────
function buildGoogleFontsUrl(headingFont, bodyFont) {
  const encode = (f) => encodeURIComponent(f).replace(/%20/g, '+');
  const fonts = [...new Set([headingFont, bodyFont].filter(Boolean))];
  const families = fonts.map(f => `family=${encode(f)}:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400`).join('&');
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

// ─── Build section order from layout plan ────────────────────────────────────
function assembleSections(components, layoutPlan) {
  const sectionMap = {
    'hero-fullbleed':    'hero',
    'logo-carousel':     'logos',
    'stats-banner':      'stats',
    'features-list':     'features',
    'features-bento':    'features',
    'process-numbered':  'process',
    'testimonials-cards':'testimonials',
    'cta-section':       'cta',
    'footer-simple':     'footer',
  };

  const orderedSections = [];
  const seenKeys = new Set();

  for (const section of layoutPlan.sections) {
    const key = sectionMap[section.type];
    if (!key || seenKeys.has(key)) continue;
    seenKeys.add(key);

    // Skip footer — handled separately
    if (key === 'footer') continue;

    const sectionHtml = components.html[key];
    if (sectionHtml) {
      orderedSections.push(sectionHtml);
    }
  }

  return orderedSections;
}

// ─── Main export ──────────────────────────────────────────────────────────────
/**
 * Assembles all components into final HTML and writes to outputDir.
 *
 * @param {object} components - Output from buildComponents()
 * @param {object} layoutPlan - Output from planLayout()
 * @param {object} analysis   - Full analysis object
 * @param {string} outputDir  - Absolute path to the output directory
 * @param {string} [filename] - Optional filename (default: 'index.html')
 * @returns {{ htmlPath, jsxPath, htmlSize }}
 */
export async function assembleHTML(components, layoutPlan, analysis, outputDir, filename = 'index.html') {
  if (!components || !layoutPlan || !analysis || !outputDir) {
    throw new Error('assembleHTML: components, layoutPlan, analysis, and outputDir are all required');
  }

  ensureDir(outputDir);

  const ds = layoutPlan.design_system;
  const companyName = layoutPlan.company_name || 'Empresa';
  const metaTitle = layoutPlan.meta?.title
    || analysis.seo_copy_analysis?.rewritten_meta?.title
    || `${companyName} — Sitio Web`;
  const metaDescription = layoutPlan.meta?.description
    || analysis.seo_copy_analysis?.rewritten_meta?.description
    || analysis.scraping?.metadata?.description
    || '';

  const headingFont = ds.fonts.heading || 'Plus Jakarta Sans';
  const bodyFont    = ds.fonts.body    || 'Inter';
  const googleFontsUrl = buildGoogleFontsUrl(headingFont, bodyFont);

  // Assemble sections in layout order
  const sections = assembleSections(components, layoutPlan);

  // Get footer from components
  const footerHtml = components.html.footer || '';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${metaTitle}</title>
  <meta name="description" content="${metaDescription.replace(/"/g, '&quot;')}">
  <meta property="og:title" content="${metaTitle.replace(/"/g, '&quot;')}">
  <meta property="og:description" content="${metaDescription.replace(/"/g, '&quot;')}">
  <meta property="og:type" content="website">
  <!-- Preconnect for performance -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <!-- Google Fonts -->
  <link href="${googleFontsUrl}" rel="stylesheet">
  <style>
${components.css}
  </style>
</head>
<body>
  <!-- Skip to main content (accessibility) -->
  <a href="#main-content" class="skip-link">Saltar al contenido principal</a>

  <!-- Navigation -->
  ${components.html.nav || ''}

  <!-- Main content -->
  <main id="main-content">
    ${sections.join('\n\n    ')}
  </main>

  <!-- Footer -->
  ${footerHtml}

  <script>
${components.js}
  </script>
</body>
</html>`;

  // Anti-contamination check — fail loudly if GrowBy content leaks into output
  antiContaminationCheck(html);

  // Write index.html
  const htmlPath = path.join(outputDir, filename);
  fs.writeFileSync(htmlPath, html, 'utf8');
  const htmlSize = Buffer.byteLength(html, 'utf8');

  console.log(`  ✅ HTML assembleado: ${filename} (${(htmlSize / 1024).toFixed(1)} KB)`);

  // Write redesign.jsx (JSX wrapper for backwards compatibility)
  const jsxContent = `// redesign.jsx — JSX wrapper generado por GrowBy Web Redesign Agent v0.9.0
// Para usar en React: import Redesign from './redesign.jsx'; <Redesign />

export default function Redesign() {
  return (
    <div dangerouslySetInnerHTML={{ __html: \`${html.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\` }} />
  );
}
`;

  const jsxPath = path.join(outputDir, 'redesign.jsx');
  fs.writeFileSync(jsxPath, jsxContent, 'utf8');

  console.log(`  ✅ JSX wrapper: redesign.jsx`);
  console.log(`  🔒 Anti-contamination check: PASSED`);

  return { htmlPath, jsxPath, htmlSize };
}
