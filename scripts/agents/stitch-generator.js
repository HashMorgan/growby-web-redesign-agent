/**
 * stitch-generator.js
 *
 * Integración con Stitch MCP para generación de diseños.
 * Timeout de 30s — si falla → throw error para activar fallback.
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';

/**
 * Genera un diseño completo usando Stitch MCP
 *
 * @param {string} brief - Brief optimizado de brief-generator
 * @param {object} metadata - Metadata adicional del análisis
 * @param {object} options - Opciones de generación
 * @returns {Promise<string>} HTML generado por Stitch
 * @throws {Error} Si Stitch falla o hace timeout
 */
export async function generateWithStitch(brief, metadata = {}, options = {}) {
  const {
    projectId = '9889776658400342226', // Project ID creado anteriormente
    deviceType = 'DESKTOP',
    modelId = 'GEMINI_3_FLASH',
    timeout = 30000, // 30 segundos
  } = options;

  console.log('\n🎨 Stitch Generator');
  console.log(`   Brief: ${brief.slice(0, 100)}...`);
  console.log(`   Device: ${deviceType}`);
  console.log(`   Model: ${modelId}`);
  console.log(`   Timeout: ${timeout}ms`);

  // TODO: Esta función debe ser llamada a través del MCP de Claude Code
  // Por ahora, lanzamos un error para simular el comportamiento de timeout/fallo
  // En producción, esta función haría la llamada real al MCP de Stitch

  throw new Error('Stitch MCP integration pending - using fallback generator');

  /*
  NOTA PARA IMPLEMENTACIÓN FUTURA:

  El código real sería algo así:

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Llamada al MCP de Stitch (a través de Claude Code)
    const response = await mcp_stitch_generate_screen_from_text({
      projectId,
      deviceType,
      modelId,
      prompt: brief,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response || !response.output_components) {
      throw new Error('Stitch returned empty response');
    }

    // Extraer HTML del response
    const html = extractHTML(response.output_components);

    console.log('✅ Stitch generation successful');
    console.log(`   HTML size: ${(html.length / 1024).toFixed(1)} KB`);

    return html;

  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Stitch timeout after ${timeout}ms`);
    }
    throw error;
  }
  */
}

/**
 * Extrae el HTML del response de Stitch
 * @param {*} outputComponents - Response de Stitch
 * @returns {string} HTML extraído
 */
function extractHTML(outputComponents) {
  // TODO: Implementar extracción real según formato de Stitch
  if (typeof outputComponents === 'string') {
    return outputComponents;
  }

  if (outputComponents.html) {
    return outputComponents.html;
  }

  throw new Error('Unable to extract HTML from Stitch response');
}

/**
 * Guarda el output de Stitch en el directorio de salida
 *
 * @param {string} html - HTML generado por Stitch
 * @param {string} outputDir - Directorio de salida
 * @param {object} metadata - Metadata del diseño
 */
export function saveStitchOutput(html, outputDir, metadata = {}) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const htmlPath = path.join(outputDir, 'stitch-output.html');
  fs.writeFileSync(htmlPath, html, 'utf8');

  const metadataPath = path.join(outputDir, 'stitch-metadata.json');
  fs.writeFileSync(
    metadataPath,
    JSON.stringify({
      generated_at: new Date().toISOString(),
      generator: 'stitch-mcp',
      ...metadata
    }, null, 2),
    'utf8'
  );

  console.log(`   Saved: ${htmlPath}`);
  console.log(`   Saved: ${metadataPath}`);

  return htmlPath;
}
