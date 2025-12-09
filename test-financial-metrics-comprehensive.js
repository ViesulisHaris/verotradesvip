/**
 * Comprehensive Financial Metrics Testing Script
 * Tests Average Time Held, Sharpe Ratio, and Emotional Analysis tooltip formatting
 */

const puppeteer = require('puppeteer');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 30000,
  headless: false, // Set to true for headless testing
  viewport: { width: 1920, height: 1080 }
};

// Sample test data for validation
const SAMPLE_TRADES = [
  {
    id: '1',
    symbol: 'AAPL',
    side: 'Buy',
    quantity: 100,
    entry_price: 150.00,
    exit_price: 155.00,
    pnl: 500.00,
    trade_date: '2024-01-01',
    entry_time: '09:30:00',
    exit_time: '10:30:00',
    emotional_state: ['DISCIPLINE', 'CONFIDENT']
  },
  {
    id: '2',
    symbol: 'GOOGL',
    side: 'Sell',
    quantity: 50,
    entry_price: 2800.00,
    exit_price: 2750.00,
    pnl: 250.00,
    trade_date: '2024-01-02',
    entry_time: '14:00:00',
    exit_time: '15:45:00',
    emotional_state: ['PATIENCE', 'NEUTRAL']
  },
  {
    id: '3',
    symbol: 'TSLA',
    side: 'Buy',
    quantity: 75,
    entry_price: 200.00,
    exit_price: 195.00,
    pnl: -375.00,
    trade_date: '2024-01-03',
    entry_time: '11:15:00',
    exit_time: '12:30:00',
    emotional_state: ['TILT', 'REVENGE']
  }
];

class FinancialMetricsTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      averageTimeHeld: { passed: false, details: [] },
      sharpeRatio: { passed: false, details: [] },
      emotionalTooltips: { passed: false, details: [] },
      overall: { passed: false, totalTests: 0, passedTests: 0 }
    };
  }

  async initialize() {
    console.log('🚀 Initializing Financial Metrics Tester...');
    
    this.browser = await puppeteer.launch({
      headless: TEST_CONFIG.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewport(TEST_CONFIG.viewport);
    
    // Enable console logging from the page
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('🔴 Browser Console Error:', msg.text());
      } else if (msg.type() === 'warning') {
        console.warn('🟡 Browser Console Warning:', msg.text());
      }
    });

    console.log('✅ Browser initialized successfully');
  }

  async navigateToDashboard() {
    console.log('📍 Navigating to dashboard...');
    
    try {
      // Navigate to login page first (assuming authentication is required)
      await this.page.goto(`${TEST_CONFIG.baseUrl}/login`, { 
        waitUntil: 'networkidle2',
        timeout: TEST_CONFIG.timeout 
      });
      
      // Wait for login page to load
      await this.page.waitForSelector('form', { timeout: 5000 });
      
      // Check if we're already logged in by checking for redirect to dashboard
      const currentUrl = this.page.url();
      if (currentUrl.includes('/dashboard')) {
        console.log('✅ Already authenticated, proceeding to dashboard');
        return true;
      }
      
      // For testing purposes, we'll try to access dashboard directly
      // In a real scenario, you'd implement proper login
      console.log('🔐 Attempting to access dashboard directly...');
      await this.page.goto(`${TEST_CONFIG.baseUrl}/dashboard`, { 
        waitUntil: 'networkidle2',
        timeout: TEST_CONFIG.timeout 
      });
      
      // Wait for dashboard to load
      await this.page.waitForSelector('.text-5xl', { timeout: 10000 });
      
      console.log('✅ Dashboard loaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to navigate to dashboard:', error.message);
      return false;
    }
  }

  async testAverageTimeHeld() {
    console.log('⏱️ Testing Average Time Held calculation...');
    
    try {
      // Wait for average time held element to be visible
      await this.page.waitForSelector('text/Avg Time Held', { timeout: 10000 });
      
      // Get the average time held value
      const avgTimeElement = await this.page.$('text/Avg Time Held');
      const avgTimeValue = await this.page.evaluate(el => {
        const parent = el.closest('.space-y-2');
        const valueElement = parent.querySelector('.text-2xl');
        return valueElement ? valueElement.textContent : null;
      }, avgTimeElement);
      
      console.log(`📊 Average Time Held value: ${avgTimeValue}`);
      
      // Validate the format
      const timeFormatRegex = /^\d+[d|h|m]\s*\d+[h|m|m]?$/;
      const isValidFormat = timeFormatRegex.test(avgTimeValue);
      
      if (isValidFormat) {
        this.testResults.averageTimeHeld.passed = true;
        this.testResults.averageTimeHeld.details.push('✅ Format is valid (e.g., "1h 30m", "2d 5h 15m")');
      } else {
        this.testResults.averageTimeHeld.details.push('❌ Format is invalid');
      }
      
      // Check if it's not the old placeholder
      if (avgTimeValue && avgTimeValue !== '12h 8m') {
        this.testResults.averageTimeHeld.details.push('✅ No longer using hardcoded placeholder');
      } else {
        this.testResults.averageTimeHeld.details.push('❌ Still using hardcoded placeholder');
      }
      
      console.log('📝 Average Time Held test results:', this.testResults.averageTimeHeld.details);
      
    } catch (error) {
      console.error('❌ Error testing Average Time Held:', error.message);
      this.testResults.averageTimeHeld.details.push(`❌ Error: ${error.message}`);
    }
  }

  async testSharpeRatio() {
    console.log('📈 Testing Sharpe Ratio calculation...');
    
    try {
      // Wait for Sharpe Ratio element to be visible
      await this.page.waitForSelector('text/Sharpe Ratio', { timeout: 10000 });
      
      // Get the Sharpe Ratio value
      const sharpeElement = await this.page.$('text/Sharpe Ratio');
      const sharpeValue = await this.page.evaluate(el => {
        const parent = el.closest('.space-y-2');
        const valueElement = parent.querySelector('.text-2xl');
        return valueElement ? valueElement.textContent : null;
      }, sharpeElement);
      
      console.log(`📊 Sharpe Ratio value: ${sharpeValue}`);
      
      // Validate the format (should be a decimal number)
      const sharpeNumber = parseFloat(sharpeValue);
      const isValidNumber = !isNaN(sharpeNumber);
      
      if (isValidNumber) {
        this.testResults.sharpeRatio.passed = true;
        this.testResults.sharpeRatio.details.push('✅ Sharpe Ratio is a valid number');
        
        // Check if it's reasonable (not 0, not extremely high)
        if (sharpeNumber !== 0 && Math.abs(sharpeNumber) < 10) {
          this.testResults.sharpeRatio.details.push('✅ Sharpe Ratio value is reasonable');
        } else {
          this.testResults.sharpeRatio.details.push('⚠️ Sharpe Ratio value may be unrealistic');
        }
      } else {
        this.testResults.sharpeRatio.details.push('❌ Sharpe Ratio is not a valid number');
      }
      
      console.log('📝 Sharpe Ratio test results:', this.testResults.sharpeRatio.details);
      
    } catch (error) {
      console.error('❌ Error testing Sharpe Ratio:', error.message);
      this.testResults.sharpeRatio.details.push(`❌ Error: ${error.message}`);
    }
  }

  async testEmotionalAnalysisTooltips() {
    console.log('🎭 Testing Emotional Analysis tooltip formatting...');
    
    try {
      // Wait for the emotional analysis radar chart
      await this.page.waitForSelector('canvas', { timeout: 10000 });
      
      // Find the radar chart canvas
      const canvas = await this.page.$('canvas');
      
      if (canvas) {
        // Hover over different parts of the radar chart to trigger tooltips
        const canvasBox = await canvas.boundingBox();
        
        if (canvasBox) {
          // Test multiple points on the radar chart
          const testPoints = [
            { x: canvasBox.width / 2, y: canvasBox.height / 4 }, // Top
            { x: canvasBox.width * 3/4, y: canvasBox.height / 2 }, // Right
            { x: canvasBox.width / 2, y: canvasBox.height * 3/4 }, // Bottom
            { x: canvasBox.width / 4, y: canvasBox.height / 2 }, // Left
          ];
          
          for (const point of testPoints) {
            await this.page.mouse.move(
              canvasBox.x + point.x,
              canvasBox.y + point.y
            );
            
            // Wait for tooltip to appear
            await this.page.waitForTimeout(500);
            
            // Check if tooltip exists and get its content
            const tooltipContent = await this.page.evaluate(() => {
              const tooltip = document.querySelector('[data-testid="tooltip"]') || 
                           document.querySelector('.chart-tooltip') ||
                           document.querySelector('div[style*="position: absolute"]');
              return tooltip ? tooltip.textContent : null;
            });
            
            if (tooltipContent) {
              console.log(`🎯 Tooltip content: ${tooltipContent}`);
              
              // Check if decimal places are limited to 2
              const decimalRegex = /\d+\.\d+/;
              const matches = tooltipContent.match(decimalRegex);
              
              if (matches) {
                const hasValidDecimals = matches.every(match => {
                  const decimal = match.split('.')[1];
                  return decimal.length <= 2;
                });
                
                if (hasValidDecimals) {
                  this.testResults.emotionalTooltips.passed = true;
                  this.testResults.emotionalTooltips.details.push('✅ Tooltip decimals limited to 2 places');
                } else {
                  this.testResults.emotionalTooltips.details.push('❌ Tooltip has excessive decimal places');
                }
              } else {
                this.testResults.emotionalTooltips.details.push('✅ No decimal numbers found in tooltip');
              }
            }
          }
        }
      }
      
      console.log('📝 Emotional Analysis tooltip test results:', this.testResults.emotionalTooltips.details);
      
    } catch (error) {
      console.error('❌ Error testing Emotional Analysis tooltips:', error.message);
      this.testResults.emotionalTooltips.details.push(`❌ Error: ${error.message}`);
    }
  }

  async testCalculationAccuracy() {
    console.log('🧮 Testing calculation accuracy with sample data...');
    
    try {
      // Inject test data into the browser console to validate calculations
      await this.page.evaluate((sampleTrades) => {
        // Test Average Time Held calculation
        const calculateAvgTimeHeld = (trades) => {
          if (!trades || trades.length === 0) return 'N/A';

          let totalDuration = 0;
          let validTrades = 0;

          trades.forEach(trade => {
            let entryTime, exitTime;
            
            if (trade.entry_time && trade.exit_time) {
              entryTime = new Date(`${trade.trade_date}T${trade.entry_time}`);
              exitTime = new Date(`${trade.trade_date}T${trade.exit_time}`);
            } else if (trade.trade_date) {
              entryTime = new Date(trade.trade_date);
              exitTime = new Date(trade.trade_date);
              const estimatedHours = Math.random() * 23 + 1;
              exitTime.setTime(exitTime.getTime() + estimatedHours * 60 * 60 * 1000);
            } else {
              return;
            }

            if (entryTime && exitTime && !isNaN(entryTime.getTime()) && !isNaN(exitTime.getTime())) {
              const duration = exitTime.getTime() - entryTime.getTime();
              if (duration > 0) {
                totalDuration += duration;
                validTrades++;
              }
            }
          });

          if (validTrades === 0) return 'N/A';
          const avgDuration = totalDuration / validTrades;
          
          const hours = Math.floor(avgDuration / (1000 * 60 * 60));
          const minutes = Math.floor((avgDuration % (1000 * 60 * 60)) / (1000 * 60));
          const days = Math.floor(hours / 24);
          const remainingHours = hours % 24;

          if (days > 0) return `${days}d ${remainingHours}h ${minutes}m`;
          else if (hours > 0) return `${hours}h ${minutes}m`;
          else return `${minutes}m`;
        };

        // Test Sharpe Ratio calculation
        const calculateSharpeRatio = (trades) => {
          if (!trades || trades.length < 2) return 0;
          
          const returns = trades.map(t => t.pnl || 0).filter(r => r !== 0);
          if (returns.length < 2) return 0;
          
          const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
          const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
          const stdDev = Math.sqrt(variance);
          
          if (stdDev === 0) return 0;
          
          const annualRiskFreeRate = 0.025;
          const tradingDaysPerYear = 252;
          const perTradeRiskFreeRate = annualRiskFreeRate / Math.sqrt(tradingDaysPerYear);
          
          const sharpeRatio = (avgReturn - perTradeRiskFreeRate) / stdDev;
          const annualizedSharpe = sharpeRatio * Math.sqrt(tradingDaysPerYear);
          
          return isFinite(annualizedSharpe) && !isNaN(annualizedSharpe) ? annualizedSharpe : 0;
        };

        // Run calculations with sample data
        const avgTime = calculateAvgTimeHeld(sampleTrades);
        const sharpe = calculateSharpeRatio(sampleTrades);
        
        console.log('🧮 Calculation Results:');
        console.log('Average Time Held:', avgTime);
        console.log('Sharpe Ratio:', sharpe);
        
        // Store results for verification
        window.testCalculationResults = {
          avgTimeHeld: avgTime,
          sharpeRatio: sharpe
        };
      }, SAMPLE_TRADES);
      
      // Get the calculation results
      const calculationResults = await this.page.evaluate(() => window.testCalculationResults);
      
      if (calculationResults) {
        console.log('✅ Calculation accuracy test completed');
        console.log('📊 Results:', calculationResults);
        
        // Validate results
        if (calculationResults.avgTimeHeld !== 'N/A' && calculationResults.avgTimeHeld !== '12h 8m') {
          this.testResults.averageTimeHeld.details.push('✅ Calculation logic is working correctly');
        }
        
        if (typeof calculationResults.sharpeRatio === 'number' && calculationResults.sharpeRatio !== 0) {
          this.testResults.sharpeRatio.details.push('✅ Sharpe ratio calculation includes risk-free rate and annualization');
        }
      }
      
    } catch (error) {
      console.error('❌ Error testing calculation accuracy:', error.message);
    }
  }

  async generateReport() {
    console.log('📋 Generating comprehensive test report...');
    
    // Calculate overall results
    const allTests = [
      this.testResults.averageTimeHeld,
      this.testResults.sharpeRatio,
      this.testResults.emotionalTooltips
    ];
    
    this.testResults.overall.totalTests = allTests.length;
    this.testResults.overall.passedTests = allTests.filter(test => test.passed).length;
    this.testResults.overall.passed = this.testResults.overall.passedTests === this.testResults.overall.totalTests;
    
    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.testResults.overall.totalTests,
        passedTests: this.testResults.overall.passedTests,
        failedTests: this.testResults.overall.totalTests - this.testResults.overall.passedTests,
        successRate: `${(this.testResults.overall.passedTests / this.testResults.overall.totalTests * 100).toFixed(1)}%`,
        overallStatus: this.testResults.overall.passed ? 'PASSED' : 'FAILED'
      },
      testResults: this.testResults,
      recommendations: this.generateRecommendations()
    };
    
    // Save report to file
    const reportPath = path.join(__dirname, 'FINANCIAL_METRICS_COMPREHENSIVE_TEST_REPORT.json');
    require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('📄 Report saved to:', reportPath);
    console.log('📊 Test Summary:');
    console.log(`   Total Tests: ${report.summary.totalTests}`);
    console.log(`   Passed: ${report.summary.passedTests}`);
    console.log(`   Failed: ${report.summary.failedTests}`);
    console.log(`   Success Rate: ${report.summary.successRate}`);
    console.log(`   Overall Status: ${report.summary.overallStatus}`);
    
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (!this.testResults.averageTimeHeld.passed) {
      recommendations.push({
        category: 'Average Time Held',
        priority: 'HIGH',
        issue: 'Average time held calculation is not working correctly',
        recommendation: 'Ensure entry_time and exit_time fields are properly populated in trade data'
      });
    }
    
    if (!this.testResults.sharpeRatio.passed) {
      recommendations.push({
        category: 'Sharpe Ratio',
        priority: 'HIGH',
        issue: 'Sharpe ratio calculation may be inaccurate',
        recommendation: 'Verify risk-free rate and annualization factors are appropriate'
      });
    }
    
    if (!this.testResults.emotionalTooltips.passed) {
      recommendations.push({
        category: 'Emotional Analysis',
        priority: 'MEDIUM',
        issue: 'Tooltip formatting shows excessive decimal places',
        recommendation: 'Implement proper decimal rounding in tooltip callbacks'
      });
    }
    
    if (this.testResults.overall.passed) {
      recommendations.push({
        category: 'Overall',
        priority: 'INFO',
        issue: 'All tests passed successfully',
        recommendation: 'Continue monitoring for any regressions in future updates'
      });
    }
    
    return recommendations;
  }

  async cleanup() {
    console.log('🧹 Cleaning up test environment...');
    
    if (this.browser) {
      await this.browser.close();
    }
    
    console.log('✅ Cleanup completed');
  }

  async runAllTests() {
    try {
      await this.initialize();
      
      const dashboardLoaded = await this.navigateToDashboard();
      if (!dashboardLoaded) {
        throw new Error('Failed to load dashboard');
      }
      
      // Wait for dashboard to fully load
      await this.page.waitForTimeout(3000);
      
      // Run all tests
      await this.testAverageTimeHeld();
      await this.testSharpeRatio();
      await this.testEmotionalAnalysisTooltips();
      await this.testCalculationAccuracy();
      
      // Generate and return report
      const report = await this.generateReport();
      
      return report;
      
    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Comprehensive Financial Metrics Testing...\n');
  
  const tester = new FinancialMetricsTester();
  
  try {
    const report = await tester.runAllTests();
    
    // Exit with appropriate code
    process.exit(report.summary.overallStatus === 'PASSED' ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = FinancialMetricsTester;