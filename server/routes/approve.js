import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { activeJobs } from '../app.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..', '..');

// Dynamic import of memory-manager
let memoryManager;
async function getMemoryManager() {
  if (!memoryManager) {
    memoryManager = await import(path.join(PROJECT_ROOT, 'scripts', 'memory-manager.js'));
  }
  return memoryManager;
}

router.post('/', async (req, res) => {
  const { jobId, score, feedback } = req.body;

  if (!jobId) {
    return res.status(400).json({
      error: 'jobId es requerido'
    });
  }

  if (score === undefined || score < 1 || score > 5) {
    return res.status(400).json({
      error: 'score debe estar entre 1 y 5'
    });
  }

  // Get job data
  const jobData = activeJobs.get(jobId);
  if (!jobData) {
    return res.status(404).json({
      error: 'Job no encontrado. Debe generar un rediseño primero.'
    });
  }

  try {
    // Extract client slug from jobId (format: clientslug-timestamp)
    const clientSlug = jobId.split('-').slice(0, -1).join('-');

    // Load memory manager
    const mm = await getMemoryManager();

    // Prepare feedback data
    const feedbackData = {
      visual_score: score,
      cambios_sugeridos: feedback || null,
      copy_ok: score >= 4,
      design_system_ok: score >= 4
    };

    // Update feedback in episodic memory
    const result = mm.processFeedback(clientSlug, feedbackData);

    if (result.error) {
      return res.status(500).json({
        error: result.error
      });
    }

    // Count patterns updated
    const patternsUpdated = result.patrones_actualizados?.length || 0;

    res.json({
      success: true,
      patternsUpdated,
      aprendizajes: result.aprendizajes || [],
      message: patternsUpdated > 0
        ? `✅ Aprendizaje guardado. ${patternsUpdated} patrón(es) actualizado(s).`
        : '✅ Feedback guardado en memoria episódica.'
    });

  } catch (error) {
    console.error('Error en approve:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

export default router;
