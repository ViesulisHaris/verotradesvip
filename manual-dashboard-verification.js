/**
 * Manual Dashboard Verification Script
 * Performs comprehensive checks without requiring Puppeteer
 */

const fs = require('fs');
const path = require('path');

class ManualDashboardVerifier {
  constructor() {
    this.verificationResults = {
      dashboardStructure: { passed: 0, failed: 0, details: [] },
      interactiveEffects: { passed: 0, failed: 0, details: [] },
      componentImplementation: { passed: 0, failed: 0, details: [] },
      stylingAndDesign: { passed: 0, failed: 0, details: [] },
      functionality: { passed: 0, failed: 0, details: [] }
    };
  }

  async verifyDashboardStructure() {
    console.log('\n🏗️ Verifying Dashboard Structure...');
    
    try {
      // Check dashboard page exists
      const dashboardPath = path.join(process.cwd(), 'src/app/dashboard/page.tsx');
      if (fs.existsSync(dashboardPath)) {
        this.verificationResults.dashboardStructure.passed++;
        this.verificationResults.dashboardStructure.details.push('✅ Dashboard page file exists');
      } else {
        this.verificationResults.dashboardStructure.failed++;
        this.verificationResults.dashboardStructure.details.push('❌ Dashboard page file missing');
      }

      // Check dashboard content
      const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
      
      // Verify key components are imported
      const requiredImports = [
        'useAuth',
        'AuthGuard', 
        'UnifiedLayout',
        'PnLChart',
        'EmotionRadar'
      ];
      
      requiredImports.forEach(importName => {
        if (dashboardContent.includes(importName)) {
          this.verificationResults.dashboardStructure.passed++;
          this.verificationResults.dashboardStructure.details.push(`✅ ${importName} imported`);
        } else {
          this.verificationResults.dashboardStructure.failed++;
          this.verificationResults.dashboardStructure.details.push(`❌ ${importName} not imported`);
        }
      });

      // Check for key sections
      const requiredSections = [
        'Key Metrics',
        'P&L Performance', 
        'Emotional Analysis',
        'Recent Trades'
      ];
      
      requiredSections.forEach(section => {
        if (dashboardContent.includes(section)) {
          this.verificationResults.dashboardStructure.passed++;
          this.verificationResults.dashboardStructure.details.push(`✅ ${section} section found`);
        } else {
          this.verificationResults.dashboardStructure.failed++;
          this.verificationResults.dashboardStructure.details.push(`❌ ${section} section missing`);
        }
      });

    } catch (error) {
      this.verificationResults.dashboardStructure.failed++;
      this.verificationResults.dashboardStructure.details.push(`❌ Structure verification error: ${error.message}`);
    }
  }

