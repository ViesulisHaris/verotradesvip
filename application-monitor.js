const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 ===== APPLICATION MONITOR =====');
console.log('🎯 Target: Prevent future white screen issues');

// Monitor application health
class ApplicationMonitor {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.successes = [];
  }

  // Check build integrity
  checkBuildIntegrity() {
    console.log('\n🏗️ ===== CHECKING BUILD INTEGRITY =====');
    
    try {
      // Check if .next exists and is valid
      if (fs.existsSync('.next')) {
        const nextStats = fs.statSync('.next');
        const age = Date.now() - nextStats.mtime.getTime();
        const ageMinutes = Math.floor(age / (1000 * 60));
        
        if (ageMinutes > 30) {
          this.warnings.push(`⚠️ Build cache is ${ageMinutes} minutes old - consider clearing`);
        } else {
          this.successes.push(`✅ Build cache is fresh (${ageMinutes} minutes old)`);
        }
        
        // Check for critical build files
        const criticalFiles = [
          '.next/server/pages/_app.js',
          '.next/server/pages/_document.js',
          '.next/server/app/page.js'
        ];
        
        criticalFiles.forEach(file => {
          if (fs.existsSync(file)) {
            this.successes.push(`✅ Critical build file exists: ${file}`);
          } else {
            this.issues.push(`❌ Missing critical build file: ${file}`);
          }
        });
      } else {
        this.warnings.push('⚠️ No build cache found - will be created on next build');
      }
    } catch (error) {
      this.issues.push(`❌ Error checking build integrity: ${error.message}`);
    }
  }

  // Check dependency integrity
  checkDependencyIntegrity() {
    console.log('\n📦 ===== CHECKING DEPENDENCY INTEGRITY =====');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      // Check for critical dependencies
      const criticalDeps = ['next', 'react', 'react-dom'];
      criticalDeps.forEach(dep => {
        const version = packageJson.dependencies[dep] || packageJson.devDependencies[dep];
        if (version) {
          this.successes.push(`✅ ${dep}: ${version}`);
        } else {
          this.issues.push(`❌ Missing critical dependency: ${dep}`);
        }
      });
      
      // Check for styled-jsx resolution
      if (packageJson.resolutions && packageJson.resolutions['styled-jsx']) {
        this.successes.push(`✅ styled-jsx resolution: ${packageJson.resolutions['styled-jsx']}`);
      } else {
        this.issues.push('❌ Missing styled-jsx resolution');
      }
      
      // Check node_modules
      if (fs.existsSync('node_modules')) {
        this.successes.push('✅ node_modules directory exists');
        
        // Check for critical modules
        const criticalModules = [
          'node_modules/next',
          'node_modules/react',
          'node_modules/react-dom',
          'node_modules/styled-jsx',
          'node_modules/critters'
        ];
        
        criticalModules.forEach(module => {
          if (fs.existsSync(module)) {
            this.successes.push(`✅ Module exists: ${module}`);
          } else {
            this.issues.push(`❌ Missing module: ${module}`);
          }
        });
      } else {
        this.issues.push('❌ node_modules directory missing');
      }
    } catch (error) {
      this.issues.push(`❌ Error checking dependencies: ${error.message}`);
    }
  }

  // Check error boundary implementation
  checkErrorBoundary() {
    console.log('\n🛡️ ===== CHECKING ERROR BOUNDARY =====');
    
    try {
      const layoutContent = fs.readFileSync('src/app/layout.tsx', 'utf8');
      const errorBoundaryContent = fs.readFileSync('src/components/EmergencyErrorBoundary.tsx', 'utf8');
      
      const checks = [
        {
          name: 'Error boundary imported',
          test: layoutContent.includes('import EmergencyErrorBoundary'),
          critical: true
        },
        {
          name: 'Error boundary used',
          test: layoutContent.includes('<EmergencyErrorBoundary>'),
          critical: true
        },
        {
          name: 'Error handling implemented',
          test: errorBoundaryContent.includes('componentDidCatch'),
          critical: true
        },
        {
          name: 'Error recovery UI',
          test: errorBoundaryContent.includes('Refresh Page'),
          critical: false
        }
      ];
      
      checks.forEach(check => {
        if (check.test) {
          this.successes.push(`✅ ${check.name}`);
        } else {
          const severity = check.critical ? '❌' : '⚠️';
          this.issues.push(`${severity} ${check.name}`);
        }
      });
    } catch (error) {
      this.issues.push(`❌ Error checking error boundary: ${error.message}`);
    }
  }

  // Check configuration
  checkConfiguration() {
    console.log('\n⚙️ ===== CHECKING CONFIGURATION =====');
    
    try {
      const nextConfig = fs.readFileSync('next.config.js', 'utf8');
      
      const configChecks = [
        {
          name: 'Webpack configuration',
          test: nextConfig.includes('webpack'),
          critical: true
        },
        {
          name: 'Experimental features',
          test: nextConfig.includes('experimental'),
          critical: false
        },
        {
          name: 'Styled-jsx configuration',
          test: nextConfig.includes('styled-jsx'),
          critical: true
        }
      ];
      
      configChecks.forEach(check => {
        if (check.test) {
          this.successes.push(`✅ ${check.name}`);
        } else {
          const severity = check.critical ? '❌' : '⚠️';
          this.issues.push(`${severity} ${check.name}`);
        }
      });
    } catch (error) {
      this.issues.push(`❌ Error checking configuration: ${error.message}`);
    }
  }

  // Generate recommendations
  generateRecommendations() {
    console.log('\n💡 ===== RECOMMENDATIONS =====');
    
    if (this.issues.length > 0) {
      console.log('🚨 CRITICAL ISSUES FOUND:');
      this.issues.forEach(issue => console.log(`  ${issue}`));
      
      console.log('\n🔧 IMMEDIATE ACTIONS REQUIRED:');
      console.log('1. Address all critical issues (❌)');
      console.log('2. Clear build cache: rmdir /s /q .next');
      console.log('3. Reinstall dependencies: npm install --force');
      console.log('4. Restart development server: npm run dev');
    } else {
      console.log('✅ No critical issues found');
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:');
      this.warnings.forEach(warning => console.log(`  ${warning}`));
    }
    
    console.log('\n🔍 PREVENTIVE MEASURES:');
    console.log('1. Run monitor before starting development: node application-monitor.js');
    console.log('2. Clear build cache weekly: rmdir /s /q .next');
    console.log('3. Update dependencies regularly: npm update');
    console.log('4. Monitor error logs for patterns');
    console.log('5. Test error boundary functionality');
  }

  // Generate health score
  generateHealthScore() {
    const totalChecks = this.successes.length + this.issues.length + this.warnings.length;
    const healthScore = Math.round((this.successes.length / totalChecks) * 100);
    
    console.log('\n📊 ===== APPLICATION HEALTH SCORE =====');
    console.log(`🎯 Health Score: ${healthScore}%`);
    console.log(`✅ Successes: ${this.successes.length}`);
    console.log(`❌ Issues: ${this.issues.length}`);
    console.log(`⚠️ Warnings: ${this.warnings.length}`);
    
    if (healthScore >= 90) {
      console.log('🎉 EXCELLENT - Application is very stable');
    } else if (healthScore >= 75) {
      console.log('✅ GOOD - Application is mostly stable');
    } else if (healthScore >= 60) {
      console.log('⚠️ FAIR - Application has some issues');
    } else {
      console.log('🚨 POOR - Application needs immediate attention');
    }
    
    return healthScore;
  }

  // Run full health check
  runHealthCheck() {
    console.log('🚀 Starting application health check...\n');
    
    this.checkBuildIntegrity();
    this.checkDependencyIntegrity();
    this.checkErrorBoundary();
    this.checkConfiguration();
    
    const healthScore = this.generateHealthScore();
    this.generateRecommendations();
    
    console.log('\n🔍 ===== HEALTH CHECK COMPLETE =====');
    
    return {
      healthScore,
      successes: this.successes.length,
      issues: this.issues.length,
      warnings: this.warnings.length,
      isStable: healthScore >= 75 && this.issues.length === 0
    };
  }
}

