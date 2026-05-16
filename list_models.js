require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  console.log('🔍 Querying available AI models for your key...');
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Note: Some versions of the library don't have listModels directly on genAI
    // We will try a manual fetch if needed, but let's try the simple ping first
    
    const testModels = ['models/gemini-1.5-pro', 'models/gemini-1.5-flash', 'models/gemini-pro', 'models/gemini-1.0-pro'];
    
    for (const m of testModels) {
      try {
        const model = genAI.getGenerativeModel({ model: m });
        await model.generateContent("ping");
        console.log(`✅ ${m} is AVAILABLE!`);
        return m;
      } catch (e) {
        console.log(`❌ ${m} is not available (${e.status})`);
      }
    }
  } catch (e) {
    console.error('Failed to list models:', e.message);
  }
}

listModels();
