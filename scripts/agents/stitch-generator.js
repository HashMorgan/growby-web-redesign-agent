/**
 * stitch-generator.js
 *
 * Integración con Stitch MCP para generación de diseños.
 * Timeout de 300s — si falla → throw error para activar fallback.
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
    projectId = null, // Se creará uno nuevo si no se provee
    deviceType = 'DESKTOP',
    modelId = 'GEMINI_3_FLASH',
    timeout = 300000, // 5 minutos
  } = options;

  console.log('\n🎨 Stitch Generator');
  console.log(`   Brief: ${brief.slice(0, 100)}...`);
  console.log(`   Device: ${deviceType}`);
  console.log(`   Model: ${modelId}`);
  console.log(`   Timeout: ${timeout}ms`);

  // Verificar API key
  const apiKey = process.env.STITCH_API_KEY;
  if (!apiKey) {
    throw new Error('STITCH_API_KEY not found in environment - using fallback generator');
  }

  let client;

  try {
    // Inicializar cliente con timeout
    console.log('   📡 Initializing Stitch SDK...');
    client = new StitchToolClient({
      apiKey,
      timeout
    });

    // Usar timeout con Promise.race
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Stitch timeout after ${timeout}ms`)), timeout)
    );

    const generatePromise = (async () => {
      // PASO 1: Crear proyecto si no existe
      let actualProjectId = projectId;

      if (!actualProjectId) {
        console.log('   🔨 Creating Stitch project...');
        const projectResult = await client.callTool('create_project', {
          title: `${metadata.company || 'Web'} Landing Page`
        });
        // Extraer ID del name (formato: "projects/123")
        actualProjectId = projectResult.name.split('/')[1];
        console.log(`   ✅ Project created: ${actualProjectId}`);
      } else {
        console.log(`   📁 Using existing project: ${actualProjectId}`);
      }

      // PASO 2: Generar screen con el brief
      console.log('   🎨 Generating screen from text...');
      const screenResult = await client.callTool('generate_screen_from_text', {
        projectId: actualProjectId,
        prompt: brief,
        deviceType,
        modelId,
      });

      if (!screenResult) {
        throw new Error('Stitch returned null/undefined result');
      }

      console.log('   ✅ Screen generated successfully');
      console.log('   📊 Response keys:', Object.keys(screenResult).join(', '));

      // PASO 3: Extraer HTML del resultado
      // Stitch devuelve el HTML directamente en outputComponents
      const html = extractHTMLFromScreen(screenResult);

      if (!html || html.length < 100) {
        throw new Error('Stitch returned empty or invalid HTML');
      }

      console.log('   ✅ Stitch generation successful');
      console.log(`   HTML size: ${(html.length / 1024).toFixed(1)} KB`);

      return { html, projectId: actualProjectId, sessionId: screenResult.sessionId };
    })();

    // Race entre generación y timeout
    const result = await Promise.race([generatePromise, timeoutPromise]);

    return result.html;

  } catch (error) {
    console.error(`   ❌ Stitch error: ${error.message}`);
    throw error;
  } finally {
    // Cerrar cliente si fue inicializado
    if (client) {
      await client.close().catch(() => {});
    }
  }
}

/**
 * Extrae HTML del objeto screen de Stitch
 * @param {object} screen - Screen object de Stitch (puede ser el resultado de generate_screen_from_text)
 * @returns {string} HTML extraído
 */
function extractHTMLFromScreen(screen) {
  // Caso 1: outputComponents array (formato de generate_screen_from_text)
  if (Array.isArray(screen.outputComponents)) {
    console.log(`   📦 Found ${screen.outputComponents.length} output components`);

    // Intentar extraer código HTML de los componentes
    let htmlParts = [];

    for (const component of screen.outputComponents) {
      // Cada componente puede tener diferentes estructuras
      if (typeof component === 'string') {
        htmlParts.push(component);
      } else if (component.code) {
        htmlParts.push(component.code);
      } else if (component.html) {
        htmlParts.push(component.html);
      } else if (component.content) {
        htmlParts.push(typeof component.content === 'string' ? component.content : JSON.stringify(component.content));
      }
    }

    if (htmlParts.length > 0) {
      const combinedHtml = htmlParts.join('\n\n');
      console.log(`   ✅ Extracted HTML from ${htmlParts.length} components`);
      return combinedHtml;
    }
  }

  // Caso 2: HTML directo en propiedad html
  if (screen.html) {
    return screen.html;
  }

  // Caso 3: HTML en code property
  if (screen.code) {
    return screen.code;
  }

  // Caso 4: outputComponents como string
  if (screen.outputComponents && typeof screen.outputComponents === 'string') {
    return screen.outputComponents;
  }

  // Caso 5: HTML en content
  if (screen.content) {
    if (typeof screen.content === 'string') {
      return screen.content;
    }
    if (screen.content.html) {
      return screen.content.html;
    }
  }

  // Caso 6: Estructura desconocida - intentar buscar HTML en propiedades
  console.warn('   ⚠️  Unexpected screen format, attempting to extract HTML...');
  console.log('   Screen keys:', Object.keys(screen));

  for (const key of Object.keys(screen)) {
    const value = screen[key];
    if (typeof value === 'string') {
      if (value.includes('<!DOCTYPE') || value.includes('<html') || value.includes('<div')) {
        console.log(`   ℹ️  Found HTML-like content in property: ${key}`);
        return value;
      }
    }
  }

  // Si no encontramos HTML, retornar JSON serializado del screen
  // para debugging (el assembler manejará esto)
  console.warn('   ⚠️  No HTML found, returning screen object as JSON');
  return JSON.stringify(screen, null, 2);
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
      generator: 'stitch-sdk',
      ...metadata
    }, null, 2),
    'utf8'
  );

  console.log(`   💾 Saved: ${htmlPath}`);
  console.log(`   💾 Saved: ${metadataPath}`);

  return htmlPath;
}
