const http = require('http');

const payload = JSON.stringify({
  tags: ["VIP", "TEST_TAG"],
  name: "Updated Name"
});

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/contractors/309',
  method: 'PUT',
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

req.write(payload);
req.end();
