const http = require('http');

async function testAPI() {
  const userId = '2'; // From database
  const accountId = 'mail_account_33673b4f-9fcf-448e-aa93-e4e5ccfecaa0'; // From database
  const folderId = 'folder_0928d019-4553-4b07-8e9b-93119c271598'; // INBOX folder ID
  
  const url = `http://localhost:5001/api/mail?accountId=${accountId}&folderId=${folderId}&limit=10`;
  
  console.log('🔗 Testing URL:', url);
  console.log('📧 User ID:', userId);
  console.log('');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5001,
      path: `/api/mail?accountId=${accountId}&folderId=${folderId}&limit=10`,
      method: 'GET',
      headers: {
        'x-user-id': userId
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      console.log(`📊 Status: ${res.statusCode}`);
      console.log(`📋 Headers:`, res.headers);
      console.log('');
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log('✅ Response:');
          console.log(JSON.stringify(json, null, 2));
          resolve();
        } catch (e) {
          console.log('❌ Invalid JSON:', data);
          resolve();
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });

    req.end();
  });
}

testAPI().catch(console.error).finally(() => process.exit());
