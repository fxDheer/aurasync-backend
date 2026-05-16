require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');

async function runDeepTest() {
  console.log('🧪 Starting Deep System Test...');

  // 1. Test Gemini AI
  console.log('\n🤖 Testing Gemini AI (gemini-1.5-flash-latest)...');
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    const result = await model.generateContent("Say 'AuraSync AI is Online'");
    console.log('✅ Gemini Response:', result.response.text());
  } catch (e) {
    console.error('❌ Gemini Failed:', e.message);
  }

  // 2. Test Supabase
  console.log('\n📡 Testing Supabase Connection...');
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error) throw error;
    console.log('✅ Supabase Connection: Success');
  } catch (e) {
    console.error('❌ Supabase Failed:', e.message);
  }

  console.log('\n🏁 Test Complete.');
}

runDeepTest();
