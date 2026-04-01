/**
 * memory-manager.js
 * Sistema de triple memoria para growby-web-redesign-agent
 * Semántica | Episódica | Working
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEMORY_ROOT = path.join(__dirname, '..', 'memory');

const PATHS = {
  semantic: path.join(MEMORY_ROOT, 'semantic-patterns.json'),
  episodic: path.join(MEMORY_ROOT, 'episodic'),
  working:  path.join(MEMORY_ROOT, 'working'),
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readJSON(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJSON(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ─── MEMORIA SEMÁNTICA ─────────────────────────────────────────────────────

/**
 * Lee todos los patrones semánticos.
 * @returns {object} Contenido completo de semantic-patterns.json
 */
export function readSemanticPatterns() {
  const data = readJSON(PATHS.semantic);
  return data || { version: '1.1.0', last_updated: '', patterns: {} };
}

/**
 * Agrega o actualiza un patrón para una industria dada.
 * Si el patrón ya existe, promedia la confianza.
 * @param {string} industria
 * @param {string} pattern
 * @param {number} confidence  0.0 – 1.0
 * @param {string} [source]    'user_feedback' | 'base_knowledge' | 'retrospective'
 */
export function updateSemanticPattern(industria, pattern, confidence, source = 'user_feedback') {
  const data = readSemanticPatterns();

  if (!data.patterns[industria]) {
    data.patterns[industria] = [];
  }

  const existing = data.patterns[industria].find(p => p.pattern === pattern);
  if (existing) {
    // Bayesian-style update: weighted average favoring higher application count
    const total = (existing.applications || 0) + 1;
    existing.confidence = parseFloat(
      ((existing.confidence * (total - 1) + confidence) / total).toFixed(3)
    );
    existing.applications = total;
    existing.last_updated = new Date().toISOString().slice(0, 10);
    existing.source = source;
  } else {
    data.patterns[industria].push({
      pattern,
      confidence,
      applications: 1,
      source,
      created: new Date().toISOString().slice(0, 10),
    });
  }

  data.last_updated = new Date().toISOString().slice(0, 10);
  writeJSON(PATHS.semantic, data);
  return existing || data.patterns[industria].at(-1);
}

/**
 * Devuelve los N patrones más confiables de una industria.
 * @param {string} industria
 * @param {number} [n=3]
 * @returns {Array}
 */
export function getTopPatterns(industria, n = 3) {
  const data = readSemanticPatterns();
  const list = data.patterns[industria] || [];
  return [...list]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, n);
}

// ─── MEMORIA EPISÓDICA ──────────────────────────────────────────────────────

/**
 * Guarda un episodio en memory/episodic/[cliente]-[fecha].json
 * @param {object} episodeData
 * @returns {string} Ruta del archivo guardado
 */
export function saveEpisode(episodeData) {
  ensureDir(PATHS.episodic);
  const today = new Date().toISOString().slice(0, 10);
  const clienteSlug = episodeData.cliente || 'unknown';
  const id = `${clienteSlug}-${today}`;

  const episode = {
    id,
    url: episodeData.url || '',
    industria: episodeData.industria || 'unknown',
    design_system_aplicado: episodeData.design_system_aplicado || null,
    cro_score_original: episodeData.cro_score_original || null,
    copy_reescrito: episodeData.copy_reescrito || false,
    imagenes_generadas: episodeData.imagenes_generadas || 0,
    netlify_url: episodeData.netlify_url || null,
    feedback: null,
    aprendizajes: [],
    fecha: today,
    duracion_segundos: episodeData.duracion_segundos || null,
    ...episodeData,
    id, // ensure id is canonical
  };

  const filePath = path.join(PATHS.episodic, `${id}.json`);
  writeJSON(filePath, episode);
  return filePath;
}

/**
 * Lee un episodio específico por cliente slug.
 * Busca [clienteId]-*.json más reciente si hay varios.
 * @param {string} clienteId
 * @returns {object|null}
 */
