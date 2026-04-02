/**
 * generate.js — v2.0.0 Stitch-only pipeline
 * Flujo: quickScrape → buildPrompt → Stitch → deployNetlify
 */

import express from 'express';
import { execSync } from 'child_process';
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

async function deployToNetlify(htmlPath, clientSlug, siteName = null) {
  try {
    console.log('\n🚀 Deploying to Netlify...');

    // Si no se provee siteName, generar uno único con fecha/hora
    if (!siteName) {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
      const timeStr = now.toTimeString().slice(0, 5).replace(/:/g, ''); // HHmm
      siteName = `growby-${clientSlug.slice(0, 20)}-${dateStr}-${timeStr}`;
    }

    const result = execSync(
      `netlify deploy --dir="${path.dirname(htmlPath)}" --prod --site-name=${siteName} --json`,
      {
        encoding: 'utf8',
        timeout: 60000,
        env: {
          ...process.env,
          NETLIFY_AUTH_TOKEN: process.env.NETLIFY_AUTH_TOKEN
        }
      }
    );

    const data = JSON.parse(result);
    const netlifyUrl = data.url || data.deploy_url;

    console.log(`   ✅ Deployed: ${netlifyUrl}`);
    return { netlifyUrl, siteName };

  } catch (error) {
    console.error(`   ❌ Netlify deploy failed: ${error.message.slice(0, 200)}`);
    throw new Error('Netlify deploy failed');
  }
}

async function runPipeline(url, jobId) {
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

    // PASO 2: Build Prompt
    emit('prompt', '📝 Preparando prompt para Stitch...', 20);
    const prompt = buildPrompt(url, scrapeData);
    console.log(`\n📝 Prompt:\n${prompt}\n`);

    // PASO 3: Generate with Stitch
    emit('generating', '🎨 Generando con Stitch AI...', 30);

    const result = await generateWithStitch(
      prompt,
      jobId,
      (data) => emit(data.step, data.message, data.progress),
      { url, scrapeData } // fallbackData
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

    // PASO 5: Deploy to Netlify
    emit('deploying', '🚀 Publicando en Netlify...', 96);

    let netlifyUrl, siteName;
    try {
      const deployResult = await deployToNetlify(htmlPath, clientSlug);
      netlifyUrl = deployResult.netlifyUrl;
      siteName = deployResult.siteName;
    } catch (deployError) {
      // Fallback: serve locally
      const folder = path.basename(outputDir);
      netlifyUrl = `/preview/${folder}/index.html`;
      siteName = null;
      console.warn(`⚠️ Netlify failed, serving locally: ${netlifyUrl}`);
    }

    // Save Stitch metadata for future adjustments
    const stitchMeta = {
      projectId,
      siteName,
      url,
      timestamp: new Date().toISOString()
    };
    fs.writeFileSync(
      path.join(outputDir, 'stitch-meta.json'),
      JSON.stringify(stitchMeta, null, 2)
    );

    // Save job data
    activeJobs.set(jobId, {
      url,
      outputPath: outputDir,
      netlifyUrl,
      htmlSize: html.length,
      createdAt: new Date().toISOString()
    });

    // PASO 6: Complete
    emit('complete', '✅ Rediseño listo', 100, {
      netlifyUrl,
      outputPath: outputDir,
      htmlSize: html.length
    });

    console.log(`\n✅ Pipeline completado`);
    console.log(`   URL: ${netlifyUrl}`);

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

// POST / — start redesign job
router.post('/', async (req, res) => {
  const { url } = req.body;

  // Validate URL
  if (!url || !isValidUrl(url)) {
    return res.status(400).json({
      error: 'URL inválida. Debe comenzar con http:// o https://'
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
    message: 'Pipeline v2.0.0 iniciado. Conecta via WebSocket para actualizaciones.'
  });

  // Run pipeline in background
  setImmediate(() => {
    runPipeline(url, jobId);
  });
});

export default router;
