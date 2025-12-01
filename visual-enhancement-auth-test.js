/**
 * Visual Enhancement Testing with Authentication
 * 
 * This script tests visual enhancements while handling authentication properly
 * 
 * Usage: node visual-enhancement-auth-test.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class VisualEnhancementAuthTester {
    constructor() {
        this.results = {
            dashboardVisualEnhancements: {},
            pnlGraphVisibility: {},
            existingFunctionality: {},
            performance: {},
            crossBrowserCompatibility: {},
            summary: {
                passed: 0,
                failed: 0,
                total: 0
            }
        };
        
        this.testStartTime = Date.now();
        this.screenshots = [];
    }

    async initialize() {
        console.log('🚀 Initializing Visual Enhancement Testing with Authentication...');
        console.log('📋 Test Plan:');
        console.log('   1. Dashboard Visual Enhancements (gradients, shadows, hover states)');
        console.log('   2. P&L Graph Visibility (date labels, axis styling)');
        console.log('   3. Existing Functionality (sidebar transitions, toggle button)');
        console.log('   4. Performance Testing (transition times, animations)');
        console.log('   5. Cross-Browser/Device Compatibility');
        console.log('');
    }

    async runTests() {
        try {
            // Launch browser
            const browser = await puppeteer.launch({
                headless: false, // Set to false for visual debugging
                defaultViewport: { width: 1920, height: 1080 },
                args: ['--start-maximized']
            });

            const page = await browser.newPage();
            
            // Enable console logging from the page
            page.on('console', msg => {
                console.log(`📝 Browser Console: ${msg.text()}`);
            });

            // Navigate to login page first
            console.log('🌐 Navigating to login page...');
            await page.goto('http://localhost:3000/login', { 
                waitUntil: 'networkidle2',
                timeout: 10000 
            });

            // Wait for login form to load
            await page.waitForSelector('input[type="email"], input[type="text"]', { timeout: 5000 });

            // Fill in login credentials (using test user)
            console.log('🔑 Logging in with test credentials...');
            await page.type('input[type="email"], input[type="text"]', 'test@example.com');
            await page.type('input[type="password"]', 'password123');
            
            // Click login button
            const loginButton = await page.$('button[type="submit"], button:contains("Login"), button:contains("Sign In")');
            if (loginButton) {
                await loginButton.click();
            } else {
                // Try to find any button that looks like a login button
                const buttons = await page.$$('button');
                for (const button of buttons) {
                    const text = await button.evaluate(el => el.textContent);
                    if (text && (text.toLowerCase().includes('login') || text.toLowerCase().includes('sign'))) {
                        await button.click();
                        break;
                    }
                }
            }

            // Wait for navigation to dashboard
            console.log('⏳ Waiting for dashboard to load...');
            try {
                await page.waitForNavigation({ timeout: 10000 });
            } catch (e) {
                console.log('⚠️ Navigation timeout, checking current page...');
            }

            // Check if we're on the dashboard or need to navigate there
            const currentUrl = page.url();
            if (!currentUrl.includes('/dashboard')) {
                console.log('🔄 Navigating to dashboard...');
                await page.goto('http://localhost:3000/dashboard', { 
                    waitUntil: 'networkidle2',
                    timeout: 10000 
                });
            }

            // Wait for dashboard to load
            try {
                await page.waitForSelector('.min-h-screen, main, [class*="dashboard"]', { timeout: 5000 });
            } catch (e) {
                console.log('⚠️ Dashboard selector not found, proceeding with available elements...');
            }

            // Take a screenshot of the current state
            await this.takeScreenshot(page, 'dashboard-loaded');

            // Run all test suites
            await this.testDashboardVisualEnhancements(page);
            await this.testPnLGraphVisibility(page);
            await this.testExistingFunctionality(page);
            await this.testPerformance(page);
            await this.testCrossBrowserCompatibility(page);

            // Generate report
            await this.generateReport();

            await browser.close();
            
            console.log('\n✅ Testing completed!');
            console.log(`📊 Results: ${this.results.summary.passed}/${this.results.summary.total} tests passed`);
            
        } catch (error) {
            console.error('❌ Test execution failed:', error);
            process.exit(1);
        }
    }

    async testDashboardVisualEnhancements(page) {
        console.log('\n🎨 Testing Dashboard Visual Enhancements...');
        
        const tests = [
            {
                name: 'Dashboard Gradient Background',
                test: async () => {
                    const mainElement = await page.$('main, .min-h-screen, [class*="dashboard"]');
                    if (!mainElement) {
                        return { passed: false, reason: 'Main dashboard element not found' };
                    }
                    
                    const background = await mainElement.evaluate(el => {
                        const computed = window.getComputedStyle(el);
                        return computed.background;
                    });
                    
                    if (!background.includes('gradient')) {
                        return { passed: false, reason: 'Dashboard missing gradient background' };
                    }
                    
                    return { passed: true };
                }
            },
            {
                name: 'Card Visual Elements',
                test: async () => {
                    const cards = await page.$$('div[class*="card"], .glass, [class*="Dashboard"]');
                    if (cards.length === 0) {
                        return { passed: false, reason: 'No card elements found' };
                    }
                    
                    // Test first card for visual properties
                    const firstCard = cards[0];
                    const styles = await firstCard.evaluate(el => {
                        const computed = window.getComputedStyle(el);
                        return {
                            background: computed.background,
                            boxShadow: computed.boxShadow,
                            borderRadius: computed.borderRadius,
                            border: computed.border
                        };
                    });
                    
                    // Check for gradient or glass effect
                    const hasVisualEnhancement = styles.background.includes('gradient') || 
                                                  styles.boxShadow !== 'none' || 
                                                  styles.borderRadius !== '0px';
                    
                    if (!hasVisualEnhancement) {
                        return { passed: false, reason: 'Cards lack visual enhancements' };
                    }
                    
                    return { passed: true };
                }
            },
            {
                name: 'Hover Effects on Interactive Elements',
                test: async () => {
                    const interactiveElements = await page.$$('button, a, [class*="card"]');
                    if (interactiveElements.length === 0) {
                        return { passed: false, reason: 'No interactive elements found' };
                    }
                    
                    // Test hover on first element
                    const firstElement = interactiveElements[0];
                    await firstElement.hover();
                    await page.waitForTimeout(200);
                    
                    const afterHover = await firstElement.evaluate(el => {
                        const computed = window.getComputedStyle(el);
                        return {
                            transform: computed.transform,
                            boxShadow: computed.boxShadow,
                            filter: computed.filter
                        };
                    });
                    
                    const hasHoverEffect = afterHover.transform !== 'none' || 
                                          afterHover.boxShadow !== 'none' || 
                                          afterHover.filter !== 'none';
                    
                    if (!hasHoverEffect) {
                        return { passed: false, reason: 'No hover effects detected' };
                    }
                    
                    return { passed: true };
                }
            },
            {
                name: 'Visual Consistency',
                test: async () => {
                    const visualElements = await page.$$('div[class*="card"], .glass, [class*="panel"]');
                    if (visualElements.length < 2) {
                        return { passed: true, reason: 'Not enough elements to test consistency' };
                    }
                    
                    // Check if visual elements have consistent styling
                    const firstStyle = await visualElements[0].evaluate(el => {
                        const computed = window.getComputedStyle(el);
                        return {
                            borderRadius: computed.borderRadius,
                            fontFamily: computed.fontFamily
                        };
                    });
                    
                    let consistent = true;
                    for (let i = 1; i < Math.min(visualElements.length, 3); i++) {
                        const style = await visualElements[i].evaluate(el => {
                            const computed = window.getComputedStyle(el);
                            return {
                                borderRadius: computed.borderRadius,
                                fontFamily: computed.fontFamily
                            };
                        });
                        
                        if (style.borderRadius !== firstStyle.borderRadius) {
                            consistent = false;
                            break;
                        }
                    }
                    
                    if (!consistent) {
                        return { passed: false, reason: 'Visual elements lack consistency' };
                    }
                    
                    return { passed: true };
                }
            }
        ];

        for (const test of tests) {
            console.log(`   Testing: ${test.name}...`);
            const result = await test.test();
            
            this.results.dashboardVisualEnhancements[test.name] = result;
            this.results.summary.total++;
            if (result.passed) {
                this.results.summary.passed++;
                console.log(`   ✅ ${test.name}: PASSED`);
            } else {
                this.results.summary.failed++;
                console.log(`   ❌ ${test.name}: FAILED - ${result.reason}`);
            }
            
            // Take screenshot for visual verification
            await this.takeScreenshot(page, `dashboard-${test.name.toLowerCase().replace(/\s+/g, '-')}`);
        }
    }

    async testPnLGraphVisibility(page) {
        console.log('\n📊 Testing P&L Graph Visibility...');
        
        const tests = [
            {
                name: 'Chart Container Presence',
                test: async () => {
                    const chartContainers = await page.$$('div[class*="chart"], svg, [class*="graph"]');
                    if (chartContainers.length === 0) {
                        return { passed: false, reason: 'No chart containers found' };
                    }
                    
                    return { passed: true };
                }
            },
            {
                name: 'Chart Responsive Sizing',
                test: async () => {
                    const chartContainer = await page.$('div[class*="chart"], svg, [class*="graph"]');
                    if (!chartContainer) {
                        return { passed: false, reason: 'Chart container not found' };
                    }
                    
                    // Get initial dimensions
                    const initialSize = await chartContainer.evaluate(el => ({
                        width: el.offsetWidth || el.clientWidth || 0,
                        height: el.offsetHeight || el.clientHeight || 0
                    }));
                    
                    if (initialSize.width === 0 || initialSize.height === 0) {
                        return { passed: false, reason: 'Chart has zero dimensions' };
                    }
                    
                    // Test responsiveness by resizing viewport
                    await page.setViewport({ width: 768, height: 1024 });
                    await page.waitForTimeout(300);
                    
                    const newSize = await chartContainer.evaluate(el => ({
                        width: el.offsetWidth || el.clientWidth || 0,
                        height: el.offsetHeight || el.clientHeight || 0
                    }));
                    
                    // Restore viewport
                    await page.setViewport({ width: 1920, height: 1080 });
                    
                    // Check if chart resized
                    if (Math.abs(initialSize.width - newSize.width) < 50) {
                        return { passed: false, reason: 'Chart did not resize properly' };
                    }
                    
                    return { passed: true };
                }
            },
            {
                name: 'Chart Visual Elements',
                test: async () => {
                    const chartElements = await page.$$('svg, .recharts-wrapper, [class*="chart"]');
                    if (chartElements.length === 0) {
                        return { passed: false, reason: 'No chart visual elements found' };
                    }
                    
                    // Check for axes, lines, or other chart components
                    const hasAxes = await page.$$('line, path, .recharts-line, .recharts-x-axis, .recharts-y-axis');
                    if (hasAxes.length === 0) {
                        return { passed: false, reason: 'No chart axes or lines found' };
                    }
                    
                    return { passed: true };
                }
            },
            {
                name: 'Chart Labels and Text',
                test: async () => {
                    const textElements = await page.$$('svg text, .recharts-text, [class*="label"]');
                    if (textElements.length === 0) {
                        return { passed: false, reason: 'No chart text elements found' };
                    }
                    
                    // Check if text is visible
                    const firstText = textElements[0];
                    const isVisible = await firstText.evaluate(el => {
                        const computed = window.getComputedStyle(el);
                        return computed.display !== 'none' && 
                               computed.visibility !== 'hidden' && 
                               computed.opacity !== '0';
                    });
                    
                    if (!isVisible) {
                        return { passed: false, reason: 'Chart text elements are not visible' };
                    }
                    
                    return { passed: true };
                }
            }
        ];

        for (const test of tests) {
            console.log(`   Testing: ${test.name}...`);
            const result = await test.test();
            
            this.results.pnlGraphVisibility[test.name] = result;
            this.results.summary.total++;
            if (result.passed) {
                this.results.summary.passed++;
                console.log(`   ✅ ${test.name}: PASSED`);
            } else {
                this.results.summary.failed++;
                console.log(`   ❌ ${test.name}: FAILED - ${result.reason}`);
            }
            
            // Take screenshot for visual verification
            await this.takeScreenshot(page, `pnl-${test.name.toLowerCase().replace(/\s+/g, '-')}`);
        }
    }

    async testExistingFunctionality(page) {
        console.log('\n🔧 Testing Existing Functionality...');
        
        const tests = [
            {
                name: 'Sidebar Toggle Button',
                test: async () => {
                    const toggleButtons = await page.$$('button[title*="sidebar"], button[title*="toggle"], .fixed button, button svg');
                    if (toggleButtons.length === 0) {
                        return { passed: false, reason: 'No sidebar toggle buttons found' };
                    }
                    
                    // Find a visible toggle button
                    let visibleButton = null;
                    for (const button of toggleButtons) {
                        const isVisible = await button.evaluate(el => {
                            const computed = window.getComputedStyle(el);
                            return computed.display !== 'none' && 
                                   computed.visibility !== 'hidden' && 
                                   el.offsetWidth > 0 && 
                                   el.offsetHeight > 0;
                        });
                        
                        if (isVisible) {
                            visibleButton = button;
                            break;
                        }
                    }
                    
                    if (!visibleButton) {
                        return { passed: false, reason: 'No visible toggle button found' };
                    }
                    
                    return { passed: true };
                }
            },
            {
                name: 'Sidebar Element Presence',
                test: async () => {
                    const sidebarElements = await page.$$('aside, nav, [class*="sidebar"], [class*="nav"]');
                    if (sidebarElements.length === 0) {
                        return { passed: false, reason: 'No sidebar elements found' };
                    }
                    
                    return { passed: true };
                }
            },
            {
                name: 'Navigation Links',
                test: async () => {
                    const navLinks = await page.$$('nav a, aside a, [class*="nav"] a');
                    if (navLinks.length === 0) {
                        return { passed: false, reason: 'No navigation links found' };
                    }
                    
                    // Check if links are clickable
                    const firstLink = navLinks[0];
                    const isClickable = await firstLink.evaluate(el => {
                        const computed = window.getComputedStyle(el);
                        return computed.pointerEvents !== 'none' && 
                               computed.display !== 'none' && 
                               computed.visibility !== 'hidden';
                    });
                    
                    if (!isClickable) {
                        return { passed: false, reason: 'Navigation links are not clickable' };
                    }
                    
                    return { passed: true };
                }
            },
            {
                name: 'Interactive Element Responsiveness',
                test: async () => {
                    const interactiveElements = await page.$$('button, a, input, select');
                    if (interactiveElements.length === 0) {
                        return { passed: false, reason: 'No interactive elements found' };
                    }
                    
                    // Test a few elements for hover states
                    let responsiveCount = 0;
                    for (let i = 0; i < Math.min(3, interactiveElements.length); i++) {
                        const element = interactiveElements[i];
                        await element.hover();
                        await page.waitForTimeout(100);
                        
                        const cursor = await element.evaluate(el => {
                            const computed = window.getComputedStyle(el);
                            return computed.cursor;
                        });
                        
                        if (cursor === 'pointer') {
                            responsiveCount++;
                        }
                    }
                    
                    if (responsiveCount === 0) {
                        return { passed: false, reason: 'No interactive elements show pointer cursor' };
                    }
                    
                    return { passed: true };
                }
            }
        ];

        for (const test of tests) {
            console.log(`   Testing: ${test.name}...`);
            const result = await test.test();
            
            this.results.existingFunctionality[test.name] = result;
            this.results.summary.total++;
            if (result.passed) {
                this.results.summary.passed++;
                console.log(`   ✅ ${test.name}: PASSED`);
            } else {
                this.results.summary.failed++;
                console.log(`   ❌ ${test.name}: FAILED - ${result.reason}`);
            }
            
            // Take screenshot for visual verification
            await this.takeScreenshot(page, `functionality-${test.name.toLowerCase().replace(/\s+/g, '-')}`);
        }
    }

    async testPerformance(page) {
        console.log('\n⚡ Testing Performance...');
        
        const tests = [
            {
                name: 'Page Load Metrics',
                test: async () => {
                    const metrics = await page.metrics();
                    
                    // Check for reasonable load times
                    if (metrics.TaskDuration > 5000) {
                        return { 
                            passed: false, 
                            reason: `Long task duration: ${metrics.TaskDuration}ms` 
                        };
                    }
                    
                    if (metrics.LayoutShift > 0.1) {
                        return { 
                            passed: false, 
                            reason: `High layout shift: ${metrics.LayoutShift}` 
                        };
                    }
                    
                    return { passed: true, data: { metrics } };
                }
            },
            {
                name: 'Animation Performance',
                test: async () => {
                    // Check for excessive animations
                    const animationCount = await page.evaluate(() => {
                        const elements = document.querySelectorAll('*');
                        let animatedCount = 0;
                        
                        elements.forEach(el => {
                            const computed = window.getComputedStyle(el);
                            if (computed.animation !== 'none' && computed.animationDuration !== '0s') {
                                animatedCount++;
                            }
                        });
                        
                        return animatedCount;
                    });
                    
                    if (animationCount > 20) {
                        return { 
                            passed: false, 
                            reason: `Too many animated elements: ${animationCount}` 
                        };
                    }
                    
                    return { passed: true, data: { animationCount } };
                }
            },
            {
                name: 'Resource Loading',
                test: async () => {
                    const resources = await page.evaluate(() => {
                        return performance.getEntriesByType('resource').map(r => ({
                            name: r.name,
                            duration: r.duration,
                            size: r.transferSize || 0
                        }));
                    });
                    
                    // Check for large resources
                    const largeResources = resources.filter(r => r.size > 1000000); // > 1MB
                    if (largeResources.length > 2) {
                        return { 
                            passed: false, 
                            reason: `Too many large resources: ${largeResources.length}` 
                        };
                    }
                    
                    return { passed: true, data: { resourceCount: resources.length } };
                }
            }
        ];

        for (const test of tests) {
            console.log(`   Testing: ${test.name}...`);
            const result = await test.test();
            
            this.results.performance[test.name] = result;
            this.results.summary.total++;
            if (result.passed) {
                this.results.summary.passed++;
                console.log(`   ✅ ${test.name}: PASSED`);
            } else {
                this.results.summary.failed++;
                console.log(`   ❌ ${test.name}: FAILED - ${result.reason}`);
            }
        }
    }

    async testCrossBrowserCompatibility(page) {
        console.log('\n🌍 Testing Cross-Browser/Device Compatibility...');
        
        const tests = [
            {
                name: 'Mobile Responsiveness',
                test: async () => {
                    // Test mobile viewport
                    await page.setViewport({ width: 375, height: 667 });
                    await page.waitForTimeout(500);
                    
                    const mainContent = await page.$('main, .min-h-screen, body');
                    if (!mainContent) {
                        return { passed: false, reason: 'Main content not found on mobile' };
                    }
                    
                    const isAccessible = await mainContent.evaluate(el => {
                        const computed = window.getComputedStyle(el);
                        return computed.overflow !== 'hidden' && 
                               computed.display !== 'none' && 
                               el.offsetWidth > 0 && 
                               el.offsetHeight > 0;
                    });
                    
                    if (!isAccessible) {
                        return { passed: false, reason: 'Content not accessible on mobile' };
                    }
                    
                    return { passed: true };
                }
            },
            {
                name: 'Tablet Responsiveness',
                test: async () => {
                    // Test tablet viewport
                    await page.setViewport({ width: 768, height: 1024 });
                    await page.waitForTimeout(500);
                    
                    const cards = await page.$$('div[class*="card"], .glass, [class*="Dashboard"]');
                    if (cards.length === 0) {
                        return { passed: true, reason: 'No cards to test on tablet' };
                    }
                    
                    const firstCard = cards[0];
                    const isVisible = await firstCard.evaluate(el => {
                        const rect = el.getBoundingClientRect();
                        return rect.width > 0 && rect.height > 0;
                    });
                    
                    if (!isVisible) {
                        return { passed: false, reason: 'Cards not properly visible on tablet' };
                    }
                    
                    return { passed: true };
                }
            },
            {
                name: 'Touch-Friendly Elements',
                test: async () => {
                    const buttons = await page.$$('button, a[role="button"], [class*="btn"]');
                    if (buttons.length === 0) {
                        return { passed: false, reason: 'No buttons found for touch testing' };
                    }
                    
                    let touchFriendlyCount = 0;
                    for (const button of buttons) {
                        const size = await button.evaluate(el => {
                            const rect = el.getBoundingClientRect();
                            return Math.min(rect.width, rect.height);
                        });
                        
                        if (size >= 44) { // Minimum touch target size
                            touchFriendlyCount++;
                        }
                    }
                    
                    const touchFriendlyPercentage = (touchFriendlyCount / buttons.length) * 100;
                    if (touchFriendlyPercentage < 50) {
                        return { 
                            passed: false, 
                            reason: `Only ${touchFriendlyPercentage.toFixed(1)}% of buttons are touch-friendly` 
                        };
                    }
                    
                    return { passed: true, data: { touchFriendlyPercentage } };
                }
            }
        ];

        // Restore desktop viewport after tests
        const originalViewport = { width: 1920, height: 1080 };

        for (const test of tests) {
            console.log(`   Testing: ${test.name}...`);
            const result = await test.test();
            
            this.results.crossBrowserCompatibility[test.name] = result;
            this.results.summary.total++;
            if (result.passed) {
                this.results.summary.passed++;
                console.log(`   ✅ ${test.name}: PASSED`);
            } else {
                this.results.summary.failed++;
                console.log(`   ❌ ${test.name}: FAILED - ${result.reason}`);
            }
            
            // Take screenshot for visual verification
            await this.takeScreenshot(page, `compatibility-${test.name.toLowerCase().replace(/\s+/g, '-')}`);
        }

        // Restore original viewport
        await page.setViewport(originalViewport);
    }

    async takeScreenshot(page, name) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `screenshot-${name}-${timestamp}.png`;
        const filepath = path.join(__dirname, filename);
        
        await page.screenshot({ 
            path: filepath,
            fullPage: false
        });
        
        this.screenshots.push({
            name,
            filename,
            path: filepath
        });
        
        console.log(`📸 Screenshot saved: ${filename}`);
    }

    async generateReport() {
        const testEndTime = Date.now();
        const totalDuration = testEndTime - this.testStartTime;
        
        const report = {
            title: 'Visual Enhancement Testing Report (with Authentication)',
            timestamp: new Date().toISOString(),
            duration: `${totalDuration}ms`,
            summary: this.results.summary,
            results: this.results,
            screenshots: this.screenshots,
            recommendations: this.generateRecommendations()
        };
        
        const filename = `visual-enhancement-auth-test-report-${Date.now()}.json`;
        const filepath = path.join(__dirname, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
        
        console.log(`\n📄 Test report saved: ${filename}`);
        console.log(`📊 Total test duration: ${totalDuration}ms`);
        console.log(`📸 Screenshots taken: ${this.screenshots.length}`);
        
        // Print summary
        console.log('\n📋 Test Summary:');
        console.log(`   Dashboard Visual Enhancements: ${Object.values(this.results.dashboardVisualEnhancements).filter(r => r.passed).length}/${Object.values(this.results.dashboardVisualEnhancements).length} passed`);
        console.log(`   P&L Graph Visibility: ${Object.values(this.results.pnlGraphVisibility).filter(r => r.passed).length}/${Object.values(this.results.pnlGraphVisibility).length} passed`);
        console.log(`   Existing Functionality: ${Object.values(this.results.existingFunctionality).filter(r => r.passed).length}/${Object.values(this.results.existingFunctionality).length} passed`);
        console.log(`   Performance: ${Object.values(this.results.performance).filter(r => r.passed).length}/${Object.values(this.results.performance).length} passed`);
        console.log(`   Cross-Browser Compatibility: ${Object.values(this.results.crossBrowserCompatibility).filter(r => r.passed).length}/${Object.values(this.results.crossBrowserCompatibility).length} passed`);
        
        // Print recommendations
        console.log('\n💡 Recommendations:');
        report.recommendations.forEach((rec, index) => {
            console.log(`   ${index + 1}. ${rec}`);
        });
    }

    generateRecommendations() {
        const recommendations = [];
        
        // Check dashboard visual enhancements
        const failedDashboardTests = Object.entries(this.results.dashboardVisualEnhancements)
            .filter(([_, result]) => !result.passed);
        
        if (failedDashboardTests.length > 0) {
            recommendations.push('Review and fix dashboard visual enhancement issues, particularly gradients and hover effects.');
        }
        
        // Check P&L graph visibility
        const failedPnLTests = Object.entries(this.results.pnlGraphVisibility)
            .filter(([_, result]) => !result.passed);
        
        if (failedPnLTests.length > 0) {
            recommendations.push('Address P&L graph visibility issues, focusing on chart rendering and label display.');
        }
        
        // Check existing functionality
        const failedFunctionalityTests = Object.entries(this.results.existingFunctionality)
            .filter(([_, result]) => !result.passed);
        
        if (failedFunctionalityTests.length > 0) {
            recommendations.push('Fix existing functionality issues, particularly sidebar toggle and navigation elements.');
        }
        
        // Check performance
        const failedPerformanceTests = Object.entries(this.results.performance)
            .filter(([_, result]) => !result.passed);
        
        if (failedPerformanceTests.length > 0) {
            recommendations.push('Optimize performance issues, focusing on page load times and resource usage.');
        }
        
        // Check compatibility
        const failedCompatibilityTests = Object.entries(this.results.crossBrowserCompatibility)
            .filter(([_, result]) => !result.passed);
        
        if (failedCompatibilityTests.length > 0) {
            recommendations.push('Improve cross-browser and device compatibility, especially for mobile views.');
        }
        
        // Overall recommendations
        if (this.results.summary.failed === 0) {
            recommendations.push('All tests passed! Consider adding more comprehensive edge case testing.');
        } else {
            const failureRate = (this.results.summary.failed / this.results.summary.total) * 100;
            if (failureRate > 20) {
                recommendations.push('High failure rate detected. Consider a thorough code review and refactoring.');
            }
        }
        
        return recommendations;
    }
}

// Main execution
async function main() {
    const tester = new VisualEnhancementAuthTester();
    
    console.log('🤖 Starting automated visual enhancement testing with authentication...');
    console.log('   Make sure the development server is running: npm run dev');
    console.log('   The test will attempt to login with test credentials...');
    console.log('');
    
    try {
        await tester.initialize();
        await tester.runTests();
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = VisualEnhancementAuthTester;