export function getEpisode(clienteId) {
  ensureDir(PATHS.episodic);
  const files = fs.readdirSync(PATHS.episodic)
    .filter(f => f.startsWith(clienteId) && f.endsWith('.json'))
    .sort()
    .reverse();
  if (!files.length) return null;
  return readJSON(path.join(PATHS.episodic, files[0]));
}

/**
 * Lista todos los episodios guardados.
 * @returns {Array<object>}
 */
export function getAllEpisodes() {
  ensureDir(PATHS.episodic);
  return fs.readdirSync(PATHS.episodic)
    .filter(f => f.endsWith('.json'))
    .sort()
    .reverse()
    .map(f => readJSON(path.join(PATHS.episodic, f)))
    .filter(Boolean);
}

/**
 * Actualiza el campo feedback de un episodio existente.
 * @param {string} clienteId
 * @param {object} feedback
 * @returns {object|null} Episodio actualizado
 */
export function updateFeedback(clienteId, feedback) {
  ensureDir(PATHS.episodic);
  const files = fs.readdirSync(PATHS.episodic)
    .filter(f => f.startsWith(clienteId) && f.endsWith('.json'))
    .sort()
    .reverse();
  if (!files.length) return null;

  const filePath = path.join(PATHS.episodic, files[0]);
  const episode = readJSON(filePath);
  episode.feedback = { ...feedback, timestamp: new Date().toISOString() };
  writeJSON(filePath, episode);
  return episode;
}

// ─── WORKING MEMORY ─────────────────────────────────────────────────────────

/**
 * Crea una sesión nueva en memory/working/session-[id].json
 * @param {string} sessionId  Normalmente el clientSlug
 * @returns {string} Ruta del archivo de sesión
 */
export function startSession(sessionId) {
  ensureDir(PATHS.working);
  const session = {
    session_id: sessionId,
    started_at: new Date().toISOString(),
    status: 'active',
    steps: [],
  };
  const filePath = path.join(PATHS.working, `session-${sessionId}.json`);
  writeJSON(filePath, session);
  return filePath;
}

/**
 * Actualiza la sesión activa con datos adicionales.
 * @param {string} sessionId
 * @param {object} data  Campos a mergear en la sesión
 * @returns {object} Sesión actualizada
 */
export function updateSession(sessionId, data) {
  const filePath = path.join(PATHS.working, `session-${sessionId}.json`);
  const session = readJSON(filePath) || { session_id: sessionId };

  // Append step with timestamp
  const step = { timestamp: new Date().toISOString(), ...data };
  session.steps = session.steps || [];
  session.steps.push(step);

  // Also merge top-level fields (url, industria, etc.)
  Object.assign(session, data, { steps: session.steps });

  writeJSON(filePath, session);
  return session;
}

/**
 * Lee la sesión activa.
 * @param {string} sessionId
 * @returns {object|null}
 */
export function getSession(sessionId) {
  const filePath = path.join(PATHS.working, `session-${sessionId}.json`);
  return readJSON(filePath);
}

/**
 * Archiva la sesión en episodic/ y limpia el archivo de working/.
 * @param {string} sessionId
 * @param {object} [extraData]  Datos extra para el episodio
 * @returns {string} Ruta del episodio archivado
 */
export function endSession(sessionId, extraData = {}) {
  const session = getSession(sessionId);
  if (!session) return null;

  session.status = 'completed';
  session.ended_at = new Date().toISOString();

  // Archive to episodic
  const episodePath = saveEpisode({
    cliente: sessionId,
    ...session,
    ...extraData,
  });

  // Remove from working
  const sessionFile = path.join(PATHS.working, `session-${sessionId}.json`);
  if (fs.existsSync(sessionFile)) fs.unlinkSync(sessionFile);

  return episodePath;
}

// ─── FEEDBACK LOOP ───────────────────────────────────────────────────────────

