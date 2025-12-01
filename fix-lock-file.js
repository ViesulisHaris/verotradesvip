const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to remove lock files
function removeLockFiles() {
  const lockPath = path.join(process.cwd(), '.next', 'dev', 'lock');
  
  try {
    if (fs.existsSync(lockPath)) {
      fs.unlinkSync(lockPath);
      console.log('✓ Removed lock file:', lockPath);
    }
  } catch (error) {
    console.log('Could not remove lock file:', error.message);
  }
  
  // Also remove any other potential lock files
  const nextDir = path.join(process.cwd(), '.next');
  if (fs.existsSync(nextDir)) {
    const files = fs.readdirSync(nextDir, { recursive: true });
    files.forEach(file => {
      if (file.includes('lock') && typeof file === 'string') {
        const fullPath = path.join(nextDir, file);
        try {
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log('✓ Removed additional lock file:', fullPath);
          }
        } catch (error) {
          // Ignore errors for additional lock files
        }
      }
    });
  }
}

// Function to start development server with lock file handling
function startDevServer(port = 3000) {
  console.log(`\n🚀 Starting Next.js development server on port ${port}...`);
  
  // Remove lock files before starting
  removeLockFiles();
  
  try {
    // Start the server with the specified port using npx to avoid infinite loop
    execSync(`npx next dev --port ${port}`, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error starting server on port ${port}:`, error.message);
  }
}

// If this script is run directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const port = args[0] ? parseInt(args[0]) : 3000;
  startDevServer(port);
}

module.exports = { removeLockFiles, startDevServer };