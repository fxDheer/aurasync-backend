/**
 * AuraSync — Raw AI Probe
 * Bypasses internal services to see the RAW response from Google
 */
require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function probe() {
    console.log('📡 PROBING GEMINI RAW...');
    const API_KEY = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: "Say 'AuraSync is alive' and nothing else." }] }]
        })
    });

    console.log('HTTP STATUS:', response.status);
    const data = await response.json();
    console.log('RAW DATA:', JSON.stringify(data, null, 2));
}

probe().catch(console.error);