  async verifyInteractiveEffects() {
    console.log('\n✨ Verifying Interactive Effects...');
    
    try {
      // Check home page for interactive effects
      const homePagePath = path.join(process.cwd(), 'src/app/page.tsx');
      if (fs.existsSync(homePagePath)) {
        const homePageContent = fs.readFileSync(homePagePath, 'utf8');
        
        // Check for TorchCard usage
        if (homePageContent.includes('TorchCard')) {
          this.verificationResults.interactiveEffects.passed++;
          this.verificationResults.interactiveEffects.details.push('✅ TorchCard component used');
        } else {
          this.verificationResults.interactiveEffects.failed++;
          this.verificationResults.interactiveEffects.details.push('❌ TorchCard component not used');
        }

        // Check for TextReveal usage
        if (homePageContent.includes('TextReveal')) {
          this.verificationResults.interactiveEffects.passed++;
          this.verificationResults.interactiveEffects.details.push('✅ TextReveal component used');
        } else {
          this.verificationResults.interactiveEffects.failed++;
          this.verificationResults.interactiveEffects.details.push('❌ TextReveal component not used');
        }

        // Check for scroll animations
        if (homePageContent.includes('scroll-item')) {
          this.verificationResults.interactiveEffects.passed++;
          this.verificationResults.interactiveEffects.details.push('✅ Scroll animations implemented');
        } else {
          this.verificationResults.interactiveEffects.failed++;
          this.verificationResults.interactiveEffects.details.push('❌ Scroll animations not implemented');
        }

        // Check for flashlight effect classes
        if (homePageContent.includes('flashlight-card')) {
          this.verificationResults.interactiveEffects.passed++;
          this.verificationResults.interactiveEffects.details.push('✅ Flashlight effect classes used');
        } else {
          this.verificationResults.interactiveEffects.failed++;
          this.verificationResults.interactiveEffects.details.push('❌ Flashlight effect classes not used');
        }
      }

      // Check if TorchCard component exists
      const torchCardPath = path.join(process.cwd(), 'src/components/TorchCard.tsx');
      if (fs.existsSync(torchCardPath)) {
        const torchCardContent = fs.readFileSync(torchCardPath, 'utf8');
        
        // Check for mouse tracking
        if (torchCardContent.includes('--mouse-x') && torchCardContent.includes('--mouse-y')) {
          this.verificationResults.interactiveEffects.passed++;
          this.verificationResults.interactiveEffects.details.push('✅ Mouse tracking CSS variables implemented');
        } else {
          this.verificationResults.interactiveEffects.failed++;
          this.verificationResults.interactiveEffects.details.push('❌ Mouse tracking CSS variables missing');
        }

        // Check for mouse event handlers
        if (torchCardContent.includes('handleMouseMove') && torchCardContent.includes('handleMouseEnter')) {
          this.verificationResults.interactiveEffects.passed++;
          this.verificationResults.interactiveEffects.details.push('✅ Mouse event handlers implemented');
        } else {
          this.verificationResults.interactiveEffects.failed++;
          this.verificationResults.interactiveEffects.details.push('❌ Mouse event handlers missing');
        }
      }

      // Check if TextReveal component exists
      const textRevealPath = path.join(process.cwd(), 'src/components/TextReveal.tsx');
      if (fs.existsSync(textRevealPath)) {
        const textRevealContent = fs.readFileSync(textRevealPath, 'utf8');
        
        // Check for character animation
        if (textRevealContent.includes('translateY(110%)')) {
          this.verificationResults.interactiveEffects.passed++;
          this.verificationResults.interactiveEffects.details.push('✅ Character animation implemented');
        } else {
          this.verificationResults.interactiveEffects.failed++;
          this.verificationResults.interactiveEffects.details.push('❌ Character animation missing');
        }

        // Check for staggered delays
        if (textRevealContent.includes('0.05s')) {
          this.verificationResults.interactiveEffects.passed++;
          this.verificationResults.interactiveEffects.details.push('✅ Staggered delays implemented');
        } else {
          this.verificationResults.interactiveEffects.failed++;
          this.verificationResults.interactiveEffects.details.push('❌ Staggered delays missing');
        }
      }

    } catch (error) {
      this.verificationResults.interactiveEffects.failed++;
      this.verificationResults.interactiveEffects.details.push(`❌ Interactive effects verification error: ${error.message}`);
    }
  }

