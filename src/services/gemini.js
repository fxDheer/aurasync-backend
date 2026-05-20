/**
 * AuraSync — Gemini AI Service
 * Uses Gemini 1.5 Pro for high-context stress reasoning & nudge generation
 */
const logger = require('../utils/logger');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_KEY = process.env.GEMINI_API_KEY;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const SYSTEM_PROMPT = `You are AuraSync's Perceptive Vibe Engine. You possess extreme emotional intelligence and can read between the lines of behavioral signals.
Your role: Provide deep, surprising, and actionable insights that make the user feel "seen" and understood.
Rules:
- Never be generic. Instead of "You are stressed," say "I notice a tight, hurried energy in your focus."
- Use "Micro-Psychology": point out how their current state might be affecting their perspective.
- Keep nudges under 40 words, vibe scans under 30 words, and reports under 150 words.
- Always include a "Hidden Truth"—a small observation that sounds like you're reading their mind.
- Sound like a wise, slightly poetic mentor who knows them better than they know themselves.`;

async function callGemini(modelName, prompt, fallback) {
  try {
    const url = `${BASE_URL}/${modelName}:generateContent?key=${API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 600 }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('🚫 GOOGLE AI REJECTION:', JSON.stringify(err, null, 2));
      throw new Error(err.error?.message || 'Gemini API Error');
    }

    const data = await response.json();
    let text = data.candidates[0].content.parts[0].text;
    
    // Extract JSON from text (handles markdown backticks and extra text)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('❌ JSON Parse error in Gemini response:', e.message);
        console.log('RAW TEXT:', text);
      }
    }
    
    return fallback;
  } catch (error) {
    console.error('❌ Gemini call error:', error.message);
    return fallback;
  }
}

async function generateNudge(anonymizedData) {
  const fallback = getFallbackNudge(anonymizedData.stressState);
  const prompt = `${SYSTEM_PROMPT}

Behavioral signals (anonymized):
- Stress State: ${anonymizedData.stressState}
- Typing Speed: ${anonymizedData.typingCadence || 'unknown'}
- Scroll Behavior: ${anonymizedData.scrollSpeed || 'unknown'}  
- App Switching: ${anonymizedData.appSwitchFreq || 'unknown'}
- Time Context: ${anonymizedData.timeContext || 'unknown'}

Generate a single, deeply perceptive micro-nudge (under 40 words). 
Focus on the *psychology* of the ${anonymizedData.stressState} state.
Return ONLY JSON: {"nudge": "your perceptive message", "interventionType": "breathing|visual_reset|reframe|grounding", "urgency": "low|medium|high"}`;

  return await callGemini('gemini-1.5-flash', prompt, fallback);
}

async function generateVibeScan(anonymizedData) {
  const fallback = { greeting: "Welcome back. I'm here whenever you need me.", suggestedAction: 'breathe' };
  const prompt = `${SYSTEM_PROMPT}
A user just opened AuraSync. Based on these signals:
- Time: ${new Date().toLocaleTimeString()}
- Day: ${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()]}
- Recent state: ${anonymizedData.recentState || 'first_visit'}

Generate a "Vibe Scan" insight (under 30 words) that feels like a deep reflection.
Signals:
- Current Mood: ${anonymizedData.mood || 'scanning...'}
- Time Reflection: ${anonymizedData.timeContext || 'the current hour'}
- Recent Energy: ${anonymizedData.recentState || 'fresh start'}

Provide a "Deep Reflection" that hits home.
Return ONLY JSON: {"greeting": "your deep insight", "suggestedAction": "breathe|pause|celebrate|reflect"}`;

  return await callGemini('gemini-1.5-flash', prompt, fallback);
}

async function generateWeeklyReport(weeklyData, triggers) {
  const fallback = { headline: 'Your Week in Review', insight: 'Keep building your resilience practice.', tip: 'Try a 5-minute breathing exercise tomorrow.', overallTrend: 'stable' };
  const prompt = `${SYSTEM_PROMPT}

Generate a Weekly Resilience Report from this anonymized data:
- Total stress events: ${weeklyData.length}
- Top trigger times: ${JSON.stringify(triggers)}

Create an encouraging, insightful report (under 150 words) with:
1. A headline insight
2. Their top trigger pattern
3. One actionable tip for next week
Return ONLY JSON: {"headline": "...", "insight": "...", "tip": "...", "overallTrend": "improving|stable|needs_attention"}`;

  return await callGemini('gemini-1.5-flash', prompt, fallback);
}

function getFallbackNudge(state) {
  const fallbacks = {
    CALM: { nudge: "You're in a great flow right now. Keep riding this wave.", interventionType: 'reframe', urgency: 'low' },
    DRIFTING: { nudge: "I notice your attention is wandering. That's okay — take one deep breath and refocus.", interventionType: 'breathing', urgency: 'low' },
    STRESSED: { nudge: "I see the tension building. Let's do a quick 30-second reset together.", interventionType: 'breathing', urgency: 'medium' },
    SPIRALING: { nudge: "Hey, I'm right here with you. Let's ground ourselves — name 3 things you can see right now.", interventionType: 'grounding', urgency: 'high' },
  };
  return fallbacks[state] || fallbacks.STRESSED;
}

module.exports = { generateNudge, generateVibeScan, generateWeeklyReport, getWeeklyReport: generateWeeklyReport };
