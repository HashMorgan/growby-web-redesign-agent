import 'dotenv/config';
import { StitchToolClient } from '@google/stitch-sdk';

async function listTools() {
  try {
    const client = new StitchToolClient({
      apiKey: process.env.STITCH_API_KEY,
      timeout: 30000
    });

    console.log('📊 Herramientas disponibles en Stitch SDK:\n');

    // Intentar diferentes métodos
    const tools = [
      'list_projects',
      'create_project',
      'get_project',
      'generate_screen_from_text',
      'get_screen',
      'list_screens',
      'get_html',
      'export_html',
      'render_screen',
      'get_code'
    ];

    for (const tool of tools) {
      try {
        console.log(`   Testing: ${tool}...`);
        // Intentar llamar con parámetros vacíos
        await client.callTool(tool, {});
        console.log(`   ✅ ${tool} exists`);
      } catch (e) {
        if (e.message.includes('Missing required')) {
          console.log(`   ✅ ${tool} exists (requires params)`);
        } else {
          console.log(`   ❌ ${tool} not found`);
        }
      }
    }

    await client.close();

  } catch (error) {
    console.error('Error:', error.message);
  }
}

listTools();
