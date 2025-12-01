const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const os = require('os');

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Helper function for colored console output
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Function to display startup banner
function displayBanner() {
  log('\n' + '='.repeat(70), 'cyan');
  log('🚀 TRADING JOURNAL WEB - ROBUST STARTUP SCRIPT', 'bright');
  log('='.repeat(70), 'cyan');
  log('This script ensures a clean startup by:', 'white');
  log('  • Terminating conflicting Node.js processes', 'white');
  log('  • Removing lock files and cached data', 'white');
  log('  • Verifying port availability', 'white');
  log('  • Providing clear feedback throughout the process', 'white');
  log('='.repeat(70) + '\n', 'cyan');
}

// Function to check and terminate conflicting Node.js processes
function terminateConflictingProcesses(port = 3000) {
  log(`🔍 Checking for processes using port ${port}...`, 'yellow');
  
  try {
    // Windows-specific process termination
    if (os.platform() === 'win32') {
      // Find processes using the specified port
      const netstatOutput = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
      const lines = netstatOutput.split('\n').filter(line => line.trim());
      
      const pids = new Set();
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5) {
          const pid = parts[parts.length - 1];
          if (pid && !isNaN(pid)) {
            pids.add(pid);
          }
        }
      });
      
      // Terminate found processes
      if (pids.size > 0) {
        log(`Found ${pids.size} process(es) using port ${port}`, 'yellow');
        pids.forEach(pid => {
          // Skip system processes (PID 0, 4, etc.)
          if (pid === '0' || pid === '4' || parseInt(pid) < 10) {
            log(`⚠️ Skipping system process ${pid}`, 'yellow');
            return;
          }
          try {
            execSync(`taskkill /f /pid ${pid}`, { stdio: 'pipe' });
            log(`✓ Terminated process ${pid} using port ${port}`, 'green');
          } catch (error) {
            log(`⚠️ Could not terminate process ${pid}: ${error.message}`, 'yellow');
          }
        });
      } else {
        log(`✓ No processes found using port ${port}`, 'green');
      }
      
      // Also terminate any node.exe processes that might be related
      try {
        const nodeProcesses = execSync('tasklist /fi "imagename eq node.exe" /fo csv', { encoding: 'utf8' });
        if (nodeProcesses.includes('node.exe')) {
          execSync('taskkill /f /im node.exe', { stdio: 'pipe' });
          log('✓ Terminated all Node.js processes', 'green');
        }
      } catch (error) {
        // No node processes to terminate or couldn't terminate
      }
    } else {
      // Unix-like systems (Linux, macOS)
      try {
        const lsofOutput = execSync(`lsof -ti:${port}`, { encoding: 'utf8' });
        const pids = lsofOutput.trim().split('\n').filter(pid => pid);
        
        if (pids.length > 0) {
          log(`Found ${pids.length} process(es) using port ${port}`, 'yellow');
          pids.forEach(pid => {
            try {
              execSync(`kill -9 ${pid}`, { stdio: 'pipe' });
              log(`✓ Terminated process ${pid} using port ${port}`, 'green');
            } catch (error) {
              log(`⚠️ Could not terminate process ${pid}: ${error.message}`, 'yellow');
            }
          });
        } else {
          log(`✓ No processes found using port ${port}`, 'green');
        }
      } catch (error) {
        // No processes found using the port
        log(`✓ No processes found using port ${port}`, 'green');
      }
    }
  } catch (error) {
    // This is expected when no processes are using the port
    log(`✓ No processes found using port ${port}`, 'green');
  }
}

