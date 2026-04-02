import 'dotenv/config';
import { StitchToolClient } from '@google/stitch-sdk';

async function testConnection() {
  try {
    console.log('🔌 Testing Stitch SDK connection...');

    const apiKey = process.env.STITCH_API_KEY;
    if (!apiKey) {
      console.error('❌ STITCH_API_KEY not found in .env');
      process.exit(1);
    }

    console.log('   API Key found: ✅');
    console.log('   Initializing client...');

    const client = new StitchToolClient({
      apiKey,
      timeout: 30000
    });

    console.log('   Testing callTool method...');

    // Probar llamar a list_projects usando callTool
    const result = await client.callTool('list_projects', {});

    console.log('\n✅ Stitch conectado exitosamente');
    console.log('📊 Response:', JSON.stringify(result, null, 2).slice(0, 500));

    await client.close();
    console.log('\n✅ Test completado exitosamente');

  } catch (error) {
    console.error('\n❌ Error al conectar con Stitch:');
    console.error(`   Message: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, JSON.stringify(error.response.data).slice(0, 300));
    }
    if (error.stack) {
      console.error(`   Stack:`, error.stack.split('\n').slice(0, 3).join('\n'));
    }
    process.exit(1);
  }
}

testConnection();