  async verifyComponentImplementation() {
    console.log('\n🧩 Verifying Component Implementation...');
    
    try {
      // Check key components exist
      const requiredComponents = [
        'src/components/TorchCard.tsx',
        'src/components/TextReveal.tsx',
        'src/components/charts/PnLChart.tsx',
        'src/components/EmotionRadar.tsx',
        'src/components/AuthGuard.tsx',
        'src/components/layout/UnifiedLayout.tsx'
      ];
      
      requiredComponents.forEach(componentPath => {
        const fullPath = path.join(process.cwd(), componentPath);
        if (fs.existsSync(fullPath)) {
          this.verificationResults.componentImplementation.passed++;
          this.verificationResults.componentImplementation.details.push(`✅ ${componentPath} exists`);
        } else {
          this.verificationResults.componentImplementation.failed++;
          this.verificationResults.componentImplementation.details.push(`❌ ${componentPath} missing`);
        }
      });

      // Check PnLChart implementation
      const pnlChartPath = path.join(process.cwd(), 'src/components/charts/PnLChart.tsx');
      if (fs.existsSync(pnlChartPath)) {
        const pnlChartContent = fs.readFileSync(pnlChartPath, 'utf8');
        
        if (pnlChartContent.includes('recharts') || pnlChartContent.includes('Chart')) {
          this.verificationResults.componentImplementation.passed++;
          this.verificationResults.componentImplementation.details.push('✅ PnLChart uses charting library');
        } else {
          this.verificationResults.componentImplementation.failed++;
          this.verificationResults.componentImplementation.details.push('❌ PnLChart missing charting library');
        }
      }

      // Check EmotionRadar implementation
      const emotionRadarPath = path.join(process.cwd(), 'src/components/EmotionRadar.tsx');
      if (fs.existsSync(emotionRadarPath)) {
        const emotionRadarContent = fs.readFileSync(emotionRadarPath, 'utf8');
        
        if (emotionRadarContent.includes('RadarChart') || emotionRadarContent.includes('radar')) {
          this.verificationResults.componentImplementation.passed++;
          this.verificationResults.componentImplementation.details.push('✅ EmotionRadar implements radar chart');
        } else {
          this.verificationResults.componentImplementation.failed++;
          this.verificationResults.componentImplementation.details.push('❌ EmotionRadar missing radar chart');
        }
      }

    } catch (error) {
      this.verificationResults.componentImplementation.failed++;
      this.verificationResults.componentImplementation.details.push(`❌ Component implementation verification error: ${error.message}`);
    }
  }

  async verifyStylingAndDesign() {
    console.log('\n🎨 Verifying Styling and Design...');
    
    try {
      // Check globals.css for interactive effects
      const globalsPath = path.join(process.cwd(), 'src/app/globals.css');
      if (fs.existsSync(globalsPath)) {
        const globalsContent = fs.readFileSync(globalsPath, 'utf8');
        
        // Check for flashlight effect CSS
        if (globalsContent.includes('.flashlight-card') && globalsContent.includes('--mouse-x')) {
          this.verificationResults.stylingAndDesign.passed++;
          this.verificationResults.stylingAndDesign.details.push('✅ Flashlight effect CSS implemented');
        } else {
          this.verificationResults.stylingAndDesign.failed++;
          this.verificationResults.stylingAndDesign.details.push('❌ Flashlight effect CSS missing');
        }

        // Check for text reveal animations
        if (globalsContent.includes('@keyframes text-reveal-letter')) {
          this.verificationResults.stylingAndDesign.passed++;
          this.verificationResults.stylingAndDesign.details.push('✅ Text reveal animations implemented');
        } else {
          this.verificationResults.stylingAndDesign.failed++;
          this.verificationResults.stylingAndDesign.details.push('❌ Text reveal animations missing');
        }

        // Check for scroll animations
        if (globalsContent.includes('.scroll-item') && globalsContent.includes('.in-view')) {
          this.verificationResults.stylingAndDesign.passed++;
          this.verificationResults.stylingAndDesign.details.push('✅ Scroll animations implemented');
        } else {
          this.verificationResults.stylingAndDesign.failed++;
          this.verificationResults.stylingAndDesign.details.push('❌ Scroll animations missing');
        }

        // Check for VeroTrade design system
        if (globalsContent.includes('--verotrade-gold-primary')) {
          this.verificationResults.stylingAndDesign.passed++;
          this.verificationResults.stylingAndDesign.details.push('✅ VeroTrade design system colors implemented');
        } else {
          this.verificationResults.stylingAndDesign.failed++;
          this.verificationResults.stylingAndDesign.details.push('❌ VeroTrade design system colors missing');
        }

        // Check for responsive design
        if (globalsContent.includes('@media') && globalsContent.includes('prefers-reduced-motion')) {
          this.verificationResults.stylingAndDesign.passed++;
          this.verificationResults.stylingAndDesign.details.push('✅ Responsive and accessibility considerations implemented');
        } else {
          this.verificationResults.stylingAndDesign.failed++;
          this.verificationResults.stylingAndDesign.details.push('❌ Responsive and accessibility considerations missing');
        }
      }

    } catch (error) {
      this.verificationResults.stylingAndDesign.failed++;
      this.verificationResults.stylingAndDesign.details.push(`❌ Styling verification error: ${error.message}`);
    }
  }

