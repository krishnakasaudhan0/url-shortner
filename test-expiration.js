const http = require('http');

async function testExpiration() {
  console.log("🚀 Testing Expires In logic...");
  
  const email = `testexpire_${Date.now()}@example.com`;
  const password = 'password123';
  const originalUrl = 'https://news.ycombinator.com';

  let cookie = '';
  let shortUrlCode = '';

  // 1. Signup
  const signupRes = await fetch('http://localhost:3000/signup', {
    method: 'POST',
    redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ name: 'Tester', email, password })
  });
  cookie = signupRes.headers.get('set-cookie').split(';')[0];
  console.log('✅ Signup successful');

  // 2. Create link with 2 seconds expiration
  const createRes = await fetch('http://localhost:3000/api/url', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookie 
    },
    body: new URLSearchParams({ originalUrl, customCode: '', expiresIn: '2' })
  });
  const html = await createRes.text();
  const urlMatch = html.match(/value="(http:\/\/localhost:3000\/[^\/]+\/[^"]+)"/);
  const fullShortUrl = urlMatch[1];
  const parts = fullShortUrl.split('/');
  shortUrlCode = parts[parts.length - 1];
  const alias = parts[parts.length - 2];
  console.log(`✅ Link created with 2s expiry: ${fullShortUrl}`);

  // 3. Test Redirect immediately
  let redirectRes = await fetch(`http://localhost:3000/${alias}/${shortUrlCode}`, {
    method: 'GET',
    redirect: 'manual'
  });
  console.log(`Immediate Request Status: ${redirectRes.status} (Expected 302)`);
  
  // Wait 3 seconds
  console.log('Waiting 3 seconds for expiration...');
  await new Promise(r => setTimeout(r, 3000));

  // 4. Test Redirect post-expiration
  redirectRes = await fetch(`http://localhost:3000/${alias}/${shortUrlCode}`, {
    method: 'GET',
    redirect: 'manual'
  });
  console.log(`Expired Request Status: ${redirectRes.status} (Expected 410)`);
  const resHtml = await redirectRes.text();
  if (resHtml.includes('This short link has expired.')) {
      console.log('✅ Success: Expiration UI error message block was returned!');
  } else {
      console.log('❌ Failed to return the UI block');
  }
}

testExpiration();