/**
 * Procesa feedback de Kevin para un cliente y lo convierte en aprendizajes.
 * Si confidence del patrón derivado > 0.7, actualiza semantic-patterns.json.
 *
 * @param {string} clienteId
 * @param {object} feedbackData
 *   {
 *     visual_score: 1-5,
 *     cambios_sugeridos: string,
 *     copy_ok: boolean,
 *     design_system_ok: boolean
 *   }
 * @returns {object} { episode, aprendizajes, patrones_actualizados }
 */
export function processFeedback(clienteId, feedbackData) {
  const episode = updateFeedback(clienteId, feedbackData);
  if (!episode) {
    return { error: `No se encontró episodio para cliente: ${clienteId}` };
  }

  const industria = episode.industria || 'unknown';
  const score = feedbackData.visual_score || 3;
  const aprendizajes = [];
  const patrones_actualizados = [];

  // ── Regla 1: copy ──────────────────────────────────────────────────────
  if (feedbackData.copy_ok === true) {
    const confidence = 0.6 + (score / 5) * 0.3; // 0.6–0.9 según score
    const pattern = `copy_propuesta_valor_efectivo_para_${industria}`;
    aprendizajes.push({ type: 'copy', pattern, confidence });
    if (confidence > 0.7) {
      updateSemanticPattern(industria, pattern, confidence);
      patrones_actualizados.push({ pattern, confidence });
    }
  }

  // ── Regla 2: design system ─────────────────────────────────────────────
  if (feedbackData.design_system_ok === true && score >= 4) {
    const ds = episode.design_system_aplicado;
    const style = ds?.visual_style || 'modern';
    const pattern = `design_system_${style.replace(/\s+/g, '_').toLowerCase()}_positivo_en_${industria}`;
    const confidence = 0.65 + (score - 4) * 0.15; // 0.65–0.8
    aprendizajes.push({ type: 'design_system', pattern, confidence });
    if (confidence > 0.7) {
      updateSemanticPattern(industria, pattern, confidence);
      patrones_actualizados.push({ pattern, confidence });
    }
  }

  // ── Regla 3: score bajo → registrar anti-patrón ────────────────────────
  if (score <= 2 && feedbackData.cambios_sugeridos) {
    const snippet = feedbackData.cambios_sugeridos.slice(0, 60).replace(/\s+/g, '_').toLowerCase();
    const pattern = `evitar_${snippet}_en_${industria}`;
    const confidence = 0.75;
    aprendizajes.push({ type: 'anti_pattern', pattern, confidence });
    updateSemanticPattern(industria, pattern, confidence);
    patrones_actualizados.push({ pattern, confidence });
  }

  // ── Regla 4: score alto → reforzar patrón de números ──────────────────
  if (score >= 4 && industria === 'agency') {
    const pattern = 'numeros_de_impacto_above_fold_aumentan_credibilidad';
    const confidence = 0.7 + (score - 4) * 0.1;
    updateSemanticPattern(industria, pattern, confidence);
    patrones_actualizados.push({ pattern, confidence, reforzado: true });
  }

  // Save aprendizajes back to episode
  const episodeFiles = fs.readdirSync(PATHS.episodic)
    .filter(f => f.startsWith(clienteId) && f.endsWith('.json'))
    .sort().reverse();
  if (episodeFiles.length) {
    const filePath = path.join(PATHS.episodic, episodeFiles[0]);
    const ep = readJSON(filePath);
    ep.aprendizajes = aprendizajes;
    writeJSON(filePath, ep);
  }

  return { episode, aprendizajes, patrones_actualizados };
}

/**
 * Genera el bloque de comentario JSX con patrones para el generator.
 * @param {string} industria
 * @param {number} [n=3]
 * @returns {string}
 */
export function buildPatternHints(industria, n = 3) {
  const patterns = getTopPatterns(industria, n);
  if (!patterns.length) return '';
  const lines = patterns.map(p => `// - ${p.pattern} (confianza: ${p.confidence})`);
  return [
    `// 🧠 Patrones semánticos aplicados para ${industria}:`,
    ...lines,
  ].join('\n');
}
