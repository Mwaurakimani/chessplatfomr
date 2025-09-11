require('dotenv').config();
const https = require('follow-redirects').https;

const host = process.env.ONIT_HOST || 'api.onitmfbank.com';
const bearer = process.env.ONIT_BEARER;

if (!bearer) {
  console.error('Missing ONIT_BEARER token in environment. Run auth.js or set ONIT_BEARER');
  process.exit(1);
}

const payload = {
  originatorRequestId: process.env.ORIGINATOR_REQUEST_ID || `AW-${Date.now()}`,
  sourceAccount: process.env.SOURCE_ACCOUNT || '0001650000002',
  destinationAccount: process.env.DESTINATION_ACCOUNT || '254759469851',
  amount: Number(process.env.AMOUNT || 10),
  channel: process.env.CHANNEL || 'MPESA',
  channelType: process.env.CHANNEL_TYPE || 'MOBILE',
  product: process.env.PRODUCT || 'CA04',
  narration: process.env.NARRATION || 'Withdraw via script',
  callbackUrl: process.env.ONIT_CALLBACK_URL,
};

const options = {
  method: 'POST',
  hostname: host,
  path: '/api/v1/transaction/withdraw',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${bearer}`
  },
  maxRedirects: 20
};

const req = https.request(options, function (res) {
  const chunks = [];
  res.on('data', chunk => chunks.push(chunk));
  res.on('end', () => {
    const body = Buffer.concat(chunks).toString();
    try { console.log(JSON.stringify(JSON.parse(body), null, 2)); } catch (e) { console.log(body); }
  });
  res.on('error', err => console.error(err));
});

req.write(JSON.stringify(payload));
req.end();
