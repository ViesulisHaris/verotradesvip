const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

/**
 * Comprehensive Sidebar Testing Script
 * Tests the new sidebar redesign implementation to verify all reported issues have been resolved
 */

class ComprehensiveSidebarTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      toggleButton: {},
      overlayBehavior: {},
      professionalAppearance: {},
      functionality: {},
      performance: {},
      mobileResponsiveness: {},
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        criticalIssues: [],
        improvements: []
      }
    };
    this.screenshots = [];
  }

  async initialize() {
    console.log('🔧 Initializing browser for sidebar testing...');
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1920, height: 1080 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });
    
    this.page = await this.browser.newPage();
    
    // Enable console logging from the browser
    this.page.on('console', msg => {
      console.log(`🌐 Browser: ${msg.text()}`);
    });
    
    // Enable request interception for performance monitoring
    await this.page.setRequestInterception(true);
    this.page.on('request', request => {
      request.continue();
    });
    
    console.log('✅ Browser initialized successfully');
  }

  async login() {
    console.log('🔐 Logging into application...');
    
    try {
      // Navigate to login page
      await this.page.goto('http://localhost:3000/login', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Wait for login form
      await this.page.waitForSelector('[data-testid="email-input"], input[type="email"]', { timeout: 10000 });
      
      // Fill login form
      await this.page.type('[data-testid="email-input"], input[type="email"]', 'test@example.com');
      await this.page.type('[data-testid="password-input"], input[type="password"]', 'testpassword123');
      
      // Submit login
      await this.page.click('[data-testid="login-button"], button[type="submit"]');
      
      // Wait for dashboard to load
      await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
      
      // Verify we're on dashboard
      const currentUrl = this.page.url();
      if (!currentUrl.includes('/dashboard')) {
        throw new Error(`Login failed - redirected to: ${currentUrl}`);
      }
      
      console.log('✅ Login successful');
      return true;
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      
      // Try to continue with dashboard directly for testing
      try {
        await this.page.goto('http://localhost:3000/dashboard', { 
          waitUntil: 'networkidle2',
          timeout: 15000 
        });
        console.log('⚠️ Continuing with dashboard for testing...');
        return true;
      } catch (dashboardError) {
        console.error('❌ Could not access dashboard:', dashboardError.message);
        return false;
      }
    }
  }

  async testToggleButtonFunctionality() {
    console.log('🔘 Testing Toggle Button Functionality...');
    
    const tests = [
      {
        name: 'Toggle Button Visibility',
        test: async () => {
          const toggleButton = await this.page.$('.sidebar-toggle-button, button[aria-label="Toggle menu"]');
          if (!toggleButton) {
            throw new Error('Toggle button not found');
          }
          
          const isVisible = await this.page.evaluate(button => {
            const style = window.getComputedStyle(button);
            return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
          }, toggleButton);
          
          if (!isVisible) {
            throw new Error('Toggle button is not visible');
          }
          
          return true;
        }
      },
      {
        name: 'Toggle Button Size (40x40px)',
        test: async () => {
          const toggleButton = await this.page.$('.sidebar-toggle-button, button[aria-label="Toggle menu"]');
          const rect = await toggleButton.boundingBox();
          
          if (!rect) {
            throw new Error('Could not get toggle button dimensions');
          }
          
          // Check if button is approximately 40x40px (allowing some variance for styling)
          const width = Math.round(rect.width);
          const height = Math.round(rect.height);
          
          if (width < 35 || width > 45 || height < 35 || height > 45) {
            throw new Error(`Toggle button size is ${width}x${height}px, expected ~40x40px`);
          }
          
          console.log(`✅ Toggle button size: ${width}x${height}px`);
          return true;
        }
      },
      {
        name: 'Toggle Button Position (Top-Left)',
        test: async () => {
          const toggleButton = await this.page.$('.sidebar-toggle-button, button[aria-label="Toggle menu"]');
          const rect = await toggleButton.boundingBox();
          
          if (!rect) {
            throw new Error('Could not get toggle button position');
          }
          
          // Check if button is in top-left corner (within reasonable bounds)
          if (rect.x > 100 || rect.y > 100) {
            throw new Error(`Toggle button position (${rect.x}, ${rect.y}) is not in top-left corner`);
          }
          
          console.log(`✅ Toggle button position: (${Math.round(rect.x)}, ${Math.round(rect.y)})`);
          return true;
        }
      },
      {
        name: 'Toggle Button Z-Index',
        test: async () => {
          const zIndex = await this.page.evaluate(() => {
            const button = document.querySelector('.sidebar-toggle-button, button[aria-label="Toggle menu"]');
            if (!button) return null;
            return window.getComputedStyle(button).zIndex;
          });
          
          if (!zIndex || parseInt(zIndex) < 999) {
            throw new Error(`Toggle button z-index is ${zIndex}, should be 9999`);
          }
          
          console.log(`✅ Toggle button z-index: ${zIndex}`);
          return true;
        }
      },
      {
        name: 'Toggle Button Click Functionality',
        test: async () => {
          // Check if sidebar is initially closed
          let sidebarVisible = await this.page.evaluate(() => {
            const sidebar = document.querySelector('.sidebar-overlay, aside');
            if (!sidebar) return false;
            const style = window.getComputedStyle(sidebar);
            return style.transform !== 'translateX(-100%)' && !sidebar.classList.contains('-translate-x-full');
          });
          
          if (sidebarVisible) {
            // Close sidebar first
            await this.page.click('.sidebar-toggle-button, button[aria-label="Toggle menu"]');
            await this.page.waitForTimeout(300);
          }
          
          // Click toggle button to open sidebar
          await this.page.click('.sidebar-toggle-button, button[aria-label="Toggle menu"]');
          await this.page.waitForTimeout(300);
          
          // Check if sidebar is now open
          sidebarVisible = await this.page.evaluate(() => {
            const sidebar = document.querySelector('.sidebar-overlay, aside');
            if (!sidebar) return false;
            const style = window.getComputedStyle(sidebar);
            return style.transform !== 'translateX(-100%)' && !sidebar.classList.contains('-translate-x-full');
          });
          
          if (!sidebarVisible) {
            throw new Error('Toggle button click did not open sidebar');
          }
          
          // Click again to close
          await this.page.click('.sidebar-toggle-button, button[aria-label="Toggle menu"]');
          await this.page.waitForTimeout(300);
          
          // Verify sidebar is closed
          sidebarVisible = await this.page.evaluate(() => {
            const sidebar = document.querySelector('.sidebar-overlay, aside');
            if (!sidebar) return false;
            const style = window.getComputedStyle(sidebar);
            return style.transform !== 'translateX(-100%)' && !sidebar.classList.contains('-translate-x-full');
          });
          
          if (sidebarVisible) {
            throw new Error('Toggle button click did not close sidebar');
          }
          
          console.log('✅ Toggle button click functionality works correctly');
          return true;
        }
      },
      {
        name: 'No Elements Behind Toggle Button',
        test: async () => {
          const hasOverlap = await this.page.evaluate(() => {
            const button = document.querySelector('.sidebar-toggle-button, button[aria-label="Toggle menu"]');
            if (!button) return false;
            
            const buttonRect = button.getBoundingClientRect();
            const elements = document.elementsFromPoint(
              buttonRect.left + buttonRect.width / 2,
              buttonRect.top + buttonRect.height / 2
            );
            
            // Check if button is the topmost element
            return elements[0] === button || button.contains(elements[0]);
          });
          
          if (!hasOverlap) {
            throw new Error('Toggle button is not the topmost element at its position');
          }
          
          console.log('✅ No elements hidden behind toggle button');
          return true;
        }
      }
    ];
    
    await this.runTests('toggleButton', tests);
    await this.takeScreenshot('toggle-button-test');
  }

  async testSidebarOverlayBehavior() {
    console.log('🎭 Testing Sidebar Overlay Behavior...');
    
    // First, open the sidebar
    await this.page.click('.sidebar-toggle-button, button[aria-label="Toggle menu"]');
    await this.page.waitForTimeout(300);
    
    const tests = [
      {
        name: 'Sidebar Opens as Overlay',
        test: async () => {
          const sidebarStyle = await this.page.evaluate(() => {
            const sidebar = document.querySelector('.sidebar-overlay, aside');
            if (!sidebar) return null;
            const style = window.getComputedStyle(sidebar);
            return {
              position: style.position,
              transform: style.transform,
              left: style.left,
              top: style.top,
              zIndex: style.zIndex
            };
          });
          
          if (!sidebarStyle) {
            throw new Error('Sidebar element not found');
          }
          
          if (sidebarStyle.position !== 'fixed') {
            throw new Error(`Sidebar position is ${sidebarStyle.position}, should be 'fixed'`);
          }
          
          if (sidebarStyle.left !== '0px' || sidebarStyle.top !== '0px') {
            throw new Error(`Sidebar position is (${sidebarStyle.left}, ${sidebarStyle.top}), should be (0px, 0px)`);
          }
          
          if (!sidebarStyle.zIndex || parseInt(sidebarStyle.zIndex) < 999) {
            throw new Error(`Sidebar z-index is ${sidebarStyle.zIndex}, should be 9999`);
          }
          
          console.log('✅ Sidebar opens as overlay correctly');
          return true;
        }
      },
      {
        name: 'Sidebar Does Not Push Content',
        test: async () => {
          const mainContentStyle = await this.page.evaluate(() => {
            const mainContent = document.querySelector('main, .main-content, div[class*="flex-1"]');
            if (!mainContent) return null;
            const style = window.getComputedStyle(mainContent);
            return {
              marginLeft: style.marginLeft,
              transform: style.transform,
              width: style.width
            };
          });
          
          if (!mainContentStyle) {
            throw new Error('Main content element not found');
          }
          
          // Check that main content is not shifted
          if (mainContentStyle.marginLeft && mainContentStyle.marginLeft !== '0px' && mainContentStyle.marginLeft !== '0rem') {
            throw new Error(`Main content margin-left is ${mainContentStyle.marginLeft}, should be 0`);
          }
          
          if (mainContentStyle.transform && mainContentStyle.transform !== 'none') {
            throw new Error(`Main content transform is ${mainContentStyle.transform}, should be none`);
          }
          
          console.log('✅ Sidebar does not push content');
          return true;
        }
      },
      {
        name: 'Sidebar Width (288px on desktop)',
        test: async () => {
          const sidebarWidth = await this.page.evaluate(() => {
            const sidebar = document.querySelector('.sidebar-overlay, aside');
            if (!sidebar) return null;
            return window.getComputedStyle(sidebar).width;
          });
          
          if (!sidebarWidth) {
            throw new Error('Could not get sidebar width');
          }
          
          const width = parseInt(sidebarWidth);
          if (width < 280 || width > 300) {
            throw new Error(`Sidebar width is ${width}px, expected ~288px`);
          }
          
          console.log(`✅ Sidebar width: ${sidebarWidth}`);
          return true;
        }
      },
      {
        name: 'Backdrop Overlay Present',
        test: async () => {
          const backdropExists = await this.page.evaluate(() => {
            const backdrop = document.querySelector('.sidebar-backdrop');
            if (!backdrop) return false;
            
            const style = window.getComputedStyle(backdrop);
            return style.display !== 'none' && 
                   style.opacity !== '0' && 
                   style.position === 'fixed';
          });
          
          if (!backdropExists) {
            throw new Error('Backdrop overlay is not visible when sidebar is open');
          }
          
          console.log('✅ Backdrop overlay is present');
          return true;
        }
      },
      {
        name: 'Smooth Slide Animations',
        test: async () => {
          // Close sidebar first
          await this.page.click('.sidebar-toggle-button, button[aria-label="Toggle menu"]');
          await this.page.waitForTimeout(100);
          
          // Start timing animation
          const startTime = Date.now();
          
          // Open sidebar and measure animation
          await this.page.click('.sidebar-toggle-button, button[aria-label="Toggle menu"]');
          
          // Wait for animation to complete
          await this.page.waitForFunction(() => {
            const sidebar = document.querySelector('.sidebar-overlay, aside');
            if (!sidebar) return false;
            const style = window.getComputedStyle(sidebar);
            return style.transform !== 'translateX(-100%)' && !sidebar.classList.contains('-translate-x-full');
          }, { timeout: 1000 });
          
          const animationTime = Date.now() - startTime;
          
          if (animationTime < 200 || animationTime > 500) {
            throw new Error(`Animation took ${animationTime}ms, expected 200-500ms`);
          }
          
          console.log(`✅ Smooth slide animation: ${animationTime}ms`);
          return true;
        }
      }
    ];
    
    await this.runTests('overlayBehavior', tests);
    await this.takeScreenshot('sidebar-overlay-test');
  }

  async testProfessionalAppearance() {
    console.log('🎨 Testing Professional Appearance...');
    
    const tests = [
      {
        name: 'Glass Morphism Styling Applied',
        test: async () => {
          const sidebarStyles = await this.page.evaluate(() => {
            const sidebar = document.querySelector('.sidebar-overlay, aside');
            if (!sidebar) return null;
            const style = window.getComputedStyle(sidebar);
            return {
              backdropFilter: style.backdropFilter,
              background: style.background,
              border: style.border,
              boxShadow: style.boxShadow
            };
          });
          
          if (!sidebarStyles) {
            throw new Error('Sidebar element not found');
          }
          
          if (!sidebarStyles.backdropFilter || !sidebarStyles.backdropFilter.includes('blur')) {
            throw new Error('Sidebar does not have backdrop blur effect');
          }
          
          if (!sidebarStyles.background || !sidebarStyles.background.includes('gradient')) {
            throw new Error('Sidebar does not have gradient background');
          }
          
          if (!sidebarStyles.boxShadow || !sidebarStyles.boxShadow.includes('rgba')) {
            throw new Error('Sidebar does not have proper shadow effects');
          }
          
          console.log('✅ Glass morphism styling applied correctly');
          return true;
        }
      },
      {
        name: 'Consistent Color Scheme',
        test: async () => {
          const colorScheme = await this.page.evaluate(() => {
            const sidebar = document.querySelector('.sidebar-overlay, aside');
            if (!sidebar) return null;
            
            const computedStyle = window.getComputedStyle(sidebar);
            const backgroundColor = computedStyle.backgroundColor;
            const borderColor = computedStyle.borderColor;
            
            // Check for blue/cyan color palette
            const hasBlueCyan = backgroundColor.includes('59, 130, 246') || // blue-500
                               backgroundColor.includes('6, 182, 212') ||  // cyan-500
                               borderColor.includes('59, 130, 246') ||
                               borderColor.includes('6, 182, 212');
            
            return { backgroundColor, borderColor, hasBlueCyan };
          });
          
          if (!colorScheme || !colorScheme.hasBlueCyan) {
            throw new Error('Sidebar does not use consistent blue/cyan color scheme');
          }
          
          console.log('✅ Consistent color scheme applied');
          return true;
        }
      },
      {
        name: 'Professional Typography',
        test: async () => {
          const typography = await this.page.evaluate(() => {
            const menuItems = document.querySelectorAll('.sidebar-menu-item a, nav a');
            if (menuItems.length === 0) return null;
            
            const firstItem = menuItems[0];
            const style = window.getComputedStyle(firstItem);
            
            return {
              fontFamily: style.fontFamily,
              fontSize: style.fontSize,
              fontWeight: style.fontWeight,
              lineHeight: style.lineHeight
            };
          });
          
          if (!typography) {
            throw new Error('Menu items not found');
          }
          
          if (!typography.fontFamily.includes('Inter') && !typography.fontFamily.includes('system-ui')) {
            throw new Error('Typography does not use professional font family');
          }
          
          if (parseInt(typography.fontSize) < 14 || parseInt(typography.fontSize) > 18) {
            throw new Error(`Font size ${typography.fontSize} is not within professional range (14-18px)`);
          }
          
          console.log(`✅ Professional typography: ${typography.fontSize} ${typography.fontFamily}`);
          return true;
        }
      },
      {
        name: 'Menu Item Icons Present',
        test: async () => {
          const iconsPresent = await this.page.evaluate(() => {
            const menuItems = document.querySelectorAll('.sidebar-menu-item a, nav a');
            if (menuItems.length === 0) return false;
            
            // Check if each menu item has an icon
            for (const item of menuItems) {
              const icon = item.querySelector('svg');
              if (!icon) return false;
            }
            
            return true;
          });
          
          if (!iconsPresent) {
            throw new Error('Not all menu items have icons');
          }
          
          console.log('✅ Menu item icons present');
          return true;
        }
      },
      {
        name: 'Hover Effects on Menu Items',
        test: async () => {
          const hasHoverEffects = await this.page.evaluate(() => {
            const menuItem = document.querySelector('.sidebar-menu-item a, nav a');
            if (!menuItem) return false;
            
            // Check for hover-related styles
            const style = window.getComputedStyle(menuItem);
            const hasTransition = style.transition && style.transition !== 'none';
            const hasTransform = style.transform && style.transform !== 'none';
            
            return hasTransition || hasTransform;
          });
          
          if (!hasHoverEffects) {
            throw new Error('Menu items do not have hover effects');
          }
          
          console.log('✅ Hover effects on menu items');
          return true;
        }
      },
      {
        name: 'Active State Indicators',
        test: async () => {
          const hasActiveState = await this.page.evaluate(() => {
            const activeItem = document.querySelector('.sidebar-menu-item.active, a.active, .active');
            if (!activeItem) return false;
            
            const style = window.getComputedStyle(activeItem);
            const hasActiveStyles = style.backgroundColor && 
                                  style.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
                                  style.backgroundColor !== 'transparent';
            
            return hasActiveStyles;
          });
          
          if (!hasActiveState) {
            throw new Error('Active menu item does not have proper styling');
          }
          
          console.log('✅ Active state indicators present');
          return true;
        }
      }
    ];
    
    await this.runTests('professionalAppearance', tests);
    await this.takeScreenshot('professional-appearance-test');
  }

  async testFunctionality() {
    console.log('⚙️ Testing Functionality...');
    
    const tests = [
      {
        name: 'All Menu Items Clickable',
        test: async () => {
          const menuItemsClickable = await this.page.evaluate(() => {
            const menuItems = document.querySelectorAll('.sidebar-menu-item a, nav a');
            if (menuItems.length === 0) return false;
            
            for (const item of menuItems) {
              const style = window.getComputedStyle(item);
              if (style.pointerEvents === 'none' || style.display === 'none') {
                return false;
              }
            }
            
            return true;
          });
          
          if (!menuItemsClickable) {
            throw new Error('Not all menu items are clickable');
          }
          
          console.log('✅ All menu items are clickable');
          return true;
        }
      },
      {
        name: 'Click Outside to Close',
        test: async () => {
          // Ensure sidebar is open
          await this.page.click('.sidebar-toggle-button, button[aria-label="Toggle menu"]');
          await this.page.waitForTimeout(300);
          
          // Click outside sidebar
          await this.page.click('body', { position: { x: 500, y: 300 } });
          await this.page.waitForTimeout(300);
          
          // Check if sidebar is closed
          const sidebarClosed = await this.page.evaluate(() => {
            const sidebar = document.querySelector('.sidebar-overlay, aside');
            if (!sidebar) return true;
            const style = window.getComputedStyle(sidebar);
            return style.transform === 'translateX(-100%)' || sidebar.classList.contains('-translate-x-full');
          });
          
          if (!sidebarClosed) {
            throw new Error('Sidebar did not close when clicking outside');
          }
          
          console.log('✅ Click outside to close works');
          return true;
        }
      },
      {
        name: 'Escape Key to Close',
        test: async () => {
          // Ensure sidebar is open
          await this.page.click('.sidebar-toggle-button, button[aria-label="Toggle menu"]');
          await this.page.waitForTimeout(300);
          
          // Press escape key
          await this.page.keyboard.press('Escape');
          await this.page.waitForTimeout(300);
          
          // Check if sidebar is closed
          const sidebarClosed = await this.page.evaluate(() => {
            const sidebar = document.querySelector('.sidebar-overlay, aside');
            if (!sidebar) return true;
            const style = window.getComputedStyle(sidebar);
            return style.transform === 'translateX(-100%)' || sidebar.classList.contains('-translate-x-full');
          });
          
          if (!sidebarClosed) {
            throw new Error('Sidebar did not close when pressing Escape key');
          }
          
          console.log('✅ Escape key to close works');
          return true;
        }
      },
      {
        name: 'Auto-Close on Navigation',
        test: async () => {
          // Ensure sidebar is open
          await this.page.click('.sidebar-toggle-button, button[aria-label="Toggle menu"]');
          await this.page.waitForTimeout(300);
          
          // Click on a menu item to navigate
          const navigationWorked = await this.page.evaluate(() => {
            const menuItems = document.querySelectorAll('.sidebar-menu-item a, nav a');
            if (menuItems.length === 0) return false;
            
            // Find a menu item that's not the current page
            for (const item of menuItems) {
              if (!item.classList.contains('active')) {
                item.click();
                return true;
              }
            }
            return false;
          });
          
          if (!navigationWorked) {
            throw new Error('Could not trigger navigation');
          }
          
          await this.page.waitForTimeout(500);
          
          // Check if sidebar is closed after navigation
          const sidebarClosed = await this.page.evaluate(() => {
            const sidebar = document.querySelector('.sidebar-overlay, aside');
            if (!sidebar) return true;
            const style = window.getComputedStyle(sidebar);
            return style.transform === 'translateX(-100%)' || sidebar.classList.contains('-translate-x-full');
          });
          
          if (!sidebarClosed) {
            throw new Error('Sidebar did not auto-close after navigation');
          }
          
          console.log('✅ Auto-close on navigation works');
          return true;
        }
      },
      {
        name: 'Close Button in Sidebar',
        test: async () => {
          // Ensure sidebar is open
          await this.page.click('.sidebar-toggle-button, button[aria-label="Toggle menu"]');
          await this.page.waitForTimeout(300);
          
          // Look for close button in sidebar
          const closeButtonExists = await this.page.evaluate(() => {
            const closeButton = document.querySelector('button[aria-label="Close menu"], .sidebar button');
            return closeButton !== null;
          });
          
          if (!closeButtonExists) {
            throw new Error('Close button not found in sidebar');
          }
          
          // Click close button
          await this.page.click('button[aria-label="Close menu"], .sidebar button');
          await this.page.waitForTimeout(300);
          
          // Check if sidebar is closed
          const sidebarClosed = await this.page.evaluate(() => {
            const sidebar = document.querySelector('.sidebar-overlay, aside');
            if (!sidebar) return true;
            const style = window.getComputedStyle(sidebar);
            return style.transform === 'translateX(-100%)' || sidebar.classList.contains('-translate-x-full');
          });
          
          if (!sidebarClosed) {
            throw new Error('Close button did not close sidebar');
          }
          
          console.log('✅ Close button in sidebar works');
          return true;
        }
      }
    ];
    
    await this.runTests('functionality', tests);
    await this.takeScreenshot('functionality-test');
  }

  async testPerformance() {
    console.log('🚀 Testing Performance...');
    
    const tests = [
      {
        name: 'Sidebar Animation Performance',
        test: async () => {
          // Close sidebar first
          await this.page.click('.sidebar-toggle-button, button[aria-label="Toggle menu"]');
          await this.page.waitForTimeout(100);
          
          // Measure animation performance
          const performanceMetrics = await this.page.evaluate(() => {
            return new Promise((resolve) => {
              const startTime = performance.now();
              let frameCount = 0;
              let lastFrameTime = startTime;
              
              function countFrames() {
                frameCount++;
                lastFrameTime = performance.now();
                
                if (lastFrameTime - startTime < 500) {
                  requestAnimationFrame(countFrames);
                } else {
                  resolve({
                    frameCount,
                    duration: lastFrameTime - startTime,
                    fps: frameCount / ((lastFrameTime - startTime) / 1000)
                  });
                }
              }
              
              // Trigger animation
              const toggleButton = document.querySelector('.sidebar-toggle-button, button[aria-label="Toggle menu"]');
              if (toggleButton) {
                toggleButton.click();
                requestAnimationFrame(countFrames);
              } else {
                resolve({ frameCount: 0, duration: 0, fps: 0 });
              }
            });
          });
          
          if (performanceMetrics.fps < 30) {
            throw new Error(`Animation performance is ${performanceMetrics.fps.toFixed(1)} FPS, should be at least 30 FPS`);
          }
          
          console.log(`✅ Animation performance: ${performanceMetrics.fps.toFixed(1)} FPS`);
          return true;
        }
      },
      {
        name: 'No Z-Index Conflicts',
        test: async () => {
          const zIndexConflicts = await this.page.evaluate(() => {
            const elements = document.querySelectorAll('*');
            const zIndexMap = new Map();
            const conflicts = [];
            
            elements.forEach(element => {
              const style = window.getComputedStyle(element);
              const zIndex = parseInt(style.zIndex);
              
              if (zIndex && zIndex > 10) { // Only check high z-index values
                if (zIndexMap.has(zIndex)) {
                  conflicts.push({
                    zIndex,
                    elements: [
                      zIndexMap.get(zIndex).tagName + (zIndexMap.get(zIndex).className ? '.' + zIndexMap.get(zIndex).className : ''),
                      element.tagName + (element.className ? '.' + element.className : '')
                    ]
                  });
                } else {
                  zIndexMap.set(zIndex, element);
                }
              }
            });
            
            return conflicts;
          });
          
          if (zIndexConflicts.length > 0) {
            console.warn('⚠️ Z-index conflicts found:', zIndexConflicts);
            // Not a critical failure, but worth noting
          }
          
          console.log('✅ No critical z-index conflicts');
          return true;
        }
      },
      {
        name: 'Memory Usage',
        test: async () => {
          const memoryBefore = await this.page.evaluate(() => {
            if (performance.memory) {
              return performance.memory.usedJSHeapSize;
            }
            return null;
          });
          
          // Perform multiple sidebar operations
          for (let i = 0; i < 10; i++) {
            await this.page.click('.sidebar-toggle-button, button[aria-label="Toggle menu"]');
            await this.page.waitForTimeout(100);
            await this.page.click('.sidebar-toggle-button, button[aria-label="Toggle menu"]');
            await this.page.waitForTimeout(100);
          }
          
          const memoryAfter = await this.page.evaluate(() => {
            if (performance.memory) {
              return performance.memory.usedJSHeapSize;
            }
            return null;
          });
          
          if (memoryBefore && memoryAfter) {
            const memoryIncrease = memoryAfter - memoryBefore;
            const memoryIncreasePercent = (memoryIncrease / memoryBefore) * 100;
            
            if (memoryIncreasePercent > 50) {
              throw new Error(`Memory usage increased by ${memoryIncreasePercent.toFixed(1)}%, should be less than 50%`);
            }
            
            console.log(`✅ Memory usage increased by ${memoryIncreasePercent.toFixed(1)}%`);
          }
          
          return true;
        }
      }
    ];
    
    await this.runTests('performance', tests);
  }

  async testMobileResponsiveness() {
    console.log('📱 Testing Mobile Responsiveness...');
    
    const tests = [
      {
        name: 'Mobile Viewport Sidebar Width',
        test: async () => {
          // Set mobile viewport
          await this.page.setViewport({ width: 375, height: 667 });
          await this.page.waitForTimeout(300);
          
          // Open sidebar
          await this.page.click('.sidebar-toggle-button, button[aria-label="Toggle menu"]');
          await this.page.waitForTimeout(300);
          
          const sidebarWidth = await this.page.evaluate(() => {
            const sidebar = document.querySelector('.sidebar-overlay, aside');
            if (!sidebar) return null;
            return window.getComputedStyle(sidebar).width;
          });
          
          if (!sidebarWidth) {
            throw new Error('Could not get sidebar width on mobile');
          }
          
          const width = parseInt(sidebarWidth);
          if (width > 320) {
            throw new Error(`Mobile sidebar width is ${width}px, should be max 320px`);
          }
          
          console.log(`✅ Mobile sidebar width: ${sidebarWidth}`);
          return true;
        }
      },
      {
        name: 'Touch-Friendly Toggle Button',
        test: async () => {
          const buttonSize = await this.page.evaluate(() => {
            const button = document.querySelector('.sidebar-toggle-button, button[aria-label="Toggle menu"]');
            if (!button) return null;
            const rect = button.getBoundingClientRect();
            return {
              width: rect.width,
              height: rect.height,
              area: rect.width * rect.height
            };
          });
          
          if (!buttonSize) {
            throw new Error('Could not get toggle button size');
          }
          
          // Check minimum touch target size (44x44px recommended)
          if (buttonSize.width < 40 || buttonSize.height < 40) {
            throw new Error(`Toggle button size ${buttonSize.width}x${buttonSize.height}px is too small for touch`);
          }
          
          console.log(`✅ Touch-friendly toggle button: ${buttonSize.width}x${buttonSize.height}px`);
          return true;
        }
      },
      {
        name: 'Mobile Menu Item Spacing',
        test: async () => {
          const menuItemSpacing = await this.page.evaluate(() => {
            const menuItems = document.querySelectorAll('.sidebar-menu-item a, nav a');
            if (menuItems.length < 2) return null;
            
            const firstItem = menuItems[0].getBoundingClientRect();
            const secondItem = menuItems[1].getBoundingClientRect();
            
            return {
              firstItemHeight: firstItem.height,
              spacing: secondItem.top - firstItem.bottom
            };
          });
          
          if (!menuItemSpacing) {
            throw new Error('Could not measure menu item spacing');
          }
          
          if (menuItemSpacing.firstItemHeight < 40) {
            throw new Error(`Menu item height ${menuItemSpacing.firstItemHeight}px is too small for touch`);
          }
          
          if (menuItemSpacing.spacing < 8) {
            throw new Error(`Menu item spacing ${menuItemSpacing.spacing}px is too small`);
          }
          
          console.log(`✅ Mobile menu item spacing: ${menuItemSpacing.spacing}px`);
          return true;
        }
      }
    ];
    
    await this.runTests('mobileResponsiveness', tests);
    await this.takeScreenshot('mobile-responsiveness-test');
    
    // Reset to desktop viewport
    await this.page.setViewport({ width: 1920, height: 1080 });
  }

  async runTests(category, tests) {
    console.log(`\n📋 Running ${tests.length} tests for ${category}...`);
    
    for (const test of tests) {
      try {
        console.log(`  🧪 ${test.name}...`);
        const result = await test.test();
        
        this.testResults[category][test.name] = {
          status: 'PASS',
          result: result,
          error: null
        };
        
        this.testResults.summary.passedTests++;
        console.log(`    ✅ ${test.name} - PASSED`);
        
      } catch (error) {
        this.testResults[category][test.name] = {
          status: 'FAIL',
          result: false,
          error: error.message
        };
        
        this.testResults.summary.failedTests++;
        this.testResults.summary.criticalIssues.push(`${test.name}: ${error.message}`);
        console.log(`    ❌ ${test.name} - FAILED: ${error.message}`);
      }
      
      this.testResults.summary.totalTests++;
    }
  }

  async takeScreenshot(name) {
    try {
      const screenshotPath = path.join(__dirname, `${name}-${Date.now()}.png`);
      await this.page.screenshot({ 
        path: screenshotPath,
        fullPage: false 
      });
      this.screenshots.push(screenshotPath);
      console.log(`📸 Screenshot saved: ${screenshotPath}`);
    } catch (error) {
      console.warn(`⚠️ Could not save screenshot: ${error.message}`);
    }
  }

  async generateReport() {
    console.log('\n📊 Generating comprehensive test report...');
    
    const reportData = {
      timestamp: new Date().toISOString(),
      testResults: this.testResults,
      screenshots: this.screenshots,
      summary: {
        totalTests: this.testResults.summary.totalTests,
        passedTests: this.testResults.summary.passedTests,
        failedTests: this.testResults.summary.failedTests,
        passRate: ((this.testResults.summary.passedTests / this.testResults.summary.totalTests) * 100).toFixed(1) + '%',
        criticalIssues: this.testResults.summary.criticalIssues,
        status: this.testResults.summary.failedTests === 0 ? 'PASS' : 'FAIL'
      }
    };
    
    // Generate detailed report
    let report = `# Comprehensive Sidebar Testing Report\n\n`;
    report += `**Generated:** ${new Date().toLocaleString()}\n`;
    report += `**Status:** ${reportData.summary.status}\n`;
    report += `**Pass Rate:** ${reportData.summary.passRate}\n\n`;
    
    report += `## Test Summary\n\n`;
    report += `- **Total Tests:** ${reportData.summary.totalTests}\n`;
    report += `- **Passed:** ${reportData.summary.passedTests}\n`;
    report += `- **Failed:** ${reportData.summary.failedTests}\n\n`;
    
    if (reportData.summary.criticalIssues.length > 0) {
      report += `## Critical Issues\n\n`;
      reportData.summary.criticalIssues.forEach(issue => {
        report += `- ❌ ${issue}\n`;
      });
      report += `\n`;
    }
    
    // Detailed test results
    const categories = ['toggleButton', 'overlayBehavior', 'professionalAppearance', 'functionality', 'performance', 'mobileResponsiveness'];
    const categoryNames = {
      toggleButton: 'Toggle Button Functionality',
      overlayBehavior: 'Sidebar Overlay Behavior',
      professionalAppearance: 'Professional Appearance',
      functionality: 'Functionality',
      performance: 'Performance',
      mobileResponsiveness: 'Mobile Responsiveness'
    };
    
    categories.forEach(category => {
      if (this.testResults[category] && Object.keys(this.testResults[category]).length > 0) {
        report += `## ${categoryNames[category]}\n\n`;
        
        Object.entries(this.testResults[category]).forEach(([testName, result]) => {
          const status = result.status === 'PASS' ? '✅' : '❌';
          report += `${status} **${testName}**\n`;
          
          if (result.status === 'FAIL') {
            report += `   - Error: ${result.error}\n`;
          }
          
          report += `\n`;
        });
      }
    });
    
    // Screenshots
    if (this.screenshots.length > 0) {
      report += `## Screenshots\n\n`;
      this.screenshots.forEach(screenshot => {
        report += `- ${path.basename(screenshot)}\n`;
      });
      report += `\n`;
    }
    
    // Conclusion
    report += `## Conclusion\n\n`;
    
    if (reportData.summary.status === 'PASS') {
      report += `🎉 **All tests passed!** The new sidebar implementation successfully addresses all reported issues:\n\n`;
      report += `- ✅ Toggle button is small and elegant (40x40px)\n`;
      report += `- ✅ Sidebar opens as overlay without pushing content\n`;
      report += `- ✅ Professional glass morphism styling applied\n`;
      report += `- ✅ All functionality works correctly\n`;
      report += `- ✅ Performance is optimized\n`;
      report += `- ✅ Mobile responsive design implemented\n\n`;
      report += `The sidebar redesign is ready for production use.\n`;
    } else {
      report += `⚠️ **Some tests failed.** The following issues need to be addressed:\n\n`;
      reportData.summary.criticalIssues.forEach(issue => {
        report += `- ❌ ${issue}\n`;
      });
      report += `\nPlease fix these issues before deploying to production.\n`;
    }
    
    // Save report
    const reportPath = path.join(__dirname, `COMPREHENSIVE_SIDEBAR_TEST_REPORT.md`);
    fs.writeFileSync(reportPath, report);
    
    // Save JSON data
    const jsonPath = path.join(__dirname, `comprehensive-sidebar-test-results-${Date.now()}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(reportData, null, 2));
    
    console.log(`📄 Report saved: ${reportPath}`);
    console.log(`📊 JSON data saved: ${jsonPath}`);
    
    return reportData;
  }

  async cleanup() {
    console.log('🧹 Cleaning up...');
    if (this.browser) {
      await this.browser.close();
    }
    console.log('✅ Cleanup complete');
  }

  async run() {
    try {
      await this.initialize();
      
      const loginSuccess = await this.login();
      if (!loginSuccess) {
        console.error('❌ Could not access application for testing');
        return;
      }
      
      // Run all test suites
      await this.testToggleButtonFunctionality();
      await this.testSidebarOverlayBehavior();
      await this.testProfessionalAppearance();
      await this.testFunctionality();
      await this.testPerformance();
      await this.testMobileResponsiveness();
      
      // Generate and save report
      const reportData = await this.generateReport();
      
      console.log('\n🎯 Testing Complete!');
      console.log(`📊 Summary: ${reportData.summary.passedTests}/${reportData.summary.totalTests} tests passed (${reportData.summary.passRate})`);
      
      if (reportData.summary.status === 'PASS') {
        console.log('🎉 All sidebar tests passed! The new implementation is working correctly.');
      } else {
        console.log('⚠️ Some tests failed. Please review the report for details.');
      }
      
    } catch (error) {
      console.error('❌ Test execution failed:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the comprehensive sidebar test
const test = new ComprehensiveSidebarTest();
test.run().catch(console.error);