  async verifyFunctionality() {
    console.log('\n⚙️ Verifying Functionality...');
    
    try {
      // Check API routes exist
      const apiRoutes = [
        'src/app/api/trades/route.ts',
        'src/app/api/confluence-trades/route.ts',
        'src/app/api/confluence-stats/route.ts',
        'src/app/api/strategies/route.ts'
      ];
      
      apiRoutes.forEach(routePath => {
        const fullPath = path.join(process.cwd(), routePath);
        if (fs.existsSync(fullPath)) {
          this.verificationResults.functionality.passed++;
          this.verificationResults.functionality.details.push(`✅ ${routePath} exists`);
        } else {
          this.verificationResults.functionality.failed++;
          this.verificationResults.functionality.details.push(`❌ ${routePath} missing`);
        }
      });

      // Check authentication context
      const authContextPath = path.join(process.cwd(), 'src/contexts/AuthContext-simple.tsx');
      if (fs.existsSync(authContextPath)) {
        const authContextContent = fs.readFileSync(authContextPath, 'utf8');
        
        if (authContextContent.includes('useAuth') && authContextContent.includes('SupabaseClient')) {
          this.verificationResults.functionality.passed++;
          this.verificationResults.functionality.details.push('✅ Authentication context properly implemented');
        } else {
          this.verificationResults.functionality.failed++;
          this.verificationResults.functionality.details.push('❌ Authentication context incomplete');
        }
      }

      // Check for optimized queries
      const optimizedQueriesPath = path.join(process.cwd(), 'src/lib/optimized-queries.ts');
      if (fs.existsSync(optimizedQueriesPath)) {
        this.verificationResults.functionality.passed++;
        this.verificationResults.functionality.details.push('✅ Optimized queries implemented');
      } else {
        this.verificationResults.functionality.failed++;
        this.verificationResults.functionality.details.push('❌ Optimized queries missing');
      }

      // Check for utility functions
      const utilsPath = path.join(process.cwd(), 'src/lib/utils.ts');
      if (fs.existsSync(utilsPath)) {
        const utilsContent = fs.readFileSync(utilsPath, 'utf8');
        
        if (utilsContent.includes('formatCurrency')) {
          this.verificationResults.functionality.passed++;
          this.verificationResults.functionality.details.push('✅ Utility functions implemented');
        } else {
          this.verificationResults.functionality.failed++;
          this.verificationResults.functionality.details.push('❌ Utility functions missing');
        }
      }

    } catch (error) {
      this.verificationResults.functionality.failed++;
      this.verificationResults.functionality.details.push(`❌ Functionality verification error: ${error.message}`);
    }
  }

  async generateReport() {
    console.log('\n📋 Generating Verification Report...');
    
    const timestamp = new Date().toISOString();
    let report = `# VeroTrade Dashboard Manual Verification Report\n\n`;
    report += `**Generated:** ${timestamp}\n\n`;
    report += `## Summary\n\n`;
    
    let totalPassed = 0;
    let totalFailed = 0;
    
    Object.entries(this.verificationResults).forEach(([category, results]) => {
      totalPassed += results.passed;
      totalFailed += results.failed;
      
      const total = results.passed + results.failed;
      const passRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
      
      report += `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n`;
      report += `- Passed: ${results.passed}/${total} (${passRate}%)\n`;
      report += `- Failed: ${results.failed}/${total}\n\n`;
    });
    
    const overallPassRate = ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1);
    report += `## Overall Results\n\n`;
    report += `- **Total Passed:** ${totalPassed}\n`;
    report += `- **Total Failed:** ${totalFailed}\n`;
    report += `- **Pass Rate:** ${overallPassRate}%\n\n`;
    
    report += `## Detailed Results\n\n`;
    
