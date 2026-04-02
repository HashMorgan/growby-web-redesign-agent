/**
 * generate.js — v2.0.0 Stitch-only pipeline
 * Flujo: quickScrape → buildPrompt → Stitch → deployNetlify
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { broadcast, activeJobs } from '../lib/broadcast.js';
import { quickScrape } from '../../scripts/agents/quick-scrape.js';
import { generateWithStitch } from '../../scripts/agents/stitch-simple.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..', '..');

function slugify(url) {
  return url
    .replace(/https?:\/\/(www\.)?/, '')
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 40);
}

function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

function buildPrompt(url, scrapeData) {
  return `Rediseña el home web de ${url}. Usa el mismo contenido, colores y logos del sitio original. Mejora las imágenes según el rubro. Agrega en el footer: Powered by GrowBy con logo https://growby.tech/favicon.ico linking a growby.tech`;
}

function getPublicUrls(jobId) {
  return {
    publicUrl: `https://agents.growby.digital/demo/${jobId}/index.html`,
    privateUrl: `https://agents.growby.digital/redesigns/${jobId}/index.html`
  };
}

async function runStitchPipeline(url, context, jobId) {
  const clientSlug = slugify(url);
  const timestamp = new Date().toISOString().slice(0, 10);
  const outputDir = path.join(PROJECT_ROOT, 'outputs', `${clientSlug}-${timestamp}`);

  const emit = (step, message, progress, extra = {}) => {
    broadcast({ jobId, step, message, progress, ...extra });
  };

  try {
    // PASO 1: Quick Scrape (básico)
    emit('analyzing', '🔍 Analizando sitio original...', 10);
    const scrapeData = await quickScrape(url);

    // PASO 2: Build Prompt with context
    emit('analyzing', '📝 Construyendo prompt para Stitch...', 20);
    const basePrompt = `Rediseña el home web de ${url}. Usa el mismo contenido, colores y logos del sitio original. Mejora las imágenes según el rubro. Agrega en el footer: Powered by GrowBy con logo https://growby.tech/favicon.ico linking a growby.tech`;
    const fullPrompt = context
      ? `${basePrompt}\n\nObjetivo adicional del rediseño:\n${context}`
      : basePrompt;

    console.log(`\n📝 Stitch Prompt:\n${fullPrompt}\n`);

    // PASO 3: Generate with Stitch
    emit('generating', '🎨 Generando con Stitch AI...', 30);

    const result = await generateWithStitch(
      fullPrompt,
      jobId,
      (data) => emit(data.step, data.message, data.progress),
      { url, scrapeData }
    );

    const html = result.html;
    const projectId = result.projectId;

    // PASO 4: Save HTML
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const htmlPath = path.join(outputDir, 'index.html');
    fs.writeFileSync(htmlPath, html, 'utf8');

    console.log(`\n💾 Saved: ${htmlPath}`);
    console.log(`   Size: ${(html.length / 1024).toFixed(1)} KB`);

    // PASO 5: Generar URLs (instantáneas, sin deploy)
    emit('deploying', '🔗 Generando URLs...', 96);

    const { publicUrl, privateUrl } = getPublicUrls(path.basename(outputDir));

    // Save Stitch metadata
    const stitchMeta = {
      projectId,
      url,
      context,
      method: 'stitch',
      timestamp: new Date().toISOString(),
      publicUrl,   // Para compartir con clientes
      privateUrl   // Para equipo interno
    };
    fs.writeFileSync(
      path.join(outputDir, 'stitch-meta.json'),
      JSON.stringify(stitchMeta, null, 2)
    );

    // Save job data
    activeJobs.set(jobId, {
      url,
      method: 'stitch',
      outputPath: outputDir,
      publicUrl,
      privateUrl,
      htmlSize: html.length,
      createdAt: new Date().toISOString()
    });

    // PASO 6: Complete
    emit('complete', '✅ Rediseño listo', 100, {
      publicUrl,
      privateUrl,
      outputPath: outputDir,
      htmlSize: html.length
    });

    console.log(`\n✅ Stitch pipeline completado`);
    console.log(`   URL pública: ${publicUrl}`);
    console.log(`   URL privada: ${privateUrl}`);

  } catch (error) {
    console.error('\n❌ Stitch pipeline error:', error.message);
    emit('error', `❌ Error: ${error.message}`, 0);
    activeJobs.delete(jobId);
  }
}

async function runPipeline(url, jobId, context = '') {
  const clientSlug = slugify(url);
  const timestamp = new Date().toISOString().slice(0, 10);
  const outputDir = path.join(PROJECT_ROOT, 'outputs', `${clientSlug}-${timestamp}`);

  const emit = (step, message, progress, extra = {}) => {
    broadcast({ jobId, step, message, progress, ...extra });
  };

  try {
    // PASO 1: Quick Scrape
    emit('scraping', '🔍 Analizando sitio original...', 10);
    const scrapeData = await quickScrape(url);

    // PASO 2: Análisis (Pipeline propio - sin Stitch)
    emit('analysis', '🧠 Analizando UI/UX/SEO...', 30);

    // TODO: Aquí se podrían integrar skills si existieran
    // Por ahora usamos un design system básico optimizado
    const designSystem = {
      theme: {
        customColor: '#5D55D7', // GrowBy primary
        headlineFont: 'Inter',
        bodyFont: 'Inter'
      }
    };

    console.log(`\n🧠 Análisis completado para: ${url}`);
    console.log(`   Context: ${context || 'Sin contexto específico'}`);

    // PASO 3: Generar HTML con html-builder (NO Stitch)
    emit('design', '🎨 Construyendo HTML optimizado...', 60);

    const { buildHTML } = await import('../../scripts/agents/html-builder.js');

    // Agregar context al scrapeData para que html-builder lo use
    const enrichedScrapeData = {
      ...scrapeData,
      context: context || '',
      clientObjective: context || 'Rediseño profesional con mejor UX y conversión'
    };

    const html = buildHTML(url, enrichedScrapeData, designSystem);
    const projectId = null; // Pipeline no usa Stitch project ID

    // PASO 4: Save HTML
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const htmlPath = path.join(outputDir, 'index.html');
    fs.writeFileSync(htmlPath, html, 'utf8');

    console.log(`\n💾 Saved: ${htmlPath}`);
    console.log(`   Size: ${(html.length / 1024).toFixed(1)} KB`);

    // PASO 5: Generar URLs (instantáneas, sin deploy)
    emit('deploying', '🔗 Generando URLs...', 96);

    const { publicUrl, privateUrl } = getPublicUrls(path.basename(outputDir));

    // Save metadata for future reference
    const metadata = {
      projectId,
      url,
      context,
      method: 'pipeline',
      timestamp: new Date().toISOString(),
      publicUrl,   // Para compartir con clientes
      privateUrl   // Para equipo interno
    };
    fs.writeFileSync(
      path.join(outputDir, 'stitch-meta.json'),
      JSON.stringify(metadata, null, 2)
    );

    // Save job data
    activeJobs.set(jobId, {
      url,
      method: 'pipeline',
      outputPath: outputDir,
      publicUrl,
      privateUrl,
      htmlSize: html.length,
      createdAt: new Date().toISOString()
    });

    // PASO 6: Complete
    emit('complete', '✅ Rediseño listo', 100, {
      publicUrl,
      privateUrl,
      outputPath: outputDir,
      htmlSize: html.length
    });

    console.log(`\n✅ Pipeline completado`);
    console.log(`   URL pública: ${publicUrl}`);
    console.log(`   URL privada: ${privateUrl}`);

  } catch (error) {
    console.error('\n❌ Pipeline error:', error.message);
    emit('error', `❌ Error: ${error.message}`, 0);
    activeJobs.delete(jobId);
  }
}

// GET /stats — count of completed redesigns
router.get('/stats', (req, res) => {
  try {
    const outputsDir = path.join(PROJECT_ROOT, 'outputs');
    if (!fs.existsSync(outputsDir)) return res.json({ redesigns: 0 });

    const entries = fs.readdirSync(outputsDir, { withFileTypes: true });
    const redesigns = entries.filter(e => e.isDirectory()).length;

    return res.json({ redesigns });
  } catch (_) {
    return res.json({ redesigns: 0 });
  }
});

// GET /history — list all generated redesigns
router.get('/history', (req, res) => {
  try {
    const outputsDir = path.join(PROJECT_ROOT, 'outputs');
    if (!fs.existsSync(outputsDir)) {
      return res.json({ redesigns: [] });
    }

    const entries = fs.readdirSync(outputsDir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(dir => {
        const jobId = dir.name;
        const dirPath = path.join(outputsDir, jobId);

        // Try to read metadata
        let metadata = null;
        const stitchMetaPath = path.join(dirPath, 'stitch-meta.json');
        const analysisPath = path.join(dirPath, 'analysis.json');

        if (fs.existsSync(stitchMetaPath)) {
          metadata = JSON.parse(fs.readFileSync(stitchMetaPath, 'utf8'));
        } else if (fs.existsSync(analysisPath)) {
          const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
          metadata = {
            url: analysis.url || '',
            method: 'pipeline',
            timestamp: analysis.timestamp || new Date().toISOString()
          };
        }

        // Try to get URLs
        let publicUrl = null;
        let privateUrl = null;
        const indexPath = path.join(dirPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          // Use metadata URLs if available
          if (metadata?.publicUrl && metadata?.privateUrl) {
            publicUrl = metadata.publicUrl;
            privateUrl = metadata.privateUrl;
          } else {
            // Generate URLs for old projects without metadata
            const urls = getPublicUrls(jobId);
            publicUrl = urls.publicUrl;
            privateUrl = urls.privateUrl;
          }
        }

        // Get file stats for creation time
        const stats = fs.statSync(dirPath);

        return {
          jobId,
          url: metadata?.url || '',
          method: metadata?.method || 'unknown',
          context: metadata?.context || '',
          publicUrl,
          privateUrl,
          timestamp: metadata?.timestamp || stats.birthtime.toISOString(),
          createdAt: stats.birthtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Most recent first

    res.json({ redesigns: entries });
  } catch (error) {
    console.error('Error reading history:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST / — start redesign job
router.post('/', async (req, res) => {
  const { url, method = 'stitch', context = '' } = req.body;

  // Validate URL
  if (!url || !isValidUrl(url)) {
    return res.status(400).json({
      error: 'URL inválida. Debe comenzar con http:// o https://'
    });
  }

  // Validate method
  if (!['stitch', 'pipeline'].includes(method)) {
    return res.status(400).json({
      error: 'Método inválido. Debe ser "stitch" o "pipeline"'
    });
  }

  // Generate job ID
  const clientSlug = slugify(url);
  const timestamp = Date.now();
  const jobId = `${clientSlug}-${timestamp}`;

  // Respond immediately
  res.json({
    jobId,
    status: 'started',
    method,
    message: `${method === 'stitch' ? 'Stitch AI' : 'Pipeline GrowBy'} iniciado. Conecta via WebSocket para actualizaciones.`
  });

  // Run pipeline in background
  setImmediate(() => {
    if (method === 'stitch') {
      runStitchPipeline(url, context, jobId);
    } else {
      runPipeline(url, jobId, context);
    }
  });
});

export default router;
