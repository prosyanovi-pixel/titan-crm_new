const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/mail/folders/mail_account_33673b4f-9fcf-448e-aa93-e4e5ccfecaa0',
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
      console.log('Folders API Response:');
      console.log('Total folders:', json.length);
      console.log('\nFirst 3 folders:');
      json.slice(0, 3).forEach(f => {
        console.log('  -', f.folderName, `(${f.folderType}, ${f.id.substring(0, 10)}...)`);
      });
    } catch (e) {
      console.log('Raw response:', data.substring(0, 500));
    }
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
  process.exit(1);
});

req.end();
