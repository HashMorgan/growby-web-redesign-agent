/**
 * stitch-simple.js — Generador Stitch simplificado
 * v2.0.0 — Solo Stitch, sin fallback
 */

import 'dotenv/config';
import { StitchToolClient } from '@google/stitch-sdk';
import { buildHTML } from './html-builder.js';

/**
 * Genera HTML usando Stitch
 * @param {string} prompt - Prompt completo para Stitch
 * @param {string} jobId - ID del job para broadcast
 * @param {Function} broadcast - Función de broadcast para progreso
 * @param {object} fallbackData - Datos para fallback (url, scrapeData)
 * @returns {Promise<string>} HTML generado
 */
export async function generateWithStitch(prompt, jobId = null, broadcast = null, fallbackData = {}) {
  const apiKey = process.env.STITCH_API_KEY;

  if (!apiKey) {
    throw new Error('STITCH_API_KEY not found in environment');
  }

  const emit = (message, progress) => {
    if (broadcast && jobId) {
      broadcast({ jobId, step: 'generating', message, progress });
    }
    console.log(`   ${message}`);
  };

  let client;

  try {
    emit('📡 Conectando con Stitch AI...', 60);

    client = new StitchToolClient({
      apiKey,
      timeout: 300000 // 5 minutos
    });

    emit('🔨 Creando proyecto Stitch...', 65);

    const projectResult = await client.callTool('create_project', {
      title: `Web Redesign ${Date.now()}`
    });

    const projectId = projectResult.name.split('/')[1];
    emit(`✅ Proyecto creado: ${projectId}`, 70);

    emit('🎨 Generando diseño con IA...', 75);

    const screenResult = await client.callTool('generate_screen_from_text', {
      projectId,
      prompt,
      deviceType: 'DESKTOP',
      modelId: 'GEMINI_3_FLASH'
    });

    if (!screenResult) {
      throw new Error('Stitch returned empty response');
    }

    emit('📥 Extrayendo HTML...', 90);

    // Intentar extraer HTML del resultado
    let html;
    try {
      html = await extractHTML(screenResult);
    } catch (extractError) {
      // Stitch no retornó HTML - usar fallback con design system
      console.warn(`   ⚠️ ${extractError.message}`);
      console.log('   🔄 Usando fallback HTML builder...');

      const designSystem = extractDesignSystem(screenResult);
      html = buildHTML(fallbackData.url || '', fallbackData.scrapeData || {}, designSystem);

      console.log('   ✅ HTML generado con fallback');
    }

    if (!html || html.length < 100) {
      throw new Error('No se pudo generar HTML');
    }

    emit('✅ HTML generado', 95);
    console.log(`   📊 Tamaño: ${(html.length / 1024).toFixed(1)} KB`);

    return { html, projectId };

  } catch (error) {
    console.error(`❌ Error en Stitch: ${error.message}`);
    throw error;
  } finally {
    if (client) {
      await client.close().catch(() => {});
    }
  }
}

/**
 * Extrae HTML del response de Stitch
 */
async function extractHTML(response) {
  // 1. Buscar htmlCode.downloadUrl en outputComponents
  if (response.outputComponents && Array.isArray(response.outputComponents)) {
    for (const component of response.outputComponents) {
      // Buscar en design.screens[].htmlCode
      if (component.design?.screens) {
        for (const screen of component.design.screens) {
          if (screen.htmlCode?.downloadUrl) {
            console.log('   📥 Descargando HTML desde URL...');
            const htmlResponse = await fetch(screen.htmlCode.downloadUrl);
            if (htmlResponse.ok) {
              return await htmlResponse.text();
            }
          }
        }
      }
    }
  }

  // 2. Fallback: buscar HTML directo (paths antiguos)
  const sources = [
    response.html,
    response.getHtml?.(),
    response.outputComponents,
    response.content,
    response.code,
  ];

  for (const source of sources) {
    if (!source) continue;

    // Si es string directo
    if (typeof source === 'string') {
      if (source.includes('<!DOCTYPE') || source.includes('<html')) {
        return source;
      }
    }

    // Si es array de componentes
    if (Array.isArray(source)) {
      const htmlParts = [];
      for (const item of source) {
        if (typeof item === 'string' && item.includes('<')) {
          htmlParts.push(item);
        } else if (item?.code) {
          htmlParts.push(item.code);
        } else if (item?.html) {
          htmlParts.push(item.html);
        }
      }
      if (htmlParts.length > 0) {
        return htmlParts.join('\n');
      }
    }

    // Si es objeto con propiedades
    if (typeof source === 'object') {
      if (source.html) return source.html;
      if (source.code) return source.code;
    }
  }

  // No se encontró HTML
  throw new Error('Stitch response does not contain HTML. Response keys: ' + Object.keys(response).join(', '));
}

/**
 * Extrae design system del response de Stitch
 */
function extractDesignSystem(response) {
  if (!response.outputComponents || !Array.isArray(response.outputComponents)) {
    return null;
  }

  // Buscar designSystem en outputComponents
  for (const component of response.outputComponents) {
    if (component.designSystem?.designSystem) {
      return component.designSystem.designSystem;
    }
  }

  return null;
}

