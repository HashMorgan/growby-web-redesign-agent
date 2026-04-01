import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { broadcast, activeJobs } from '../app.js';

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

async function runPipeline(url, jobId) {
  const clientSlug = slugify(url);
  const timestamp = new Date().toISOString().slice(0, 10);
  const outputPath = path.join(PROJECT_ROOT, 'outputs', `${clientSlug}-${timestamp}`);

  // Emit progress updates
  const emit = (step, message, progress, extra = {}) => {
    broadcast({ jobId, step, message, progress, ...extra });
  };

  try {
    emit('scraping', '🔍 Analizando sitio...', 10);

    // Run orchestrator.js
    const orchestratorPath = path.join(PROJECT_ROOT, 'scripts', 'orchestrator.js');

    const process = exec(`node "${orchestratorPath}" "${url}"`, {
      cwd: PROJECT_ROOT,
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    let buffer = '';

    process.stdout.on('data', (data) => {
      buffer += data.toString();
      console.log(data.toString());

      // Parse progress from orchestrator output
      if (buffer.includes('FASE 1: SCRAPING')) {
        emit('analysis', '🧠 Detectando industria y oportunidades...', 25);
      } else if (buffer.includes('FASE 2: ANÁLISIS')) {
        emit('ui_agent', '🎨 Generando design system...', 35);
        setTimeout(() => emit('ux_agent', '📊 Analizando conversión (CRO)...', 45), 1000);
        setTimeout(() => emit('seo_agent', '🔍 Optimizando SEO y copy...', 55), 2000);
        setTimeout(() => emit('visual_agent', '🖼️ Preparando prompts visuales...', 65), 3000);
      } else if (buffer.includes('FASE 3: GENERACIÓN')) {
        emit('generating', '⚡ Construyendo rediseño React...', 75);
      } else if (buffer.includes('Generating image')) {
        const match = buffer.match(/(\d+)\/(\d+)/);
        if (match) {
          emit('images', `🖼️ Generando imágenes IA (${match[1]}/${match[2]})...`, 85);
        }
      } else if (buffer.includes('FASE 4: DEPLOY')) {
        emit('deploying', '🚀 Publicando en Netlify...', 95);
      }
    });

    process.stderr.on('data', (data) => {
      console.error(data.toString());
    });

    process.on('exit', (code) => {
      if (code === 0) {
        // Find the Netlify URL from output
        let netlifyUrl = null;
        const urlMatch = buffer.match(/https:\/\/[a-z0-9-]+\.netlify\.app/);
        if (urlMatch) {
          netlifyUrl = urlMatch[0];
        }

        // Check if deploy-url.txt exists
        const urlFile = path.join(outputPath, 'deploy-url.txt');
        if (fs.existsSync(urlFile)) {
          netlifyUrl = fs.readFileSync(urlFile, 'utf8').trim();
        }

        // Store job data
        activeJobs.set(jobId, {
          url,
          outputPath,
          netlifyUrl,
          version: 1,
          createdAt: new Date().toISOString()
        });

        emit('complete', '✅ Rediseño listo', 100, {
          netlifyUrl: netlifyUrl || `file://${outputPath}/index.html`,
          outputPath
        });
      } else {
        emit('error', `❌ Error: El pipeline falló con código ${code}`, 0);
        activeJobs.delete(jobId);
      }
    });

  } catch (error) {
    console.error('Error en pipeline:', error);
    emit('error', `❌ Error: ${error.message}`, 0);
    activeJobs.delete(jobId);
  }
}

router.post('/', async (req, res) => {
  const { url } = req.body;

  // Validate URL
  if (!url || !isValidUrl(url)) {
    return res.status(400).json({
      error: 'URL inválida. Debe comenzar con http:// o https://'
    });
  }

  // Generate unique job ID
  const clientSlug = slugify(url);
  const timestamp = Date.now();
  const jobId = `${clientSlug}-${timestamp}`;

  // Respond immediately
  res.json({
    jobId,
    status: 'started',
    message: 'Pipeline iniciado. Conecta via WebSocket para recibir actualizaciones.'
  });

  // Run pipeline in background
  setImmediate(() => {
    runPipeline(url, jobId);
  });
});

export default router;