// Auto-fix common issues
function autoFixIssues() {
  console.log('\n🔧 ===== AUTO-FIX COMMON ISSUES =====');
  
  try {
    // Fix 1: Clear build cache if old
    if (fs.existsSync('.next')) {
      const stats = fs.statSync('.next');
      const age = Date.now() - stats.mtime.getTime();
      const ageHours = Math.floor(age / (1000 * 60 * 60));
      
      if (ageHours > 2) {
        console.log('🧹 Clearing old build cache...');
        execSync('rmdir /s /q .next', { stdio: 'inherit' });
        console.log('✅ Build cache cleared');
      }
    }
    
    // Fix 2: Check for missing critical dependencies
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      if (!packageJson.resolutions || !packageJson.resolutions['styled-jsx']) {
        console.log('📦 Adding styled-jsx resolution...');
        packageJson.resolutions = packageJson.resolutions || {};
        packageJson.resolutions['styled-jsx'] = '^5.1.0';
        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
        console.log('✅ styled-jsx resolution added');
      }
    } catch (error) {
      console.log(`❌ Error fixing package.json: ${error.message}`);
    }
    
    console.log('🔧 Auto-fix complete');
  } catch (error) {
    console.log(`❌ Auto-fix failed: ${error.message}`);
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const autoFix = args.includes('--auto-fix');
  
  if (autoFix) {
    autoFixIssues();
  }
  
  const monitor = new ApplicationMonitor();
  const result = monitor.runHealthCheck();
  
  // Exit with appropriate code
  process.exit(result.isStable ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = ApplicationMonitor;