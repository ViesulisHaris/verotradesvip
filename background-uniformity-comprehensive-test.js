const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * Comprehensive Background Uniformity Test
 * 
 * This test verifies that the entire dashboard has a completely uniform background
 * after all the background pattern fixes have been implemented.
 */

class BackgroundUniformityTest {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.testResults = {
      timestamp: new Date().toISOString(),
      testType: 'Background Uniformity Comprehensive Test',
      results: {
        fullPageScreenshot: null,
        vRatingCardArea: null,
        balatroWebGLArea: null,
        authProviderArea: null,
        tradeModalArea: null,
        visualArtifacts: [],
        colorAnalysis: {},
        uniformityScore: 0
      },
      artifacts: [],
      status: 'pending'
    };
  }

  async initialize() {
    console.log('🚀 Initializing Background Uniformity Test...');
    
    // Launch browser with specific viewport sizes to test different screen sizes
    this.browser = await chromium.launch({ 
      headless: true,
      args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
    });
    
    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    
    this.page = await this.context.newPage();
    
    // Enable console logging from the page
    this.page.on('console', msg => {
      console.log('PAGE LOG:', msg.text());
    });
    
    // Enable network logging
    this.page.on('response', response => {
      if (response.url().includes('supabase') || response.url().includes('api')) {
        console.log('API Response:', response.url(), response.status());
      }
    });
  }

  async navigateToDashboard() {
    console.log('📍 Navigating to dashboard...');
    
    try {
      // First navigate to the login page
      await this.page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
      
      // Wait for page to load
      await this.page.waitForTimeout(2000);
      
      // Check if we need to log in
      const loginForm = await this.page.$('form[data-testid="login-form"], form');
      
      if (loginForm) {
        console.log('🔐 Logging in...');
        
        // Fill in login credentials
        await this.page.fill('input[type="email"], input[name="email"]', 'test@example.com');
        await this.page.fill('input[type="password"], input[name="password"]', 'testpassword123');
        
        // Submit login form
        await Promise.all([
          this.page.waitForNavigation({ waitUntil: 'networkidle' }),
          this.page.click('button[type="submit"], button:has-text("Sign"), button:has-text("Login")')
        ]);
        
        await this.page.waitForTimeout(3000);
      }
      
      // Navigate to dashboard
      await this.page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
      
      // Wait for dashboard to fully load
      await this.page.waitForTimeout(5000);
      
      console.log('✅ Successfully navigated to dashboard');
      return true;
    } catch (error) {
      console.error('❌ Failed to navigate to dashboard:', error);
      return false;
    }
  }

  async takeFullPageScreenshot() {
    console.log('📸 Taking full page screenshot...');
    
    try {
      const timestamp = Date.now();
      const filename = `background-uniformity-full-page-${timestamp}.png`;
      const filepath = path.join(process.cwd(), filename);
      
      await this.page.screenshot({ 
        path: filepath,
        fullPage: true,
        type: 'png'
      });
      
      this.testResults.artifacts.push({
        type: 'fullPageScreenshot',
        filename: filename,
        filepath: filepath,
        timestamp: new Date().toISOString()
      });
      
      this.testResults.results.fullPageScreenshot = filename;
      console.log(`✅ Full page screenshot saved: ${filename}`);
      return filepath;
    } catch (error) {
      console.error('❌ Failed to take full page screenshot:', error);
      return null;
    }
  }

  async analyzeBackgroundUniformity() {
    console.log('🔍 Analyzing background uniformity...');
    
    try {
      // Get the computed background styles for key elements
      const backgroundAnalysis = await this.page.evaluate(() => {
        const results = {
          bodyBackground: '',
          dashboardBackground: '',
          vRatingCardBackgrounds: [],
          balatroBackground: '',
          modalBackgrounds: [],
          conflictingElements: []
        };
        
        // Analyze body background
        const body = document.body;
        const bodyStyles = window.getComputedStyle(body);
        results.bodyBackground = {
          backgroundColor: bodyStyles.backgroundColor,
          backgroundImage: bodyStyles.backgroundImage,
          background: bodyStyles.background
        };
        
        // Analyze main dashboard container
        const dashboard = document.querySelector('[data-testid="dashboard"], .dashboard, main, #root > div > div');
        if (dashboard) {
          const dashboardStyles = window.getComputedStyle(dashboard);
          results.dashboardBackground = {
            backgroundColor: dashboardStyles.backgroundColor,
            backgroundImage: dashboardStyles.backgroundImage,
            background: dashboardStyles.background
          };
        }
        
        // Analyze VRating cards
        const vRatingCards = document.querySelectorAll('[data-testid*="vrating"], [class*="vrating"], [class*="VRating"]');
        vRatingCards.forEach((card, index) => {
          const cardStyles = window.getComputedStyle(card);
          results.vRatingCardBackgrounds.push({
            index: index,
            backgroundColor: cardStyles.backgroundColor,
            backgroundImage: cardStyles.backgroundImage,
            background: cardStyles.background
          });
        });
        
        // Analyze Balatro WebGL canvas
        const balatroCanvas = document.querySelector('#balatro-canvas, [data-testid="balatro"], canvas');
        if (balatroCanvas) {
          const balatroStyles = window.getComputedStyle(balatroCanvas);
          results.balatroBackground = {
            backgroundColor: balatroStyles.backgroundColor,
            backgroundImage: balatroStyles.backgroundImage,
            background: balatroStyles.background
          };
        }
        
        // Check for any elements with background patterns or gradients
        const allElements = document.querySelectorAll('*');
        allElements.forEach(element => {
          const styles = window.getComputedStyle(element);
          if (styles.backgroundImage && styles.backgroundImage !== 'none') {
            // Check if it's a pattern or gradient that shouldn't be there
            if (styles.backgroundImage.includes('pattern') || 
                styles.backgroundImage.includes('gradient') ||
                styles.backgroundImage.includes('url')) {
              results.conflictingElements.push({
                tagName: element.tagName,
                className: element.className,
                id: element.id,
                backgroundImage: styles.backgroundImage,
                backgroundColor: styles.backgroundColor
              });
            }
          }
        });
        
        return results;
      });
      
      this.testResults.results.colorAnalysis = backgroundAnalysis;
      
      // Check for uniformity issues
      const uniformityIssues = [];
      
      // Check if body has conflicting background
      if (backgroundAnalysis.bodyBackground.backgroundImage && 
          backgroundAnalysis.bodyBackground.backgroundImage !== 'none') {
        uniformityIssues.push({
          type: 'bodyBackgroundConflict',
          description: 'Body has background image/pattern that may interfere',
          details: backgroundAnalysis.bodyBackground
        });
      }
      
      // Check VRating cards for patterns
      backgroundAnalysis.vRatingCardBackgrounds.forEach(card => {
        if (card.backgroundImage && card.backgroundImage !== 'none') {
          uniformityIssues.push({
            type: 'vRatingCardPattern',
            description: 'VRating card has background pattern',
            details: card
          });
        }
      });
      
      // Check for any conflicting elements
      if (backgroundAnalysis.conflictingElements.length > 0) {
        uniformityIssues.push({
          type: 'conflictingElements',
          description: 'Elements with background patterns detected',
          details: backgroundAnalysis.conflictingElements
        });
      }
      
      this.testResults.results.visualArtifacts = uniformityIssues;
      
      // Calculate uniformity score (0-100, where 100 is perfectly uniform)
      const baseScore = 100;
      const deductions = uniformityIssues.length * 15; // Deduct 15 points per issue
      this.testResults.results.uniformityScore = Math.max(0, baseScore - deductions);
      
      console.log(`📊 Background uniformity score: ${this.testResults.results.uniformityScore}/100`);
      console.log(`🔍 Found ${uniformityIssues.length} potential uniformity issues`);
      
      return backgroundAnalysis;
    } catch (error) {
      console.error('❌ Failed to analyze background uniformity:', error);
      return null;
    }
  }

  async captureSpecificAreas() {
    console.log('📷 Capturing specific areas for detailed analysis...');
    
    try {
      const timestamp = Date.now();
      
      // Capture VRating card area
      const vRatingElements = await this.page.$$('[data-testid*="vrating"], [class*="vrating"], [class*="VRating"]');
      if (vRatingElements.length > 0) {
        const vRatingFilename = `background-uniformity-vrating-${timestamp}.png`;
        await vRatingElements[0].screenshot({ path: vRatingFilename });
        
        this.testResults.artifacts.push({
          type: 'vRatingCardArea',
          filename: vRatingFilename,
          timestamp: new Date().toISOString()
        });
        
        this.testResults.results.vRatingCardArea = vRatingFilename;
        console.log(`✅ VRating card area screenshot saved: ${vRatingFilename}`);
      }
      
      // Capture Balatro WebGL area
      const balatroCanvas = await this.page.$('#balatro-canvas, [data-testid="balatro"], canvas');
      if (balatroCanvas) {
        const balatroFilename = `background-uniformity-balatro-${timestamp}.png`;
        await balatroCanvas.screenshot({ path: balatroFilename });
        
        this.testResults.artifacts.push({
          type: 'balatroWebGLArea',
          filename: balatroFilename,
          timestamp: new Date().toISOString()
        });
        
        this.testResults.results.balatroWebGLArea = balatroFilename;
        console.log(`✅ Balatro WebGL area screenshot saved: ${balatroFilename}`);
      }
      
      // Capture any modal areas (if present)
      const modalElements = await this.page.$$('.modal, [role="dialog"], [data-testid*="modal"]');
      if (modalElements.length > 0) {
        const modalFilename = `background-uniformity-modal-${timestamp}.png`;
        await modalElements[0].screenshot({ path: modalFilename });
        
        this.testResults.artifacts.push({
          type: 'tradeModalArea',
          filename: modalFilename,
          timestamp: new Date().toISOString()
        });
        
        this.testResults.results.tradeModalArea = modalFilename;
        console.log(`✅ Modal area screenshot saved: ${modalFilename}`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Failed to capture specific areas:', error);
      return false;
    }
  }

  async testBalatroWebGLUniformity() {
    console.log('🎮 Testing Balatro WebGL background uniformity...');
    
    try {
      // Check if Balatro WebGL is properly rendering with uniform background
      const balatroTest = await this.page.evaluate(() => {
        const canvas = document.querySelector('#balatro-canvas, [data-testid="balatro"], canvas');
        if (!canvas) {
          return { status: 'not_found', message: 'Balatro canvas not found' };
        }
        
        // Get canvas context and check for uniform background
        const ctx = canvas.getContext('webgl') || canvas.getContext('2d');
        if (!ctx) {
          return { status: 'no_context', message: 'Could not get canvas context' };
        }
        
        // Check canvas dimensions
        const dimensions = {
          width: canvas.width,
          height: canvas.height,
          clientWidth: canvas.clientWidth,
          clientHeight: canvas.clientHeight
        };
        
        // Check if canvas is properly sized
        const isProperlySized = dimensions.width > 0 && dimensions.height > 0;
        
        // Check for any visual artifacts by sampling pixels
        let hasUniformBackground = true;
        let backgroundColor = null;
        
        if (ctx.readPixels) {
          try {
            // Sample a few pixels to check for uniformity
            const pixels = new Uint8Array(4);
            ctx.readPixels(0, 0, 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, pixels);
            backgroundColor = `rgba(${pixels[0]}, ${pixels[1]}, ${pixels[2]}, ${pixels[3]/255})`;
            
            // Sample a few more pixels to compare
            for (let i = 0; i < 5; i++) {
              const x = Math.floor(Math.random() * dimensions.width);
              const y = Math.floor(Math.random() * dimensions.height);
              ctx.readPixels(x, y, 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, pixels);
              const currentColor = `rgba(${pixels[0]}, ${pixels[1]}, ${pixels[2]}, ${pixels[3]/255})`;
              
              if (currentColor !== backgroundColor) {
                hasUniformBackground = false;
                break;
              }
            }
          } catch (e) {
            console.log('Could not read pixels from canvas:', e);
          }
        }
        
        return {
          status: 'success',
          dimensions,
          isProperlySized,
          hasUniformBackground,
          backgroundColor,
          canvasStyles: window.getComputedStyle(canvas)
        };
      });
      
      this.testResults.results.balatroWebGLArea = balatroTest;
      
      if (balatroTest.status === 'success') {
        console.log(`✅ Balatro WebGL test completed`);
        console.log(`   - Properly sized: ${balatroTest.isProperlySized}`);
        console.log(`   - Uniform background: ${balatroTest.hasUniformBackground}`);
        console.log(`   - Background color: ${balatroTest.backgroundColor}`);
      } else {
        console.log(`⚠️ Balatro WebGL test issue: ${balatroTest.message}`);
      }
      
      return balatroTest;
    } catch (error) {
      console.error('❌ Failed to test Balatro WebGL uniformity:', error);
      return null;
    }
  }

  async generateTestReport() {
    console.log('📋 Generating comprehensive test report...');
    
    try {
      const reportTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportFilename = `BACKGROUND_UNIFORMITY_COMPREHENSIVE_TEST_REPORT_${reportTimestamp}.md`;
      
      // Calculate overall test status
      const uniformityScore = this.testResults.results.uniformityScore;
      const visualArtifacts = this.testResults.results.visualArtifacts.length;
      
      let overallStatus = 'PASS';
      if (uniformityScore < 80 || visualArtifacts > 2) {
        overallStatus = 'FAIL';
      } else if (uniformityScore < 95 || visualArtifacts > 0) {
        overallStatus = 'WARNING';
      }
      
      this.testResults.status = overallStatus;
      
      const report = `# Background Uniformity Comprehensive Test Report

**Test Date:** ${new Date().toLocaleString()}
**Test Type:** Background Uniformity Verification
**Overall Status:** ${overallStatus}
**Uniformity Score:** ${uniformityScore}/100
**Visual Artifacts Found:** ${visualArtifacts}

## Executive Summary

${overallStatus === 'PASS' ? 
  '✅ **PASSED**: The dashboard has achieved a completely uniform background with no visible patterns or artifacts.' :
  overallStatus === 'WARNING' ? 
  '⚠️ **WARNING**: The dashboard has mostly uniform background but minor issues were detected.' :
  '❌ **FAILED**: The dashboard still has background uniformity issues that need to be addressed.'
}

## Test Results

### Background Analysis

**Body Background:**
\`\`\`json
${JSON.stringify(this.testResults.results.colorAnalysis.bodyBackground || {}, null, 2)}
\`\`\`

**Dashboard Background:**
\`\`\`json
${JSON.stringify(this.testResults.results.colorAnalysis.dashboardBackground || {}, null, 2)}
\`\`\`

**VRating Card Backgrounds:**
\`\`\`json
${JSON.stringify(this.testResults.results.colorAnalysis.vRatingCardBackgrounds || [], null, 2)}
\`\`\`

### Visual Artifacts Detected

${visualArtifacts === 0 ? 
  '✅ No visual artifacts detected.' :
  `⚠️ ${visualArtifacts} visual artifact(s) detected:\n\n` +
  this.testResults.results.visualArtifacts.map((artifact, index) => 
    `**${index + 1}. ${artifact.type}**\n${artifact.description}\n\`\`\`json\n${JSON.stringify(artifact.details, null, 2)}\n\`\`\`\n`
  ).join('\n')
}

### Balatro WebGL Analysis

\`\`\`json
${JSON.stringify(this.testResults.results.balatroWebGLArea || {}, null, 2)}
\`\`\`

## Test Artifacts

The following screenshots were captured during testing:

${this.testResults.artifacts.map(artifact => 
  `- **${artifact.type}**: \`${artifact.filename}\``
).join('\n')}

