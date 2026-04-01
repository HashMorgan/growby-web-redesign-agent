import express from 'express';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import { broadcast } from '../app.js';
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

  // Respond immediately, then process async
  res.json({ jobId, status: 'adjusting' });

  try {
    broadcast({ jobId, step: 'adjusting', message: '🔧 Aplicando ajustes con IA...', progress: 20 });

    // Find latest HTML version
    const htmlFiles = fs.readdirSync(outputDir)
      .filter(f => f.match(/^index(-v\d+)?\.html$/))
      .sort((a, b) => {
        const va = parseInt(a.match(/v(\d+)/)?.[1] || '0');
        const vb = parseInt(b.match(/v(\d+)/)?.[1] || '0');
        return vb - va;
      });

    if (htmlFiles.length === 0) throw new Error('No se encontró index.html');

    const latestHtmlPath = path.join(outputDir, htmlFiles[0]);
    const currentHtml = fs.readFileSync(latestHtmlPath, 'utf8');
    const version = (parseInt(htmlFiles[0].match(/v(\d+)/)?.[1] || '1')) + 1;

    broadcast({ jobId, step: 'adjusting', message: '🤖 Claude está modificando el diseño...', progress: 40 });

    let adjustedHtml;

    if (process.env.ANTHROPIC_API_KEY) {
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
    } else {
      // Fallback sin API key: registrar feedback como nota visible
      const note = `\n<style>.feedback-note{position:fixed;bottom:16px;right:16px;background:#5D55D7;color:#fff;padding:12px 20px;border-radius:8px;font-size:0.875rem;max-width:300px;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,0.2)}</style>\n<div class="feedback-note">⚙️ Ajuste pendiente: ${feedback}</div>`;
      adjustedHtml = currentHtml.replace('</body>', `${note}\n</body>`);
      broadcast({ jobId, step: 'adjusting', message: '⚠️ Sin ANTHROPIC_API_KEY — feedback registrado como nota', progress: 60 });
    }

    // Save new version
    const newHtmlFile = `index-v${version}.html`;
    const newHtmlPath = path.join(outputDir, newHtmlFile);
    fs.writeFileSync(newHtmlPath, adjustedHtml);
    fs.writeFileSync(path.join(outputDir, 'index.html'), adjustedHtml);

    // Log feedback
    const logPath = path.join(outputDir, 'feedback-log.json');
    const log = fs.existsSync(logPath) ? JSON.parse(fs.readFileSync(logPath, 'utf8')) : [];
    log.push({ version, feedback, timestamp: new Date().toISOString(), model: process.env.ANTHROPIC_API_KEY ? 'claude-sonnet-4-5' : 'none' });
    fs.writeFileSync(logPath, JSON.stringify(log, null, 2));

    broadcast({ jobId, step: 'adjusting', message: '🚀 Publicando versión ajustada en Netlify...', progress: 75 });

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

    broadcast({ jobId, step: 'adjusted', message: `✅ Versión ${version} lista`, progress: 100, netlifyUrl, version });

  } catch (err) {
    console.error('Error en adjust:', err.message);
    broadcast({ jobId, step: 'error', message: `❌ Error al ajustar: ${err.message}`, progress: 0 });
  }
});

export default router;
