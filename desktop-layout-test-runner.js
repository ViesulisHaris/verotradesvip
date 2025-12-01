/**
 * Desktop Layout Test Runner
 * Comprehensive testing to verify NUCLEAR fix has eliminated mobile-like appearance on desktop
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class DesktopLayoutTestRunner {
  constructor() {
    this.results = [];
    this.screenshots = [];
    this.testStartTime = new Date();
  }

  async runTests() {
    console.log('🚀 Starting Desktop Layout Verification Tests...');
    console.log('Testing NUCLEAR fix for mobile-like appearance elimination\n');

    const browser = await puppeteer.launch({
      headless: false, // Set to true for automated testing
      defaultViewport: null,
      args: ['--start-maximized']
    });

    try {
      const page = await browser.newPage();
      
      // Enable request interception for better performance
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        if (req.resourceType() === 'image' && !req.url().includes('data:')) {
          req.abort();
        } else {
          req.continue();
        }
      });

      // Test configurations
      const testConfigs = [
        { name: 'Mobile Small', width: 375, height: 667, type: 'mobile' },
        { name: 'Mobile Large', width: 414, height: 896, type: 'mobile' },
        { name: 'Tablet', width: 768, height: 1024, type: 'tablet' },
        { name: 'Desktop Small', width: 1024, height: 768, type: 'desktop' },
        { name: 'Desktop Medium', width: 1280, height: 800, type: 'desktop' },
        { name: 'Desktop Large', width: 1440, height: 900, type: 'desktop' },
        { name: 'Desktop Ultra', width: 1920, height: 1080, type: 'desktop' },
        { name: 'Desktop Ultra Wide', width: 2560, height: 1440, type: 'desktop' }
      ];

      // Run tests for each viewport
      for (const config of testConfigs) {
        console.log(`📱 Testing ${config.name} (${config.width}x${config.height})...`);
        
        const result = await this.testViewport(page, config);
        this.results.push(result);
        
        // Take screenshot
        const screenshotPath = await this.takeScreenshot(page, config);
        this.screenshots.push({
          config,
          path: screenshotPath
        });

        console.log(`   ✅ Content Utilization: ${result.metrics.contentUtilization.toFixed(1)}%`);
        console.log(`   📊 Sidebar Type: ${result.metrics.sidebarType}`);
        console.log(`   🔍 Mobile-Like: ${result.hasMobileLikeAppearance ? 'YES ❌' : 'NO ✅'}\n`);
      }

      // Generate comprehensive report
      await this.generateReport();

      console.log('📊 Test Summary:');
      console.log(`   Total Tests: ${this.results.length}`);
      console.log(`   Passed: ${this.results.filter(r => !r.hasMobileLikeAppearance).length}`);
      console.log(`   Failed: ${this.results.filter(r => r.hasMobileLikeAppearance).length}`);
      console.log(`   Average Content Utilization: ${this.getAverageUtilization().toFixed(1)}%`);

    } finally {
      await browser.close();
    }
  }

  async testViewport(page, config) {
    // Set viewport size
    await page.setViewport({ width: config.width, height: config.height });
    
    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for content to load
    await page.waitForSelector('[class*="card-luxury"], [class*="dashboard-card"], main', {
      timeout: 10000
    });

    // Wait a bit more for any animations to settle
    await page.waitForTimeout(1000);

    // Get layout metrics
    const metrics = await page.evaluate(() => {
      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Find main content area
      const mainElement = document.querySelector('main') || document.body;
      const mainRect = mainElement.getBoundingClientRect();
      
      // Find sidebar elements
      const desktopSidebar = document.querySelector('aside[class*="lg:flex"]') || 
                           document.querySelector('[class*="hidden lg:flex"]');
      const mobileSidebar = document.querySelector('aside[class*="lg:hidden"]') || 
                           document.querySelector('[class*="hidden lg:block"]');

      // Calculate sidebar metrics
      let sidebarType = 'none';
      let sidebarWidth = 0;
      
      if (desktopSidebar && window.getComputedStyle(desktopSidebar).display !== 'none') {
        sidebarType = 'desktop';
        sidebarWidth = desktopSidebar.offsetWidth;
      } else if (mobileSidebar && window.getComputedStyle(mobileSidebar).display !== 'none') {
        sidebarType = 'mobile';
        sidebarWidth = mobileSidebar.offsetWidth;
      }

      // Calculate content utilization
      const contentAreaWidth = mainRect.width;
      const contentUtilization = viewportWidth > 0 ? (contentAreaWidth / viewportWidth) * 100 : 0;

      // Check for horizontal overflow
      const hasHorizontalOverflow = document.documentElement.scrollWidth > viewportWidth;

      // Check for mobile-like indicators
      const bodyStyle = window.getComputedStyle(document.body);
      const hasMobileConstraints = bodyStyle.maxWidth === 'none' || 
                                 bodyStyle.width === '100%' ||
                                 bodyStyle.overflowX === 'hidden';

      // Check if sidebar is properly positioned
      const sidebarStyle = desktopSidebar ? window.getComputedStyle(desktopSidebar) : null;
      const sidebarPositionedCorrectly = desktopSidebar ? 
        (sidebarStyle.position === 'fixed' || sidebarStyle.position === 'absolute') : true;

      return {
        viewportWidth,
        viewportHeight,
        contentAreaWidth,
        contentUtilization,
        sidebarType,
        sidebarWidth,
        hasHorizontalOverflow,
        hasMobileConstraints,
        sidebarPositionedCorrectly,
        bodyOverflowX: bodyStyle.overflowX,
        bodyMaxWidth: bodyStyle.maxWidth,
        bodyWidth: bodyStyle.width
      };
    });

    // Determine if mobile-like appearance exists
    const hasMobileLikeAppearance = config.type === 'desktop' && (
      metrics.contentUtilization < 75 || // Content uses less than 75% of available width
      metrics.sidebarType === 'mobile' || // Mobile sidebar on desktop
      metrics.hasHorizontalOverflow || // Horizontal overflow detected
      !metrics.sidebarPositionedCorrectly || // Sidebar not positioned correctly
      metrics.bodyOverflowX === 'hidden' // Body has overflow hidden (mobile pattern)
    );

    return {
      config,
      metrics,
      hasMobileLikeAppearance,
      timestamp: new Date().toISOString()
    };
  }

  async takeScreenshot(page, config) {
    const screenshotDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    const filename = `desktop-layout-${config.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`;
    const screenshotPath = path.join(screenshotDir, filename);

    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
      type: 'png'
    });

    return screenshotPath;
  }

  getAverageUtilization() {
    if (this.results.length === 0) return 0;
    const total = this.results.reduce((sum, result) => sum + result.metrics.contentUtilization, 0);
    return total / this.results.length;
  }

  async generateReport() {
    const reportData = {
      testInfo: {
        timestamp: this.testStartTime.toISOString(),
        duration: (new Date() - this.testStartTime) / 1000,
        testName: 'Desktop Layout Verification - NUCLEAR Fix',
        description: 'Comprehensive test to verify elimination of mobile-like appearance on desktop screens'
      },
      summary: {
        totalTests: this.results.length,
        passedTests: this.results.filter(r => !r.hasMobileLikeAppearance).length,
        failedTests: this.results.filter(r => r.hasMobileLikeAppearance).length,
        averageContentUtilization: this.getAverageUtilization(),
        nuclearFixStatus: this.results.filter(r => r.hasMobileLikeAppearance).length === 0 ? 'SUCCESS ✅' : 'FAILED ❌'
      },
      results: this.results.map(result => ({
        viewport: {
          name: result.config.name,
          width: result.config.width,
          height: result.config.height,
          type: result.config.type
        },
        metrics: {
          contentAreaWidth: result.metrics.contentAreaWidth,
          contentUtilization: Math.round(result.metrics.contentUtilization * 10) / 10,
          sidebarType: result.metrics.sidebarType,
          sidebarWidth: result.metrics.sidebarWidth,
          hasHorizontalOverflow: result.metrics.hasHorizontalOverflow,
          bodyOverflowX: result.metrics.bodyOverflowX,
          bodyMaxWidth: result.metrics.bodyMaxWidth,
          bodyWidth: result.metrics.bodyWidth
        },
        status: {
          hasMobileLikeAppearance: result.hasMobileLikeAppearance,
          status: result.hasMobileLikeAppearance ? 'FAILED' : 'PASSED'
        },
        timestamp: result.timestamp
      })),
      screenshots: this.screenshots.map(screenshot => ({
        viewport: screenshot.config.name,
        path: path.basename(screenshot.path)
      })),
      recommendations: this.generateRecommendations()
    };

    // Save JSON report
    const reportPath = path.join(__dirname, `desktop-layout-test-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

    // Generate HTML report
    const htmlReport = this.generateHTMLReport(reportData);
    const htmlReportPath = path.join(__dirname, `desktop-layout-test-report-${Date.now()}.html`);
    fs.writeFileSync(htmlReportPath, htmlReport);

    console.log(`📄 Reports generated:`);
    console.log(`   JSON: ${reportPath}`);
    console.log(`   HTML: ${htmlReportPath}`);

    return reportData;
  }

  generateRecommendations() {
    const recommendations = [];
    const failedResults = this.results.filter(r => r.hasMobileLikeAppearance);

    if (failedResults.length === 0) {
      recommendations.push({
        type: 'success',
        title: '✅ NUCLEAR Fix Successful',
        description: 'All desktop viewports pass the layout test. Mobile-like appearance has been eliminated.'
      });
    } else {
      recommendations.push({
        type: 'error',
        title: '❌ NUCLEAR Fix Incomplete',
        description: `${failedResults.length} desktop viewports still show mobile-like appearance.`
      });

      // Analyze common issues
      const lowUtilization = failedResults.filter(r => r.metrics.contentUtilization < 75);
      const mobileSidebar = failedResults.filter(r => r.metrics.sidebarType === 'mobile');
      const overflowIssues = failedResults.filter(r => r.metrics.hasHorizontalOverflow);

      if (lowUtilization.length > 0) {
        recommendations.push({
          type: 'warning',
          title: '📏 Low Content Utilization',
          description: `${lowUtilization.length} viewports have content utilization below 75%. Consider adjusting container widths or margins.`
        });
      }

      if (mobileSidebar.length > 0) {
        recommendations.push({
          type: 'warning',
          title: '📱 Mobile Sidebar on Desktop',
          description: `${mobileSidebar.length} desktop viewports are showing mobile sidebar. Check responsive breakpoint logic.`
        });
      }

      if (overflowIssues.length > 0) {
        recommendations.push({
          type: 'warning',
          title: '↔️ Horizontal Overflow',
          description: `${overflowIssues.length} viewports have horizontal overflow. Review container constraints and overflow settings.`
        });
      }
    }

    return recommendations;
  }

  generateHTMLReport(reportData) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Desktop Layout Verification Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #B89B5E, #D6C7B2);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        .summary-card h3 {
            margin: 0 0 10px 0;
            color: #666;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .summary-card .value {
            font-size: 32px;
            font-weight: bold;
            margin: 0;
        }
        .passed { color: #4A7C59; }
        .failed { color: #C46A5A; }
        .warning { color: #D6A75A; }
        .results-table {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        .results-table table {
            width: 100%;
            border-collapse: collapse;
        }
        .results-table th,
        .results-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        .results-table th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #666;
        }
        .status-passed {
            background-color: #d4edda;
            color: #155724;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
        }
        .status-failed {
            background-color: #f8d7da;
            color: #721c24;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
        }
        .recommendations {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .recommendation {
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 6px;
            border-left: 4px solid;
        }
        .recommendation.success {
            background-color: #d4edda;
            border-left-color: #4A7C59;
        }
        .recommendation.error {
            background-color: #f8d7da;
            border-left-color: #C46A5A;
        }
        .recommendation.warning {
            background-color: #fff3cd;
            border-left-color: #D6A75A;
        }
        .screenshot-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .screenshot-card {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .screenshot-card img {
            width: 100%;
            height: auto;
            display: block;
        }
        .screenshot-card .caption {
            padding: 15px;
            background: #f8f9fa;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🖥️ Desktop Layout Verification Report</h1>
        <p>NUCLEAR Fix Test Results - ${reportData.testInfo.timestamp}</p>
        <p>Test Duration: ${reportData.testInfo.duration.toFixed(2)} seconds</p>
    </div>

    <div class="summary">
        <div class="summary-card">
            <h3>Total Tests</h3>
            <p class="value">${reportData.summary.totalTests}</p>
        </div>
        <div class="summary-card">
            <h3>Passed</h3>
            <p class="value passed">${reportData.summary.passedTests}</p>
        </div>
        <div class="summary-card">
            <h3>Failed</h3>
            <p class="value failed">${reportData.summary.failedTests}</p>
        </div>
        <div class="summary-card">
            <h3>Avg Utilization</h3>
            <p class="value">${reportData.summary.averageContentUtilization.toFixed(1)}%</p>
        </div>
        <div class="summary-card">
            <h3>NUCLEAR Fix Status</h3>
            <p class="value ${reportData.summary.failedTests === 0 ? 'passed' : 'failed'}">
                ${reportData.summary.nuclearFixStatus}
            </p>
        </div>
    </div>

    <div class="results-table">
        <table>
            <thead>
                <tr>
                    <th>Viewport</th>
                    <th>Size</th>
                    <th>Content Utilization</th>
                    <th>Sidebar Type</th>
                    <th>Horizontal Overflow</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${reportData.results.map(result => `
                    <tr>
                        <td><strong>${result.viewport.name}</strong></td>
                        <td>${result.viewport.width}×${result.viewport.height}</td>
                        <td>
                            <span class="${result.metrics.contentUtilization >= 75 ? 'passed' : 'failed'}">
                                ${result.metrics.contentUtilization.toFixed(1)}%
                            </span>
                        </td>
                        <td class="${result.metrics.sidebarType === 'desktop' ? 'passed' : 'failed'}">
                            ${result.metrics.sidebarType}
                        </td>
                        <td>${result.metrics.hasHorizontalOverflow ? 'Yes ❌' : 'No ✅'}</td>
                        <td>
                            <span class="status-${result.status.toLowerCase()}">
                                ${result.status}
                            </span>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="recommendations">
        <h2>📋 Recommendations</h2>
        ${reportData.recommendations.map(rec => `
            <div class="recommendation ${rec.type}">
                <h3>${rec.title}</h3>
                <p>${rec.description}</p>
            </div>
        `).join('')}
    </div>

    <div class="screenshot-grid">
        ${reportData.screenshots.map(screenshot => `
            <div class="screenshot-card">
                <img src="screenshots/${screenshot.path}" alt="${screenshot.viewport} screenshot">
                <div class="caption">${screenshot.viewport}</div>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  const testRunner = new DesktopLayoutTestRunner();
  testRunner.runTests().catch(console.error);
}

module.exports = DesktopLayoutTestRunner;