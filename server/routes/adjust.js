import express from 'express';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { broadcast } from '../lib/broadcast.js';
import { requireAuth } from '../middleware/auth.js';

// ── Option B: re-run generator pipeline with feedback injected ──
import { planLayout } from '../../scripts/agents/layout-architect.js';
import { buildComponents } from '../../scripts/agents/component-builder.js';
import { assembleHTML } from '../../scripts/agents/assembler.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUTS_DIR = path.join(__dirname, '..', '..', 'outputs');

router.post('/', requireAuth, async (req, res) => {
  const { jobId, feedback } = req.body;

  if (!jobId || !feedback) {
    return res.status(400).json({ error: 'jobId y feedback son requeridos' });
  }

  const outputDir = path.join(OUTPUTS_DIR, jobId);
  if (!fs.existsSync(outputDir)) {
    return res.status(404).json({ error: `Output no encontrado: ${jobId}` });
  }

  // Respond immediately, then process async
  res.json({ jobId, status: 'adjusting' });

  try {
    broadcast({ jobId, step: 'adjusting', message: '🔧 Aplicando ajustes...', progress: 15 });

    // Find latest HTML version to determine next version number
    const htmlFiles = fs.readdirSync(outputDir)
      .filter(f => f.match(/^index(-v\d+)?\.html$/))
      .sort((a, b) => {
        const va = parseInt(a.match(/v(\d+)/)?.[1] || '0');
        const vb = parseInt(b.match(/v(\d+)/)?.[1] || '0');
        return vb - va;
      });

    if (htmlFiles.length === 0) throw new Error('No se encontró index.html');
    const version = (parseInt(htmlFiles[0].match(/v(\d+)/)?.[1] || '1')) + 1;

    // Read analysis.json
    const analysisPath = path.join(outputDir, 'analysis.json');
    if (!fs.existsSync(analysisPath)) throw new Error('analysis.json no encontrado en output');
    const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));

    broadcast({ jobId, step: 'adjusting', message: '📋 Analizando feedback...', progress: 25 });

    let adjustedHtml, usedMethod;

    // ── Option A: Claude API (if ANTHROPIC_API_KEY is set) ──────────────────
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        broadcast({ jobId, step: 'adjusting', message: '🤖 Claude está modificando el diseño (API)...', progress: 40 });

        const { default: Anthropic } = await import('@anthropic-ai/sdk');
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

        const latestHtmlPath = path.join(outputDir, htmlFiles[0]);
        const currentHtml = fs.readFileSync(latestHtmlPath, 'utf8');

        const response = await client.messages.create({
          model: 'claude-sonnet-4-5',
          max_tokens: 8000,
          messages: [{
            role: 'user',
            content: `Eres un experto en rediseño web. Tienes este HTML de un rediseño web y el siguiente feedback del cliente.
Modifica ÚNICAMENTE las secciones mencionadas en el feedback preservando todo el resto del código intacto.
Devuelve SOLO el HTML completo modificado, sin explicaciones, sin markdown, sin bloques de código.

FEEDBACK DEL CLIENTE:
${feedback}

HTML ACTUAL:
${currentHtml.substring(0, 50000)}`
          }]
        });

        const candidateHtml = response.content[0].text;

        if (!candidateHtml.includes('<!DOCTYPE') && !candidateHtml.includes('<html')) {
          throw new Error('Claude no devolvió HTML válido');
        }

        adjustedHtml = candidateHtml;
        usedMethod = 'claude_api';
      } catch (apiErr) {
        console.warn(`  ⚠ Claude API falló: ${apiErr.message}. Usando pipeline re-run...`);
        // Fall through to Option B
      }
    }

    // ── Option B: Re-run generator pipeline with feedback injected ───────────
    if (!adjustedHtml) {
      broadcast({ jobId, step: 'adjusting', message: '🔄 Re-generando diseño con feedback...', progress: 40 });

      // Inject feedback as adjustment instructions into the analysis
      const analysisWithFeedback = {
        ...analysis,
        adjustment_feedback: feedback,
        // Append feedback hint to copy analysis so layout/components can reference it
        seo_copy_analysis: {
          ...(analysis.seo_copy_analysis || {}),
          adjustment_instructions: feedback,
        },
      };

      broadcast({ jobId, step: 'adjusting', message: '📐 Recalculando layout...', progress: 55 });
      const layoutPlan = planLayout(analysisWithFeedback);

      broadcast({ jobId, step: 'adjusting', message: '🧱 Reconstruyendo componentes...', progress: 70 });
      const components = buildComponents(layoutPlan, analysisWithFeedback);

      broadcast({ jobId, step: 'adjusting', message: '🔗 Ensamblando HTML...', progress: 82 });
      const newFilename = `index-v${version}.html`;
      const { htmlPath } = await assembleHTML(
        components,
        layoutPlan,
        analysisWithFeedback,
        outputDir,
        newFilename
      );

      adjustedHtml = fs.readFileSync(htmlPath, 'utf8');
      usedMethod = 'pipeline_rerun';
    }

    // Save versioned file and overwrite index.html
    const newHtmlFile = `index-v${version}.html`;
    const newHtmlPath = path.join(outputDir, newHtmlFile);
    if (usedMethod === 'claude_api') {
      // Option A wrote its own HTML — save it
      fs.writeFileSync(newHtmlPath, adjustedHtml);
    }
    // Always keep index.html up to date
    fs.writeFileSync(path.join(outputDir, 'index.html'), adjustedHtml);

    // Log feedback
    const logPath = path.join(outputDir, 'feedback-log.json');
    const log = fs.existsSync(logPath) ? JSON.parse(fs.readFileSync(logPath, 'utf8')) : [];
    log.push({
      version,
      feedback,
      timestamp: new Date().toISOString(),
      method: usedMethod,
    });
    fs.writeFileSync(logPath, JSON.stringify(log, null, 2));

    broadcast({ jobId, step: 'adjusting', message: '🚀 Publicando versión ajustada en Netlify...', progress: 88 });

    // Re-deploy to Netlify
    let netlifyUrl = `/preview/${jobId}/index.html`;
    if (process.env.NETLIFY_AUTH_TOKEN) {
      try {
        const siteName = `growby-${jobId.replace(/-\d{4}-\d{2}-\d{2}$/, '')}`;
        const deployOut = execSync(
          `npx netlify-cli deploy --dir="${outputDir}" --prod --site-name="${siteName}" 2>&1`,
          { encoding: 'utf8', env: { ...process.env }, timeout: 60000 }
        );
        const urlMatch = deployOut.match(/https:\/\/[^\s]+\.netlify\.app/);
        if (urlMatch) netlifyUrl = urlMatch[0];
      } catch (deployErr) {
        console.warn('  ⚠ Netlify deploy falló, usando preview local:', deployErr.message.slice(0, 100));
      }
    }

    broadcast({
      jobId,
      step: 'adjusted',
      message: `✅ Versión ${version} lista (método: ${usedMethod})`,
      progress: 100,
      netlifyUrl,
      version,
    });

  } catch (err) {
    console.error('Error en adjust:', err.message);
    broadcast({ jobId, step: 'error', message: `❌ Error al ajustar: ${err.message}`, progress: 0 });
  }
});

export default router;
