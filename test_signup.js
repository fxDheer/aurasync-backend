async function testSignup() {
  const testId = Math.floor(Math.random() * 10000);
  const realisticEmail = `aurasync_test_${testId}@gmail.com`;
  console.log(`🧪 Testing signup with: ${realisticEmail}`);
  
  try {
    const response = await fetch('http://localhost:3001/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: realisticEmail,
        password: 'Password123!',
        displayName: 'AuraSync Tester'
      })
    });
    
    const data = await response.json();
    if (response.ok) {
      console.log('✅ Signup Success!', data);
    } else {
      console.error('❌ Signup Failed!');
      console.error('Status:', response.status);
      console.error('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSignup();
