const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/mail/?limit=10&offset=0',
  method: 'GET',
  headers: {
    'x-user-id': '2',
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('API Response:\n');
      console.log('Total:', json.total);
      console.log('Count:', json.mails.length);
      if (json.mails.length > 0) {
        console.log('\nFirst email:');
        console.log(JSON.stringify(json.mails[0], null, 2));
      }
    } catch (e) {
      console.log('Raw response:', data);
    }
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
  process.exit(1);
});

req.end();
