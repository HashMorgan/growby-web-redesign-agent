/**
 * adjust.js — v2.0.0 simplified
 * Solo usa Claude API para ajustes
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { broadcast } from '../lib/broadcast.js';
import { requireAuth } from '../middleware/auth.js';

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

  // Load Stitch metadata
  const stitchMetaPath = path.join(outputDir, 'stitch-meta.json');
  let stitchMeta = null;
  if (fs.existsSync(stitchMetaPath)) {
    stitchMeta = JSON.parse(fs.readFileSync(stitchMetaPath, 'utf8'));
  }

  // Respond immediately
  res.json({ jobId, status: 'adjusting' });

  try {
    broadcast({ jobId, step: 'adjusting', message: '🔧 Aplicando ajustes...', progress: 15 });

    // Find latest HTML
    const htmlFiles = fs.readdirSync(outputDir)
      .filter(f => f.match(/^index(-v\d+)?\.html$/))
      .sort((a, b) => {
        const va = parseInt(a.match(/v(\d+)/)?.[1] || '0');
        const vb = parseInt(b.match(/v(\d+)/)?.[1] || '0');
        return vb - va;
      });

    if (htmlFiles.length === 0) {
      throw new Error('No se encontró index.html');
    }

    const version = (parseInt(htmlFiles[0].match(/v(\d+)/)?.[1] || '1')) + 1;

    let adjustedHtml;

    // OPCIÓN A: Usar el mismo proyecto de Stitch (preferido)
    if (stitchMeta && stitchMeta.projectId && process.env.STITCH_API_KEY) {
      broadcast({ jobId, step: 'adjusting', message: '🎨 Ajustando con Stitch AI...', progress: 40 });

      const { StitchToolClient } = await import('@google/stitch-sdk');
      const client = new StitchToolClient({
        apiKey: process.env.STITCH_API_KEY,
        timeout: 120000
      });

      try {
        // Prompt de ajuste basado en feedback del usuario
        const adjustPrompt = `${stitchMeta.url} — Ajuste: ${feedback}`;

        const screenResult = await client.callTool('generate_screen_from_text', {
          projectId: stitchMeta.projectId,
          prompt: adjustPrompt,
          deviceType: 'DESKTOP'
        });

        // Extraer HTML del resultado
        broadcast({ jobId, step: 'adjusting', message: '📥 Extrayendo HTML...', progress: 70 });

        if (screenResult.outputComponents && Array.isArray(screenResult.outputComponents)) {
          for (const component of screenResult.outputComponents) {
            if (component.design?.screens) {
              for (const screen of component.design.screens) {
                if (screen.htmlCode?.downloadUrl) {
                  const htmlResponse = await fetch(screen.htmlCode.downloadUrl);
                  if (htmlResponse.ok) {
                    adjustedHtml = await htmlResponse.text();
                    break;
                  }
                }
              }
            }
            if (adjustedHtml) break;
          }
        }

        await client.close();

        if (!adjustedHtml) {
          throw new Error('Stitch no retornó HTML en el ajuste');
        }

      } catch (stitchErr) {
        console.warn('⚠️ Stitch adjust falló, usando fallback Claude API:', stitchErr.message);
        // Fallback a Claude API
        stitchMeta = null; // Para que use la opción B abajo
      }
    }

    // OPCIÓN B: Fallback con Claude API
    if (!adjustedHtml) {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY not configured - ajustes requieren Claude API o Stitch');
      }

      broadcast({ jobId, step: 'adjusting', message: '🤖 Claude modificando el diseño...', progress: 40 });

      const latestHtmlPath = path.join(outputDir, htmlFiles[0]);
      const currentHtml = fs.readFileSync(latestHtmlPath, 'utf8');

      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

      adjustedHtml = response.content[0].text;

      if (!adjustedHtml.includes('<!DOCTYPE') && !adjustedHtml.includes('<html')) {
        throw new Error('Claude no devolvió HTML válido');
      }
    }

    // Save versioned file
    const newHtmlFile = `index-v${version}.html`;
    const newHtmlPath = path.join(outputDir, newHtmlFile);
    fs.writeFileSync(newHtmlPath, adjustedHtml);
    fs.writeFileSync(path.join(outputDir, 'index.html'), adjustedHtml);

    // Log feedback
    const logPath = path.join(outputDir, 'feedback-log.json');
    const log = fs.existsSync(logPath) ? JSON.parse(fs.readFileSync(logPath, 'utf8')) : [];
    log.push({
      version,
      feedback,
      timestamp: new Date().toISOString(),
      method: 'claude_api',
    });
    fs.writeFileSync(logPath, JSON.stringify(log, null, 2));

    broadcast({ jobId, step: 'adjusting', message: '🚀 Publicando versión ajustada...', progress: 88 });

    // Re-deploy to Netlify (usa el mismo siteName si existe)
    let netlifyUrl = `/preview/${jobId}/index.html`;
    if (process.env.NETLIFY_AUTH_TOKEN) {
      try {
        const siteName = stitchMeta?.siteName || `growby-${jobId.replace(/-\d{13}$/, '')}`;
        const deployOut = execSync(
          `npx netlify-cli deploy --dir="${outputDir}" --prod --site-name="${siteName}" 2>&1`,
          { encoding: 'utf8', env: { ...process.env }, timeout: 60000 }
        );
        const urlMatch = deployOut.match(/https:\/\/[^\s]+\.netlify\.app/);
        if (urlMatch) netlifyUrl = urlMatch[0];
      } catch (deployErr) {
        console.warn('Netlify deploy failed:', deployErr.message.slice(0, 100));
      }
    }

    broadcast({
      jobId,
      step: 'adjusted',
      message: `✅ Versión ${version} lista`,
      progress: 100,
      netlifyUrl,
      version,
    });

  } catch (err) {
    console.error('Error en adjust:', err.message);
    broadcast({ jobId, step: 'error', message: `❌ Error: ${err.message}`, progress: 0 });
  }
});

export default router;
