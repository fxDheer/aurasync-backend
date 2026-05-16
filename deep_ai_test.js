/**
 * AuraSync — Deep AI Diagnostic Suite
 * Verifies the "AHA!" moment logic and Gemini 1.5 stability
 */
require('dotenv').config();
const { generateNudge, generateVibeScan, generateWeeklyReport } = require('./src/services/gemini');

async function runTests() {
    console.log('🧪 STARTING DEEP AI DIAGNOSTIC...\n');

    // TEST 1: The "AHA!" Vibe Scan (Morning Insight)
    console.log('📡 TEST 1: Morning Vibe Scan...');
    const morningScan = await generateVibeScan({
        recentState: 'first_visit',
        mood: 'calm but slightly anxious about a meeting',
        timeContext: '09:00'
    });
    console.log('✅ RESPONSE:', JSON.stringify(morningScan, null, 2));
    console.log('-----------------------------------\n');

    // TEST 2: The "Psychological" Nudge (High Stress)
    console.log('📡 TEST 2: High Stress Nudge (Spiraling)...');
    const stressNudge = await generateNudge({
        stressState: 'SPIRALING',
        typingCadence: 'erratic and fast',
        scrollSpeed: 'frenetic',
        appSwitchFreq: 'extremely high',
        timeContext: '23:30'
    });
    console.log('✅ RESPONSE:', JSON.stringify(stressNudge, null, 2));
    console.log('-----------------------------------\n');

    // TEST 3: The "Pattern-Finding" Weekly Report
    console.log('📡 TEST 3: Weekly Pattern Analysis...');
    const weeklyData = [
        { state: 'STRESSED', timestamp: 'Monday 10:00' },
        { state: 'STRESSED', timestamp: 'Tuesday 10:30' },
        { state: 'CALM', timestamp: 'Wednesday 14:00' },
        { state: 'SPIRALING', timestamp: 'Thursday 09:45' }
    ];
    const report = await generateWeeklyReport(weeklyData, { "Morning Meetings": 3, "Late Night Emails": 1 });
    console.log('✅ RESPONSE:', JSON.stringify(report, null, 2));
    console.log('-----------------------------------\n');

    console.log('🏁 DIAGNOSTIC COMPLETE.');
}

runTests().catch(err => {
    console.error('❌ DIAGNOSTIC FAILED:', err.message);
    process.exit(1);
});
