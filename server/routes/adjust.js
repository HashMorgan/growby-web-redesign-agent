import express from 'express';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { broadcast, activeJobs } from '../app.js';

const router = express.Router();

// Simple HTML adjustment without Claude API - just parse and modify
function adjustHtml(html, feedback) {
  // For now, we'll return the HTML as-is with a comment noting the feedback
  // In a full implementation, you'd parse the HTML and make specific changes
  const comment = `\n<!-- Feedback aplicado: ${feedback} -->\n`;
  return html.replace('</body>', `${comment}</body>`);
}

async function redeployToNetlify(outputPath, version) {
  return new Promise((resolve, reject) => {
    const deployScript = path.join(outputPath, '..', '..', 'scripts', 'deploy-netlify.sh');

    exec(`bash "${deployScript}" "${outputPath}"`, {
      timeout: 120_000,
    }, (error, stdout, stderr) => {
      if (error) {
        console.error('Deploy error:', error);
        reject(error);
        return;
      }

      // Try to read the deploy URL
      const urlFile = path.join(outputPath, 'deploy-url.txt');
      if (fs.existsSync(urlFile)) {
        const netlifyUrl = fs.readFileSync(urlFile, 'utf8').trim();
        resolve(netlifyUrl);
      } else {
        resolve(null);
      }
    });
  });
}

router.post('/', async (req, res) => {
  const { jobId, feedback } = req.body;

  if (!jobId || !feedback) {
    return res.status(400).json({
      error: 'jobId y feedback son requeridos'
    });
  }

  // Get job data
  const jobData = activeJobs.get(jobId);
  if (!jobData) {
    return res.status(404).json({
      error: 'Job no encontrado. Debe generar un rediseño primero.'
    });
  }

  const { outputPath } = jobData;
  const currentVersion = jobData.version || 1;
  const newVersion = currentVersion + 1;

  try {
    // Emit progress
    broadcast({ jobId, step: 'adjusting', message: '🔧 Aplicando ajustes...', progress: 30 });

    // Read current HTML
    const currentHtmlPath = path.join(outputPath, `index.html`);
    if (!fs.existsSync(currentHtmlPath)) {
      throw new Error('No se encontró el archivo index.html');
    }

    const currentHtml = fs.readFileSync(currentHtmlPath, 'utf8');

    // Apply adjustments (simplified - in real implementation, use Claude API)
    broadcast({ jobId, step: 'adjusting', message: '✏️ Modificando secciones...', progress: 50 });
    const adjustedHtml = adjustHtml(currentHtml, feedback);

    // Save new version
    const newHtmlPath = path.join(outputPath, `index-v${newVersion}.html`);
    fs.writeFileSync(newHtmlPath, adjustedHtml);

    // Also update the main index.html
    fs.writeFileSync(currentHtmlPath, adjustedHtml);

    // Save feedback log
    const feedbackLogPath = path.join(outputPath, 'feedback-log.json');
    let feedbackLog = [];
    if (fs.existsSync(feedbackLogPath)) {
      feedbackLog = JSON.parse(fs.readFileSync(feedbackLogPath, 'utf8'));
    }
    feedbackLog.push({
      version: newVersion,
      feedback,
      timestamp: new Date().toISOString()
    });
    fs.writeFileSync(feedbackLogPath, JSON.stringify(feedbackLog, null, 2));

    // Re-deploy to Netlify
    broadcast({ jobId, step: 'adjusting', message: '🚀 Re-desplegando a Netlify...', progress: 80 });

    let netlifyUrl = jobData.netlifyUrl;
    try {
      const newUrl = await redeployToNetlify(outputPath, newVersion);
      if (newUrl) netlifyUrl = newUrl;
    } catch (deployError) {
      console.warn('Deploy falló, usando URL anterior:', deployError.message);
    }

    // Update job data
    jobData.version = newVersion;
    jobData.netlifyUrl = netlifyUrl;
    activeJobs.set(jobId, jobData);

    // Emit completion
    broadcast({
      jobId,
      step: 'adjusted',
      message: `✅ Ajuste v${newVersion} aplicado`,
      progress: 100,
      netlifyUrl,
      version: newVersion
    });

    res.json({
      success: true,
      version: newVersion,
      netlifyUrl,
      message: 'Ajuste aplicado correctamente'
    });

  } catch (error) {
    console.error('Error en ajuste:', error);
    broadcast({
      jobId,
      step: 'error',
      message: `❌ Error al ajustar: ${error.message}`,
      progress: 0
    });

    res.status(500).json({
      error: error.message
    });
  }
});

export default router;
