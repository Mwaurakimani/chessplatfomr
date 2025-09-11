require('dotenv').config();
const https = require('follow-redirects').https;

const host = process.env.ONIT_HOST || 'api.onitmfbank.com';
const userId = process.env.ONIT_USER_ID;
const password = process.env.ONIT_PASSWORD;

if (!userId || !password) {
  console.error('Missing ONIT_USER_ID or ONIT_PASSWORD in environment');
  process.exit(1);
}

const options = {
  method: 'POST',
  hostname: host,
  path: '/api/v1/auth/jwt',
  headers: {
    'Content-Type': 'application/json'
  },
  maxRedirects: 20
};

const req = https.request(options, function (res) {
  const chunks = [];
  res.on('data', chunk => chunks.push(chunk));
  res.on('end', () => {
    const body = Buffer.concat(chunks).toString();
    try {
      const parsed = JSON.parse(body);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log(body);
    }
  });
  res.on('error', err => console.error(err));
});

const postData = JSON.stringify({
  userId: Number(userId) || userId,
  password: password
});

req.write(postData);
req.end();