## Detailed Test Data

\`\`\`json
${JSON.stringify(this.testResults, null, 2)}
\`\`\`

## Recommendations

${overallStatus === 'PASS' ? 
  '✅ All background uniformity issues have been successfully resolved. The dashboard now provides a consistent visual experience.' :
  overallStatus === 'WARNING' ? 
  '⚠️ Minor background uniformity issues remain. Consider addressing the detected artifacts for optimal visual consistency.' :
  '❌ Significant background uniformity issues require immediate attention. Review the detected artifacts and implement necessary fixes.'
}

---
*Report generated by Background Uniformity Comprehensive Test*
*Timestamp: ${this.testResults.timestamp}*
`;

      // Save the report
      fs.writeFileSync(reportFilename, report);
      
      // Also save the raw test data as JSON
      const jsonFilename = `background-uniformity-test-results-${reportTimestamp}.json`;
      fs.writeFileSync(jsonFilename, JSON.stringify(this.testResults, null, 2));
      
      console.log(`📋 Test report saved: ${reportFilename}`);
      console.log(`📊 Test data saved: ${jsonFilename}`);
      
      return { reportFilename, jsonFilename };
    } catch (error) {
      console.error('❌ Failed to generate test report:', error);
      return null;
    }
  }

  async cleanup() {
    console.log('🧹 Cleaning up test resources...');
    
    try {
      if (this.page) {
        await this.page.close();
      }
      if (this.context) {
        await this.context.close();
      }
      if (this.browser) {
        await this.browser.close();
      }
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }

  async runTest() {
    console.log('🎯 Starting Background Uniformity Comprehensive Test...\n');
    
    try {
      // Initialize test environment
      await this.initialize();
      
      // Navigate to dashboard
      const navigationSuccess = await this.navigateToDashboard();
      if (!navigationSuccess) {
        throw new Error('Failed to navigate to dashboard');
      }
      
      // Take full page screenshot
      await this.takeFullPageScreenshot();
      
      // Analyze background uniformity
      await this.analyzeBackgroundUniformity();
      
      // Capture specific areas
      await this.captureSpecificAreas();
      
      // Test Balatro WebGL uniformity
      await this.testBalatroWebGLUniformity();
      
      // Generate comprehensive report
      const reportFiles = await this.generateTestReport();
      
      console.log('\n🎉 Background Uniformity Comprehensive Test completed!');
      console.log(`📊 Uniformity Score: ${this.testResults.results.uniformityScore}/100`);
      console.log(`🔍 Visual Artifacts: ${this.testResults.results.visualArtifacts.length}`);
      console.log(`📋 Status: ${this.testResults.status}`);
      
      if (reportFiles) {
        console.log(`📄 Report: ${reportFiles.reportFilename}`);
        console.log(`📊 Data: ${reportFiles.jsonFilename}`);
      }
      
      return this.testResults;
    } catch (error) {
      console.error('❌ Test failed:', error);
      this.testResults.status = 'ERROR';
      this.testResults.error = error.message;
      return this.testResults;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  const test = new BackgroundUniformityTest();
  test.runTest()
    .then(results => {
      console.log('\n🏁 Test execution completed');
      process.exit(results.status === 'PASS' ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = BackgroundUniformityTest;