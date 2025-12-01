// Script to inject debugging into running dashboard
const fs = require('fs');
const path = require('path');

// Read the debugging script
const debugScript = fs.readFileSync(path.join(__dirname, 'comprehensive-layout-debug.js'), 'utf8');

// Create a simple HTML page that will inject the script
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Debug Script Injector</title>
</head>
<body>
    <h1>Layout Debug Script Injector</h1>
    <p>Open browser console and run the following commands:</p>
    
    <h2>Manual Steps:</h2>
    <ol>
        <li>Open http://localhost:3000/dashboard in your browser</li>
        <li>Open Developer Tools (F12)</li>
        <li>Go to Console tab</li>
        <li>Copy and paste the following script:</li>
    </ol>
    
    <textarea style="width: 100%; height: 300px; font-family: monospace;">${debugScript}</textarea>
    
    <h2>Or use this bookmarklet:</h2>
    <p>Drag this link to your bookmarks bar and click it on the dashboard:</p>
    <a href="javascript:(function(){${debugScript.replace(/\n/g, '').replace(/'/g, "\\'")}})()">Run Layout Debug</a>
    
    <script>
        // Display instructions
        console.log('🔧 Debug script ready for manual injection');
        console.log('📋 Copy the script above and paste it into the browser console on http://localhost:3000/dashboard');
    </script>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, 'debug-injector.html'), htmlContent);
console.log('Debug injector created: debug-injector.html');