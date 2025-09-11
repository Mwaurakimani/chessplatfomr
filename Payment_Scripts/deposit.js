require('dotenv').config();
const https = require('follow-redirects').https;
const http = require('http');

const host = process.env.ONIT_HOST || 'api.onitmfbank.com';
const bearer = process.env.ONIT_BEARER;
const destinationAccount = process.env.ONIT_ACCOUNT;
const callbackUrl = process.env.ONIT_CALLBACK_URL; // Local callback for testing

if (!bearer) {
  console.error('Missing ONIT_BEARER token in environment. Run auth.js or set ONIT_BEARER');
  process.exit(1);
}

const payload = {
  originatorRequestId: process.env.ORIGINATOR_REQUEST_ID || `AD-${Date.now()}`,
  destinationAccount: destinationAccount || process.env.DEFAULT_DESTINATION_ACCOUNT || '0001650000002',
  sourceAccount: process.env.SOURCE_ACCOUNT || '254759469851',
  amount: Number(process.env.AMOUNT || 20),
  channel: process.env.CHANNEL || 'MPESA',
  product: process.env.PRODUCT || 'CA05',
  event: '',
  narration: process.env.NARRATION || 'Deposit via script',
  callbackUrl: callbackUrl
};

const options = {
  method: 'POST',
  hostname: host,
  path: '/api/v1/transaction/deposit',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${bearer}`
  },
  maxRedirects: 20,
  timeout: 10000
};

const req = https.request(options, function (res) {
  const chunks = [];
  res.on('data', chunk => chunks.push(chunk));
  res.on('end', () => {
    const body = Buffer.concat(chunks).toString();
    try { console.log('Deposit request response:', JSON.stringify(JSON.parse(body), null, 2)); } catch (e) { console.log(body); }
  });
  res.on('error', err => console.error('Deposit request error:', err));
});

req.on('timeout', () => {
  console.error('Deposit request timed out');
  req.destroy();
});

req.on('error', err => console.error('Deposit request error:', err));

req.write(JSON.stringify(payload));
req.end();

// Start local callback listener
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/callback') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        console.log('Deposit callback received:', JSON.stringify(data, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        server.close();
        process.exit(0);
      } catch (e) {
        console.error('Error parsing callback:', e);
        res.writeHead(400);
        res.end();
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(3000, () => {
  console.log('Listening for deposit callback on http://localhost:3000/callback');
});

// Timeout after 60 seconds if no callback
setTimeout(() => {
  console.log('Timeout waiting for deposit callback');
  server.close();
  process.exit(1);
}, 60000);
