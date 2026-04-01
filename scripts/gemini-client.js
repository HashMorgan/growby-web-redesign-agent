import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');
const RATE_LIMIT_DELAY_MS = 4200; // 4.2s → stays under 15 req/min on free tier

/**
 * Generate a single image via Gemini API
 * @param {string} prompt
 * @param {string} aspectRatio  e.g. "16:9" or "4:3"
 * @returns {string|null}  base64 JPEG string, or null on failure
 */
export async function generateImage(prompt, aspectRatio = '16:9') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('    ⚠ GEMINI_API_KEY not set — using placeholder');
    return null;
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;

  const body = {
    instances: [{ prompt }],
    parameters: {
      sampleCount: 1,
      aspectRatio: aspectRatio === '16:9' ? '16:9' : '4:3',
    },
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      // Fallback to gemini-2.0-flash-exp if imagen not available
      if (res.status === 404 || res.status === 400) {
        return await generateImageFlash(prompt, aspectRatio, apiKey);
      }
      throw new Error(`HTTP ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    const b64 = data?.predictions?.[0]?.bytesBase64Encoded;
    if (!b64) throw new Error('No image data in response');
    return b64;

  } catch (err) {
    console.warn(`    ⚠ Imagen API failed (${err.message.slice(0,80)}) — trying flash fallback`);
    try {
      return await generateImageFlash(prompt, aspectRatio, apiKey);
    } catch (err2) {
      console.warn(`    ⚠ Flash fallback also failed: ${err2.message.slice(0,80)}`);
      return null;
    }
  }
}

async function generateImageFlash(prompt, aspectRatio, apiKey) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

  const body = {
    contents: [{
      parts: [{ text: `Generate an image: ${prompt}. Return ONLY the image, no text.` }],
    }],
    generationConfig: { responseModalities: ['IMAGE'] },
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HTTP ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.mimeType?.startsWith('image/')) {
      return part.inlineData.data;
    }
  }
  throw new Error('No inline image in flash response');
}

/**
 * Generate all images sequentially with rate limiting
 * @param {Array} imagePrompts  array from visual-agent output
 * @param {string} cacheTimestamp  timestamp for cache file naming
 * @returns {Object}  { section_name: base64string|null }
 */
export async function generateAllImages(imagePrompts, cacheTimestamp) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('  ⚠ GEMINI_API_KEY no configurada — todas las imágenes usarán placeholders de gradiente');
    return Object.fromEntries(imagePrompts.map(p => [p.section, null]));
  }

  const cachePath = path.join(
    PROJECT_ROOT, 'memory', 'working',
    `images-cache-${cacheTimestamp || Date.now()}.json`
  );

  // Load existing cache if present
  let cache = {};
  if (fs.existsSync(cachePath)) {
    try {
      cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      console.log(`  📦 Cache de imágenes cargado (${Object.keys(cache).length} imágenes previas)`);
    } catch { cache = {}; }
  }

  const results = { ...cache };
  const total = imagePrompts.length;

  for (let i = 0; i < imagePrompts.length; i++) {
    const { section, prompt, aspect_ratio } = imagePrompts[i];

    if (results[section]) {
      console.log(`  ⏭ [${i+1}/${total}] ${section} — desde cache`);
      continue;
    }

    console.log(`  🖼️  [${i+1}/${total}] Generando: ${section}...`);

    const b64 = await generateImage(prompt, aspect_ratio || '16:9');
    results[section] = b64;

    if (b64) {
      console.log(`  ✓ ${section} OK (${Math.round(b64.length / 1024)}KB b64)`);
    } else {
      console.log(`  ~ ${section} → placeholder (null)`);
    }

    // Save progress after each image
    fs.writeFileSync(cachePath, JSON.stringify(results, null, 2));

    // Rate limiting: wait between calls (skip after last)
    if (i < imagePrompts.length - 1) {
      await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY_MS));
    }
  }

  console.log(`  💾 Cache guardado: memory/working/${path.basename(cachePath)}`);
  return results;
}
