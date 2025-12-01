const fs = require('fs');
const path = require('path');

// Create a simple HTML file that will automatically take a screenshot when opened
const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Screenshot</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', sans-serif;
        }
        .playfair {
            font-family: 'Playfair Display', serif;
        }
    </style>
</head>
<body>
    <div class="flex items-center justify-center bg-[#121212]" style="height: 100vh; width: 100vw;">
        <div class="w-full max-w-[400px] px-4">
            <div class="text-center mb-10">
                <div class="flex items-center justify-center mb-10">
                    <div class="flex items-center">
                        <div class="flex space-x-1 mr-3">
                            <div class="w-1 h-12 bg-[#B89B5E]"></div>
                            <div class="w-1 h-12 bg-[#B89B5E]"></div>
                            <div class="w-1 h-12 bg-[#B89B5E]"></div>
                            <div class="w-1 h-12 bg-[#B89B5E]"></div>
                        </div>
                        <div class="text-[#B89B5E] playfair" style="font-size: 48px; font-weight: bold;">
                            VeroTrade
                        </div>
                    </div>
                </div>
                
                <h1 class="text-[#EAE6DD]" style="font-family: 'Inter', sans-serif; font-size: 48px; font-weight: bold; margin-bottom: 32px;">
                    Sign in
                </h1>
            </div>

            <form class="space-y-4">
                <div style="margin-bottom: 16px;">
                    <label for="email" class="block text-[#6F6F6F] text-sm font-medium mb-2 text-left" style="font-size: 14px;">
                        Email address
                    </label>
                    <input
                        id="email"
                        type="email"
                        class="w-full bg-[#202020] border border-[#2B2B2B] rounded-[12px] h-12 px-4 text-[#EAE6DD] focus:outline-none focus:border-[#B89B5E] transition-colors"
                        style="padding: 16px;"
                        placeholder=""
                    />
                </div>
                
                <div style="margin-bottom: 24px;">
                    <label for="password" class="block text-[#6F6F6F] text-sm font-medium mb-2 text-left" style="font-size: 14px;">
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        class="w-full bg-[#202020] border border-[#2B2B2B] rounded-[12px] h-12 px-4 text-[#EAE6DD] focus:outline-none focus:border-[#B89B5E] transition-colors"
                        style="padding: 16px;"
                        placeholder=""
                    />
                </div>

                <button
                    type="submit"
                    class="w-full bg-[#B89B5E] hover:bg-[#D6C7B2] text-[#121212] font-bold rounded-[12px] h-12 transition-colors duration-200"
                    style="font-size: 16px;"
                >
                    Sign in
                </button>
            </form>
        </div>
    </div>

    <script>
        // Prevent form submission
        document.querySelector('form').addEventListener('submit', function(e) {
            e.preventDefault();
        });
        
        // Take screenshot using html2canvas
        function takeScreenshot() {
            // Try to use html2canvas if available
            if (typeof html2canvas !== 'undefined') {
                html2canvas(document.body).then(canvas => {
                    const link = document.createElement('a');
                    link.download = 'login-page-screenshot.png';
                    link.href = canvas.toDataURL();
                    link.click();
                });
            } else {
                // Fallback: instruct user to take manual screenshot
                alert('Please take a manual screenshot of this page (Ctrl+Shift+S on Windows/Linux or Cmd+Shift+S on Mac)');
            }
        }
        
        // Auto-take screenshot after page loads
        window.addEventListener('load', function() {
            setTimeout(takeScreenshot, 1000);
        });
    </script>
    
    <!-- Include html2canvas library for screenshot functionality -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
</body>
</html>
`;

// Write the HTML file
const filePath = path.join(__dirname, 'login-screenshot-auto.html');
fs.writeFileSync(filePath, htmlContent);

console.log(`Created screenshot HTML file at: ${filePath}`);
console.log('Please open this file in your browser to take a screenshot.');