/**
 * stitch-generator.js
 *
 * Integración con Stitch MCP para generación de diseños.
 * Timeout de 30s — si falla → throw error para activar fallback.
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { StitchToolClient } from '@google/stitch-sdk';

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

  // Leer API key desde .mcp.json
  const mcpConfigPath = path.join(process.cwd(), '.mcp.json');
  let apiKey;

  try {
    const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
    apiKey = mcpConfig.mcpServers?.stitch?.headers?.['X-Goog-Api-Key'];

    if (!apiKey) {
      throw new Error('Stitch API key not found in .mcp.json');
    }
  } catch (error) {
    console.error(`   ❌ Error reading .mcp.json: ${error.message}`);
    throw new Error('Stitch API key not configured - using fallback generator');
  }

  let client;

  try {
    // Usar timeout con Promise.race
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Stitch timeout after ${timeout}ms`)), timeout)
    );

    const generatePromise = (async () => {
      console.log('   📡 Calling Stitch SDK...');

      // Inicializar cliente con API key
      client = new StitchToolClient({ apiKey });

      // Generar screen usando tool client
      const result = await client.callTool('generate_screen_from_text', {
        prompt: brief,
        projectId: projectId,
        deviceType: deviceType,
        modelId: modelId,
      });

      // El resultado debería contener el HTML o el screen ID
      // Necesitamos obtener el HTML del screen generado
      if (!result || !result.screenId) {
        throw new Error('Stitch returned invalid response');
      }

      // Obtener HTML del screen
      const htmlResult = await client.callTool('get_html', {
        screenId: result.screenId,
        projectId: projectId,
      });

      const html = htmlResult.html || htmlResult.content || JSON.stringify(htmlResult);

      console.log('✅ Stitch generation successful');
      console.log(`   HTML size: ${(html.length / 1024).toFixed(1)} KB`);

      return html;
    })();

    // Race entre generación y timeout
    const html = await Promise.race([generatePromise, timeoutPromise]);

    return html;

  } catch (error) {
    throw error;
  } finally {
    // Cerrar cliente si fue inicializado
    if (client) {
      await client.close().catch(() => {});
    }
  }
}

/**
 * Extrae el HTML del response de Stitch
 * @param {*} outputComponents - Response de Stitch
 * @returns {string} HTML extraído
 */
function extractHTML(outputComponents) {
  // Caso 1: String directo
  if (typeof outputComponents === 'string') {
    return outputComponents;
  }

  // Caso 2: Objeto con propiedad html
  if (outputComponents.html) {
    return outputComponents.html;
  }

  // Caso 3: Objeto con propiedad code
  if (outputComponents.code) {
    return outputComponents.code;
  }

  // Caso 4: Array de componentes (combinar)
  if (Array.isArray(outputComponents)) {
    return outputComponents
      .map(comp => {
        if (typeof comp === 'string') return comp;
        if (comp.html) return comp.html;
        if (comp.code) return comp.code;
        return '';
      })
      .join('\n');
  }

  // Caso 5: Objeto con estructura compleja - intentar serializar
  if (typeof outputComponents === 'object') {
    console.warn('   ⚠️  Unexpected Stitch response format, attempting to extract...');
    console.log(JSON.stringify(outputComponents, null, 2));

    // Si tiene alguna propiedad que parezca HTML
    for (const key of Object.keys(outputComponents)) {
      const value = outputComponents[key];
      if (typeof value === 'string' && value.includes('<html')) {
        return value;
      }
    }
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