// Function to remove all lock files and cached data
function removeLockFiles() {
  log('🔧 Cleaning up lock files and cached data...', 'yellow');
  
  const projectRoot = process.cwd();
  const nextDir = path.join(projectRoot, '.next');
  
  // Remove main lock file
  const lockPath = path.join(nextDir, 'dev', 'lock');
  try {
    if (fs.existsSync(lockPath)) {
      fs.unlinkSync(lockPath);
      log(`✓ Removed main lock file: ${lockPath}`, 'green');
    }
  } catch (error) {
    log(`⚠️ Could not remove main lock file: ${error.message}`, 'yellow');
  }
  
  // Remove all lock files recursively
  if (fs.existsSync(nextDir)) {
    const files = fs.readdirSync(nextDir, { recursive: true });
    files.forEach(file => {
      if (typeof file === 'string' && (file.includes('lock') || file.includes('.pid'))) {
        const fullPath = path.join(nextDir, file);
        try {
          if (fs.existsSync(fullPath) && fs.lstatSync(fullPath).isFile()) {
            fs.unlinkSync(fullPath);
            log(`✓ Removed lock/PID file: ${fullPath}`, 'green');
          }
        } catch (error) {
          log(`⚠️ Could not remove lock file: ${fullPath} - ${error.message}`, 'yellow');
        }
      }
    });
  }
  
  // Remove TypeScript build cache files that might cause issues
  const tsBuildInfoFile = path.join(projectRoot, 'tsconfig.tsbuildinfo');
  try {
    if (fs.existsSync(tsBuildInfoFile)) {
      fs.unlinkSync(tsBuildInfoFile);
      log('✓ Removed TypeScript build info file', 'green');
    }
  } catch (error) {
    log(`⚠️ Could not remove TypeScript build info file: ${error.message}`, 'yellow');
  }
  
  // Remove Next.js trace files
  const traceFiles = ['.next/trace', '.next/cache/webpack'];
  traceFiles.forEach(traceFile => {
    const fullPath = path.join(projectRoot, traceFile);
    try {
      if (fs.existsSync(fullPath)) {
        if (fs.lstatSync(fullPath).isDirectory()) {
          fs.rmSync(fullPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(fullPath);
        }
        log(`✓ Removed trace/cache file: ${fullPath}`, 'green');
      }
    } catch (error) {
      log(`⚠️ Could not remove trace file: ${fullPath} - ${error.message}`, 'yellow');
    }
  });
}

// Function to verify port availability
function verifyPortAvailable(port) {
  log(`🔍 Verifying port ${port} is available...`, 'yellow');
  
  try {
    if (os.platform() === 'win32') {
      const netstatOutput = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
      if (netstatOutput.trim()) {
        log(`⚠️ Port ${port} appears to be in use`, 'yellow');
        return false;
      }
    } else {
      const lsofOutput = execSync(`lsof -i:${port}`, { encoding: 'utf8' });
      if (lsofOutput.trim()) {
        log(`⚠️ Port ${port} appears to be in use`, 'yellow');
        return false;
      }
    }
    log(`✓ Port ${port} is available`, 'green');
    return true;
  } catch (error) {
    // Command failed, which likely means port is available
    log(`✓ Port ${port} is available`, 'green');
    return true;
  }
}

// Function to clear npm cache
function clearNpmCache() {
  log('🧹 Clearing npm cache...', 'yellow');
  try {
    execSync('npm cache clean --force', { stdio: 'pipe' });
    log('✓ npm cache cleared', 'green');
  } catch (error) {
    log(`⚠️ Could not clear npm cache: ${error.message}`, 'yellow');
  }
}

// Function to check if all dependencies are installed
function checkDependencies() {
  log('📦 Checking dependencies...', 'yellow');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  
  if (!fs.existsSync(packageJsonPath)) {
    log('❌ package.json not found!', 'red');
    return false;
  }
  
  if (!fs.existsSync(nodeModulesPath)) {
    log('⚠️ node_modules directory not found. Running npm install...', 'yellow');
    try {
      execSync('npm install', { stdio: 'inherit' });
      log('✓ Dependencies installed', 'green');
    } catch (error) {
      log(`❌ Failed to install dependencies: ${error.message}`, 'red');
      return false;
    }
  } else {
    log('✓ Dependencies appear to be installed', 'green');
  }
  
  return true;
}

// Enhanced function to start development server
function startDevServer(port = 3000) {
  displayBanner();
  
  // Step 1: Check dependencies
  if (!checkDependencies()) {
    log('\n❌ Dependency check failed. Please resolve the issues above and try again.', 'red');
    process.exit(1);
  }
  
  // Step 2: Terminate conflicting processes
  terminateConflictingProcesses(port);
  
  // Step 3: Remove lock files
  removeLockFiles();
  
  // Step 4: Clear npm cache
  clearNpmCache();
  
  // Step 5: Verify port is available
  if (!verifyPortAvailable(port)) {
    log(`\n❌ Port ${port} is still in use. Please manually free the port and try again.`, 'red');
    log('You can:', 'white');
    log(`  1. Close the application using port ${port}`, 'white');
    log(`  2. Use a different port with: npm run dev -- --port=3001`, 'white');
    log(`  3. Run the cleanup script: node startup-server.js --cleanup-only`, 'white');
    process.exit(1);
  }
  
  // Step 6: Start the server
  log('\n🌟 Starting development server...', 'cyan');
  log(`📱 Server will be available at: http://localhost:${port}`, 'white');
  log(`⏹️  Press Ctrl+C to stop the server\n`, 'white');
  
  try {
    // Use spawn instead of execSync to better handle the server process
    const serverProcess = spawn('npx', ['next', 'dev', '--port', port], {
      stdio: 'inherit',
      shell: true
    });
    
    // Handle process termination
    process.on('SIGINT', () => {
      log('\n🛑 Received SIGINT, shutting down gracefully...', 'yellow');
      serverProcess.kill('SIGINT');
    });
    
    process.on('SIGTERM', () => {
      log('\n🛑 Received SIGTERM, shutting down gracefully...', 'yellow');
      serverProcess.kill('SIGTERM');
    });
    
    serverProcess.on('error', (error) => {
      log(`\n❌ Error starting server: ${error.message}`, 'red');
      process.exit(1);
    });
    
    serverProcess.on('exit', (code) => {
      log(`\n📋 Server process exited with code ${code}`, 'white');
      process.exit(code);
    });
    
  } catch (error) {
    log(`\n❌ Error starting server on port ${port}: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Function to perform a complete cleanup without starting the server
function performCleanup() {
  displayBanner();
  log('🧹 Performing complete cleanup...', 'cyan');
  log('='.repeat(70), 'cyan');
  
  // Terminate all Node.js processes on common development ports
  const ports = [3000, 3001, 3002, 8000, 8080];
  ports.forEach(port => {
    terminateConflictingProcesses(port);
  });
  
  // Remove all lock files
  removeLockFiles();
  
  // Clear npm cache
  clearNpmCache();
  
  log('\n✅ Cleanup completed successfully!', 'green');
  log('You can now start the development server with:', 'white');
  log('  npm run dev', 'cyan');
  log('  node startup-server.js', 'cyan');
  log('  start-dev-server.bat', 'cyan');
  
  // Exit with success code
  process.exit(0);
}

// Function to display help information
function displayHelp() {
  displayBanner();
  log('USAGE:', 'bright');
  log('  node startup-server.js [options]', 'white');
  log('\nOPTIONS:', 'bright');
  log('  --port=<number>     Specify port number (default: 3000)', 'white');
  log('  --cleanup-only      Perform cleanup without starting server', 'white');
  log('  --help              Display this help message', 'white');
  log('\nEXAMPLES:', 'bright');
  log('  node startup-server.js                 # Start on default port 3000', 'white');
  log('  node startup-server.js --port=3001     # Start on port 3001', 'white');
  log('  node startup-server.js --cleanup-only   # Cleanup only', 'white');
  log('\nPACKAGE.JSON SCRIPTS:', 'bright');
  log('  npm run dev           # Start on port 3000', 'white');
  log('  npm run dev:3001       # Start on port 3001', 'white');
  log('  npm run dev:3002       # Start on port 3002', 'white');
  log('  npm run dev:clean      # Cleanup and start on port 3000', 'white');
  log('  npm run dev:multi      # Start multiple servers on ports 3000, 3001, 3002', 'white');
}

// Main execution logic
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    displayHelp();
  } else if (args.includes('--cleanup-only')) {
    performCleanup();
  } else {
    const portArg = args.find(arg => arg.startsWith('--port='));
    const port = portArg ? parseInt(portArg.split('=')[1]) : (args[0] && !args[0].startsWith('--') ? parseInt(args[0]) : 3000);
    
    if (isNaN(port) || port < 1 || port > 65535) {
      log('❌ Invalid port number. Please provide a valid port between 1 and 65535.', 'red');
      log('Use --help for more information.', 'white');
      process.exit(1);
    }
    
    startDevServer(port);
  }
}

module.exports = { 
  removeLockFiles, 
  startDevServer, 
  terminateConflictingProcesses, 
  verifyPortAvailable, 
  clearNpmCache,
  performCleanup,
  checkDependencies
};