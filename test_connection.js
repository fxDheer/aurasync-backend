/**
 * AuraSync — Local Connection Tester
 * Verifies if all API keys and Database connections are valid
 */
require('dotenv').config();
const { supabase } = require('./src/services/supabase');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testConnections() {
  console.log('🔍 Starting AuraSync Connectivity Test...\n');

  // 1. Test Supabase
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error) throw error;
    console.log('✅ Supabase: Connected successfully.');
  } catch (e) {
    console.error('❌ Supabase: Connection failed. Check your URL and Key.');
    console.error('   Error:', e.message);
  }

  // 2. Test Gemini AI
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("Hello! Are you ready to sync?");
    const text = result.response.text();
    if (text) {
      console.log('✅ Gemini AI: Connected and responding.');
    }
  } catch (e) {
    console.error('❌ Gemini AI: API Key invalid or quota exceeded.');
    console.error('   Error:', e.message);
  }

  // 3. Test Resend (Email)
  if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('placeholder')) {
    console.log('✅ Resend: API Key detected.');
  } else {
    console.warn('⚠️  Resend: API Key is still a placeholder.');
  }

  console.log('\n🏁 Test complete.');
}

testConnections();
