async function forceSignup() {
  const freshEmail = `user_${Math.floor(Math.random() * 100000)}@aurasync.test`;
  console.log(`🧪 Attempting signup with: ${freshEmail}`);
  
  try {
    const response = await fetch('http://localhost:3001/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: freshEmail,
        password: 'password123',
        displayName: 'AuraSync Beta User'
      })
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  }
}

forceSignup();
