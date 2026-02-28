const http = require('http');

async function runTests() {
  console.log("🚀 Starting End-to-End Tests...");
  
  const email = `testuser_${Date.now()}@example.com`;
  const password = 'password123';
  const originalUrl = 'https://news.ycombinator.com';

  let cookie = '';
  let shortUrlCode = '';

  // 1. Test Signup
  console.log(`\n1. Attempting Signup with ${email}...`);
  try {
    const signupRes = await fetch('http://localhost:3000/signup', {
      method: 'POST',
      redirect: 'manual',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ name: 'E2E Tester', email, password })
    });
    
    const setCookieHeader = signupRes.headers.get('set-cookie');
    if (setCookieHeader) {
      cookie = setCookieHeader.split(';')[0];
      console.log('✅ Signup successful! Cookie received.');
    } else {
      console.error('❌ Signup failed: No cookie returned');
      console.log(await signupRes.text());
      return;
    }
  } catch (err) {
    console.error('❌ Signup request failed:', err.message);
    return;
  }

  // 2. Test Link Creation
  console.log(`\n2. Attempting to create a short URL for ${originalUrl}...`);
  try {
    const createRes = await fetch('http://localhost:3000/api/url', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookie 
      },
      body: new URLSearchParams({ originalUrl, customCode: '', expiresIn: '' })
    });
    
    const html = await createRes.text();
    if (html.includes('Successfully Generated!')) {
      console.log('✅ Link creation successful!');
      
      // Extract the generated code from the HTML output box
      const match = html.match(/id="shortUrlOutput"\s*readonly\s*class="[^"]*"\s*value="(.*?)"/si);
      const outputVal = match ? match[1] : null;
      // Also it might be dynamically inserted by EJS without newlines between value and id
      // Actually it's: value="http://localhost:3000/alias/code"
      const urlMatch = html.match(/value="(http:\/\/localhost:3000\/[^\/]+\/[^"]+)"/);
      
      if (urlMatch) {
         const fullShortUrl = urlMatch[1];
         console.log('🔗 Generated URL:', fullShortUrl);
         // extract code: format is http://localhost:3000/alias/code
         const parts = fullShortUrl.split('/');
         shortUrlCode = parts[parts.length - 1];
         const alias = parts[parts.length - 2];
         console.log('Alias:', alias, 'Code:', shortUrlCode);
      } else {
         console.error('❌ Could not parse generated URL from HTML');
      }
    } else {
      console.error('❌ Link creation failed');
    }
  } catch (err) {
      console.error('❌ Link creation request failed:', err.message);
  }

  // 3. Test Profile Page
  console.log(`\n3. Checking Profile Page for short links...`);
  try {
    const profileRes = await fetch('http://localhost:3000/profile', {
      method: 'GET',
      headers: { 'Cookie': cookie }
    });
    const profileHtml = await profileRes.text();
    if (profileRes.status === 200 && profileHtml.includes('Your Links') && profileHtml.includes(shortUrlCode)) {
      console.log('✅ Profile page works and displays the created link!');
    } else if (profileRes.status !== 200) {
      console.error(`❌ Profile page returned status ${profileRes.status}`);
    } else {
      console.error('❌ Profile page did not contain the created link code');
    }
  } catch (err) {
    console.error('❌ Profile check failed:', err.message);
  }

  // 4. Test Redirect
  console.log(`\n4. Testing Redirect Logic...`);
  try {
    const dummyAlias = 'alias'; 
    const redirectRes = await fetch(`http://localhost:3000/${dummyAlias}/${shortUrlCode}`, {
      method: 'GET',
      redirect: 'manual' // Don't automatically follow redirect
    });
    
    if (redirectRes.status === 302 || redirectRes.status === 301) {
      const location = redirectRes.headers.get('location');
      console.log(`✅ Redirect successful! 302 to ${location}`);
      if (location !== originalUrl) {
          console.error(`❌ Redirected to wrong URL: ${location} instead of ${originalUrl}`);
      }
    } else {
      console.error(`❌ Redirect failed. Status: ${redirectRes.status}`);
    }
  } catch(err) {
    console.error('❌ Redirect test failed:', err.message);
  }

  console.log("\n🎉 Testing Completed!");
}

runTests();
