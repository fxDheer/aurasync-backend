const dns = require('dns');
const https = require('https');

console.log('🌐 Starting Network Diagnostic...');

const domains = [
  'abfevbdvezyttlzzxptb.supabase.co',
  'generativelanguage.googleapis.com',
  'google.com'
];

domains.forEach(domain => {
  dns.lookup(domain, (err, address, family) => {
    if (err) {
      console.error(`❌ DNS Failure for ${domain}: ${err.message}`);
      console.log(`💡 TIP: Try restarting your router or switching to Google DNS (8.8.8.8)`);
    } else {
      console.log(`✅ ${domain} is reachable at ${address}`);
    }
  });
});

// Test Gemini API explicitly
const apiKey = 'AIzaSyAU9Q9yYuzVk709hVG4HJ7MGZkVXsnHiJ4';
const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1/models/gemini-1.5-flash?key=${apiKey}`,
  method: 'GET'
};

const req = https.request(options, (res) => {
  console.log(`\n🤖 Gemini API Test Status: ${res.statusCode}`);
  if (res.statusCode === 200) {
    console.log('✅ Gemini API Key is Valid and Reachable!');
  } else {
    console.log('❌ Gemini API returned an error. Let\'s check the model name again.');
  }
});

req.on('error', (e) => {
  console.error(`❌ Network Error reaching Gemini: ${e.message}`);
});
req.end();
