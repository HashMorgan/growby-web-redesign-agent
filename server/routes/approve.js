import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..', '..');
const OUTPUTS_DIR = path.join(PROJECT_ROOT, 'outputs');
const EPISODIC_DIR = path.join(PROJECT_ROOT, 'memory', 'episodic');

// Dynamic import of memory-manager (optional)
let memoryManager;
async function getMemoryManager() {
  if (!memoryManager) {
    try {
      memoryManager = await import(path.join(PROJECT_ROOT, 'scripts', 'memory-manager.js'));
    } catch { memoryManager = null; }
  }
  return memoryManager;
}

router.post('/', requireAuth, async (req, res) => {
  const { jobId, score, feedback } = req.body;

  if (!jobId || !score) {
    return res.status(400).json({ error: 'jobId y score son requeridos' });
  }

  const scoreNum = parseInt(score);
  if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 5) {
    return res.status(400).json({ error: 'score debe estar entre 1 y 5' });
  }

  // Verify output exists — no activeJobs dependency (survives server restart)
  const outputDir = path.join(OUTPUTS_DIR, jobId);
  if (!fs.existsSync(outputDir)) {
    return res.status(404).json({ error: `Output no encontrado: ${jobId}` });
  }

  try {
    // Save approval directly to output folder
    const approval = {
      jobId,
      score: scoreNum,
      feedback: feedback || null,
      approved: true,
      approved_at: new Date().toISOString()
    };
    fs.writeFileSync(path.join(outputDir, 'approval.json'), JSON.stringify(approval, null, 2));

    // Save to episodic memory
    if (!fs.existsSync(EPISODIC_DIR)) fs.mkdirSync(EPISODIC_DIR, { recursive: true });
    const episodicPath = path.join(EPISODIC_DIR, `${jobId}.json`);
    const episodic = fs.existsSync(episodicPath)
      ? JSON.parse(fs.readFileSync(episodicPath, 'utf8'))
      : { jobId, created_at: new Date().toISOString() };
    episodic.feedback = { score: scoreNum, feedback: feedback || null, approved_at: approval.approved_at };
    fs.writeFileSync(episodicPath, JSON.stringify(episodic, null, 2));

    // Try memory-manager for semantic pattern updates (non-critical)
    let patternsUpdated = 0;
    const mm = await getMemoryManager();
    if (mm) {
      try {
        const clientSlug = jobId.replace(/-\d{4}-\d{2}-\d{2}$/, '');
        const result = mm.processFeedback(clientSlug, {
          visual_score: scoreNum,
          cambios_sugeridos: feedback || null,
          copy_ok: scoreNum >= 4,
          design_system_ok: scoreNum >= 4
        });
        patternsUpdated = result?.patrones_actualizados?.length || 0;
      } catch { /* non-critical */ }
    }

    res.json({
      success: true,
      patternsUpdated,
      message: patternsUpdated > 0
        ? `🧠 Aprendizaje guardado. ${patternsUpdated} patrón(es) actualizado(s).`
        : '🧠 Feedback guardado en memoria episódica.'
    });

  } catch (error) {
    console.error('Error en approve:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
