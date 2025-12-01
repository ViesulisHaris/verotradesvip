const http = require('http');

// Test if the development server is accessible
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log(`Server Status: ${res.statusCode}`);
  console.log('Server is accessible and responding');
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Server response received successfully');
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.error('Server accessibility test failed:', err.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('Server accessibility test timed out');
  req.destroy();
  process.exit(1);
});

req.end();