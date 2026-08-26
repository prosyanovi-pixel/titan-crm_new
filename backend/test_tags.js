const http = require('http');

const payload = JSON.stringify({
  tags: ["VIP", "TEST_TAG"]
});

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/contractors/bulk-update',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': payload.length
  }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});

req.write(JSON.stringify({ ids: [309], updates: { tags: ["VIP", "TEST_TAG"] } }));
req.end();