    Object.entries(this.verificationResults).forEach(([category, results]) => {
      if (results.details.length > 0) {
        report += `### ${category.charAt(0).toUpperCase() + category.slice(1)} Details\n\n`;
        results.details.forEach(detail => {
          report += `- ${detail}\n`;
        });
        report += '\n';
      }
    });
    
    report += `## Key Findings\n\n`;
    
    // Check if dashboard has interactive effects
    const homePagePath = path.join(process.cwd(), 'src/app/page.tsx');
    const dashboardPath = path.join(process.cwd(), 'src/app/dashboard/page.tsx');
    
    if (fs.existsSync(homePagePath) && fs.existsSync(dashboardPath)) {
      const homePageContent = fs.readFileSync(homePagePath, 'utf8');
      const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
      
      if (homePageContent.includes('TorchCard') && !dashboardContent.includes('TorchCard')) {
        report += `⚠️ **IMPORTANT**: Interactive effects (TorchCard, TextReveal, scroll animations) are implemented on the home page (/) but NOT on the dashboard page (/dashboard).\n\n`;
        report += `The dashboard uses standard dashboard-card classes instead of the interactive TorchCard component.\n\n`;
      }
      
      if (homePageContent.includes('TextReveal') && !dashboardContent.includes('TextReveal')) {
        report += `⚠️ **TextReveal**: Only available on home page, not dashboard.\n\n`;
      }
      
      if (homePageContent.includes('scroll-item') && !dashboardContent.includes('scroll-item')) {
        report += `⚠️ **Scroll Animations**: Only available on home page, not dashboard.\n\n`;
      }
    }
    
    report += `## Recommendations\n\n`;
    
    if (overallPassRate >= 90) {
      report += `✅ **EXCELLENT**: Dashboard structure and components are well implemented.\n`;
    } else if (overallPassRate >= 75) {
      report += `⚠️ **GOOD**: Most components are implemented, but some improvements needed.\n`;
    } else {
      report += `❌ **NEEDS IMPROVEMENT**: Several components are missing or incomplete.\n`;
    }
    
    if (overallPassRate >= 75) {
      report += `\n**To achieve 1:1 HTML specification implementation:**\n`;
      report += `1. Add TorchCard, TextReveal, and scroll animations to the dashboard page\n`;
      report += `2. Ensure all interactive effects work consistently across all pages\n`;
      report += `3. Test cross-browser compatibility\n`;
      report += `4. Verify responsive design on all screen sizes\n`;
    }
    
    // Save report
    const reportPath = path.join(process.cwd(), `dashboard-verification-report-${timestamp.replace(/[:.]/g, '-')}.md`);
    fs.writeFileSync(reportPath, report);
    
    console.log(`📄 Report saved to: ${reportPath}`);
    console.log(`\n🎯 Overall Pass Rate: ${overallPassRate}%`);
    
    return { report, reportPath, overallPassRate };
  }

  async runAllVerifications() {
    try {
      console.log('🔍 Starting Manual Dashboard Verification...');
      
      await this.verifyDashboardStructure();
      await this.verifyInteractiveEffects();
      await this.verifyComponentImplementation();
      await this.verifyStylingAndDesign();
      await this.verifyFunctionality();
      
      const { report, reportPath, overallPassRate } = await this.generateReport();
      
      return {
        success: overallPassRate >= 75,
        report,
        reportPath,
        overallPassRate,
        verificationResults: this.verificationResults
      };
      
    } catch (error) {
      console.error('❌ Verification failed:', error);
      throw error;
    }
  }
}

// Run verification if this file is executed directly
if (require.main === module) {
  const verifier = new ManualDashboardVerifier();
  
  verifier.runAllVerifications()
    .then(results => {
      console.log('\n🎉 Verification completed!');
      console.log(`📊 Overall Pass Rate: ${results.overallPassRate}%`);
      console.log(`📄 Report: ${results.reportPath}`);
      
      if (results.success) {
        console.log('✅ Dashboard structure is well implemented!');
      } else {
        console.log('❌ Some components need improvement.');
      }
      
      process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Verification failed:', error);
      process.exit(1);
    });
}

module.exports = ManualDashboardVerifier;