import 'dotenv/config';
import { StitchToolClient } from '@google/stitch-sdk';

console.log('╔══════════════════════════════════════════════════╗');
console.log('║   TEST 1: Stitch conecta con STITCH_API_KEY     ║');
console.log('╚══════════════════════════════════════════════════╝\n');

async function testStitchConnection() {
  try {
    const apiKey = process.env.STITCH_API_KEY;

    if (!apiKey) {
      console.log('❌ FAIL: STITCH_API_KEY not found in .env');
      process.exit(1);
    }

    console.log('✅ API Key found');

    const client = new StitchToolClient({ apiKey, timeout: 30000 });
    const result = await client.callTool('list_projects', {});

    console.log(`✅ PASS: Stitch connected`);
    console.log(`   Projects found: ${result.projects?.length || 0}`);

    await client.close();
    return true;

  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    return false;
  }
}

testStitchConnection().then(success => {
  process.exit(success ? 0 : 1);
});
