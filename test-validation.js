const http = require("http");

// 1. First login to get a cookie
const loginReq = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  }
}, (res) => {
  const cookie = res.headers['set-cookie'] ? res.headers['set-cookie'][0].split(';')[0] : null;
  console.log("Got Cookie:", cookie);
  
  if (!cookie) {
      console.log("Could not login to test. Make sure you have a user.");
      return;
  }

  // 2. Now submit a bad URL with the cookie
  const postData = JSON.stringify({ originalUrl: 'not-a-website' });
  const req2 = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/url',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
      'Content-Length': Buffer.byteLength(postData)
    }
  }, (res2) => {
    console.log(`URL Submission Status: ${res2.statusCode}`);
    let data = '';
    res2.on('data', chunk => data += chunk);
    res2.on('end', () => {
        if (data.includes("Invalid URL provided")) {
            console.log("✅ Success! Validator rejected the bad URL.");
        } else {
            console.log("❌ Failed! Validator did not trigger correctly.");
        }
    });
  });
  
  req2.write(postData);
  req2.end();
});

// Assuming 'test@test.com' 'password' exists from previous testing
loginReq.write('email=test@test.com&password=password');
loginReq.end();
