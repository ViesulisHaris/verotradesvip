const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_CREDENTIALS = {
  email: 'testuser@verotrade.com',
  password: 'TestPassword123!'
};

// Viewport sizes for responsive testing
const VIEWPORTS = {
  mobile: { width: 375, height: 667 },      // iPhone SE
  tablet: { width: 768, height: 1024 },     // iPad
  laptop: { width: 1024, height: 768 },     // Small laptop
  desktop: { width: 1920, height: 1080 }    // Desktop
};

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  },
  categories: {
    authentication: { tests: [], passed: 0, failed: 0 },
    visualDesign: { tests: [], passed: 0, failed: 0 },
    interactiveElements: { tests: [], passed: 0, failed: 0 },
    navigation: { tests: [], passed: 0, failed: 0 },
    responsive: { tests: [], passed: 0, failed: 0 },
    theme: { tests: [], passed: 0, failed: 0 },
    accessibility: { tests: [], passed: 0, failed: 0 },
    loadingAndError: { tests: [], passed: 0, failed: 0 }
  },
  screenshots: [],
  errors: []
};

// Helper function to log test results
function logTest(category, testName, passed, details = '') {
  const result = {
    name: testName,
    passed,
    details,
    timestamp: new Date().toISOString()
  };
  
  testResults.categories[category].tests.push(result);
  if (passed) {
    testResults.categories[category].passed++;
    testResults.summary.passed++;
  } else {
    testResults.categories[category].failed++;
    testResults.summary.failed++;
    testResults.errors.push(`${category}: ${testName} - ${details}`);
  }
  testResults.summary.total++;
  
  console.log(`${passed ? '✅' : '❌'} [${category}] ${testName}${details ? ` - ${details}` : ''}`);
}

// Helper function to take screenshots
async function takeScreenshot(page, name, viewport = 'desktop') {
  const timestamp = Date.now();
  const filename = `ui-ux-${name}-${viewport}-${timestamp}.png`;
  const filepath = path.join(__dirname, filename);
  
  await page.screenshot({ path: filepath, fullPage: true });
  testResults.screenshots.push({
    name,
    viewport,
    filename,
    timestamp
  });
  
  return filepath;
}

// Helper function to wait for element with timeout
async function waitForElement(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    return false;
  }
}

// Helper function to check element visibility
async function isElementVisible(page, selector) {
  try {
    const element = await page.$(selector);
    if (!element) return false;
    return await element.isVisible();
  } catch (error) {
    return false;
  }
}

// Helper function to check element styles
async function getElementStyles(page, selector) {
  try {
    const element = await page.$(selector);
    if (!element) return null;
    return await element.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        fontSize: computed.fontSize,
        fontFamily: computed.fontFamily,
        padding: computed.padding,
        margin: computed.margin,
        borderRadius: computed.borderRadius,
        boxShadow: computed.boxShadow,
        backdropFilter: computed.backdropFilter,
        opacity: computed.opacity
      };
    });
  } catch (error) {
    return null;
  }
}

// Authentication tests
async function testAuthentication(page) {
  console.log('\n🔐 Testing Authentication Flow...');
  
  try {
    // Test login page loading
    await page.goto(`${BASE_URL}/login`);
    const loginLoaded = await waitForElement(page, 'form');
    logTest('authentication', 'Login page loads correctly', loginLoaded);
    
    if (loginLoaded) {
      await takeScreenshot(page, 'login-page-loaded');
      
      // Test form fields exist
      const emailField = await waitForElement(page, 'input[type="email"], input[name="email"]');
      const passwordField = await waitForElement(page, 'input[type="password"], input[name="password"]');
      const submitButton = await waitForElement(page, 'button[type="submit"]');
      
      logTest('authentication', 'Email field exists', emailField);
      logTest('authentication', 'Password field exists', passwordField);
      logTest('authentication', 'Submit button exists', submitButton);
      
      // Test form validation
      if (emailField && passwordField && submitButton) {
        // Test empty form submission
        await page.click('button[type="submit"]');
        await page.waitForTimeout(1000);
        
        // Check for validation messages
        const validationShown = await page.$$eval('.error, .text-red-500, [role="alert"]', 
          els => els.length > 0);
        logTest('authentication', 'Form validation shown for empty fields', validationShown);
        
        // Test valid login
        await page.fill('input[type="email"], input[name="email"]', TEST_CREDENTIALS.email);
        await page.fill('input[type="password"], input[name="password"]', TEST_CREDENTIALS.password);
        
        // Check form before submission
        await takeScreenshot(page, 'login-form-filled');
        
        // Submit form
        await Promise.all([
          page.waitForNavigation({ timeout: 10000 }),
          page.click('button[type="submit"]')
        ]);
        
        // Check if redirected to dashboard
        const currentUrl = page.url();
        const loginSuccess = currentUrl.includes('/dashboard') || currentUrl.includes('/trades');
        logTest('authentication', 'Login redirects to dashboard', loginSuccess, `Redirected to: ${currentUrl}`);
        
        if (loginSuccess) {
          await takeScreenshot(page, 'dashboard-after-login');
        }
      }
    }
  } catch (error) {
    logTest('authentication', 'Authentication flow test failed', false, error.message);
  }
}

// Visual design tests
async function testVisualDesign(page) {
  console.log('\n🎨 Testing Visual Design and Consistency...');
  
  try {
    // Test glass morphism elements
    const glassElements = await page.$$('.glass, .backdrop-blur, [style*="backdrop-filter"]');
    logTest('visualDesign', 'Glass morphism elements present', glassElements.length > 0, 
      `Found ${glassElements.length} glass elements`);
    
    // Test color scheme consistency
    const buttons = await page.$$('button, .btn');
    let consistentColors = true;
    let buttonColors = [];
    
    for (let i = 0; i < Math.min(buttons.length, 5); i++) {
      const styles = await getElementStyles(page, buttons[i]);
      if (styles) {
        buttonColors.push(styles.backgroundColor);
      }
    }
    
    // Check if buttons have consistent styling
    const uniqueColors = [...new Set(buttonColors)];
    consistentColors = uniqueColors.length <= 3; // Allow for primary, secondary, danger variants
    logTest('visualDesign', 'Button color consistency', consistentColors, 
      `Found ${uniqueColors.length} different button colors`);
    
    // Test typography consistency
    const headings = await page.$$('h1, h2, h3, h4, h5, h6');
    let consistentTypography = true;
    let headingFonts = [];
    
    for (let i = 0; i < Math.min(headings.length, 5); i++) {
      const styles = await getElementStyles(page, headings[i]);
      if (styles) {
        headingFonts.push(styles.fontFamily);
      }
    }
    
    const uniqueFonts = [...new Set(headingFonts)];
    consistentTypography = uniqueFonts.length <= 2;
    logTest('visualDesign', 'Typography consistency', consistentTypography, 
      `Found ${uniqueFonts.length} different heading fonts`);
    
    // Test spacing consistency
    const cards = await page.$$('.card, .bg-white, .bg-gray-800');
    let consistentSpacing = true;
    let cardPaddings = [];
    
    for (let i = 0; i < Math.min(cards.length, 5); i++) {
      const styles = await getElementStyles(page, cards[i]);
      if (styles) {
        cardPaddings.push(styles.padding);
      }
    }
    
    const uniquePaddings = [...new Set(cardPaddings)];
    consistentSpacing = uniquePaddings.length <= 3;
    logTest('visualDesign', 'Spacing consistency', consistentSpacing, 
      `Found ${uniquePaddings.length} different padding styles`);
    
    // Test visual hierarchy
    const h1Elements = await page.$$('h1');
    const h2Elements = await page.$$('h2');
    const h3Elements = await page.$$('h3');
    
    logTest('visualDesign', 'Visual hierarchy established', 
      h1Elements.length > 0 && h2Elements.length > 0, 
      `H1: ${h1Elements.length}, H2: ${h2Elements.length}, H3: ${h3Elements.length}`);
    
    await takeScreenshot(page, 'visual-design-overview');
    
  } catch (error) {
    logTest('visualDesign', 'Visual design test failed', false, error.message);
  }
}

// Interactive elements tests
async function testInteractiveElements(page) {
  console.log('\n🖱️ Testing Interactive Elements and Micro-interactions...');
  
  try {
    // Test button hover states
    const buttons = await page.$$('button, .btn, a[role="button"]');
    let hoverStatesWorking = 0;
    
    for (let i = 0; i < Math.min(buttons.length, 5); i++) {
      try {
        const button = buttons[i];
        await button.hover();
        await page.waitForTimeout(300); // Wait for transition
        
        const stylesBefore = await getElementStyles(page, button);
        await page.mouse.move(0, 0); // Move away
        await page.waitForTimeout(300);
        const stylesAfter = await getElementStyles(page, button);
        
        // Check if styles changed on hover
        if (stylesBefore && stylesAfter) {
          const hasHoverEffect = stylesBefore.backgroundColor !== stylesAfter.backgroundColor ||
                                stylesBefore.transform !== stylesAfter.transform ||
                                stylesBefore.boxShadow !== stylesAfter.boxShadow;
          if (hasHoverEffect) hoverStatesWorking++;
        }
      } catch (error) {
        // Continue with next button
      }
    }
    
    logTest('interactiveElements', 'Button hover states working', 
      hoverStatesWorking > 0, `${hoverStatesWorking}/${Math.min(buttons.length, 5)} buttons have hover effects`);
    
    // Test form field interactions
    const formFields = await page.$$('input, textarea, select');
    let formFieldsInteractive = 0;
    
    for (let i = 0; i < Math.min(formFields.length, 3); i++) {
      try {
        const field = formFields[i];
        await field.focus();
        await page.waitForTimeout(200);
        
        const isFocused = await field.evaluate(el => document.activeElement === el);
        if (isFocused) formFieldsInteractive++;
      } catch (error) {
        // Continue with next field
      }
    }
    
    logTest('interactiveElements', 'Form field focus states working', 
      formFieldsInteractive > 0, `${formFieldsInteractive}/${Math.min(formFields.length, 3)} fields are focusable`);
    
    // Test modal animations (if modals exist)
    const modalTriggers = await page.$$('[data-modal-target], [data-bs-toggle="modal"], .modal-trigger');
    if (modalTriggers.length > 0) {
      try {
        await modalTriggers[0].click();
        await page.waitForTimeout(500);
        
        const modalVisible = await isElementVisible(page, '.modal, .dialog, [role="dialog"]');
        logTest('interactiveElements', 'Modal opens on trigger click', modalVisible);
        
        if (modalVisible) {
          await takeScreenshot(page, 'modal-open');
          
          // Test modal close
          const closeButton = await page.$('.modal-close, .close, [data-dismiss="modal"], button[aria-label="Close"]');
          if (closeButton) {
            await closeButton.click();
            await page.waitForTimeout(500);
            
            const modalClosed = !(await isElementVisible(page, '.modal, .dialog, [role="dialog"]'));
            logTest('interactiveElements', 'Modal closes on close button click', modalClosed);
          }
        }
      } catch (error) {
        logTest('interactiveElements', 'Modal interaction test failed', false, error.message);
      }
    } else {
      logTest('interactiveElements', 'Modal triggers found', false, 'No modal triggers found on page');
    }
    
    // Test card hover effects
    const cards = await page.$$('.card, .hover-card, [class*="card"]');
    let cardsWithHover = 0;
    
    for (let i = 0; i < Math.min(cards.length, 3); i++) {
      try {
        const card = cards[i];
        const stylesBefore = await getElementStyles(page, card);
        await card.hover();
        await page.waitForTimeout(300);
        const stylesAfter = await getElementStyles(page, card);
        
        if (stylesBefore && stylesAfter) {
          const hasHoverEffect = stylesBefore.transform !== stylesAfter.transform ||
                                stylesBefore.boxShadow !== stylesAfter.boxShadow ||
                                stylesBefore.backgroundColor !== stylesAfter.backgroundColor;
          if (hasHoverEffect) cardsWithHover++;
        }
      } catch (error) {
        // Continue with next card
      }
    }
    
    logTest('interactiveElements', 'Card hover effects working', 
      cardsWithHover > 0, `${cardsWithHover}/${Math.min(cards.length, 3)} cards have hover effects`);
    
  } catch (error) {
    logTest('interactiveElements', 'Interactive elements test failed', false, error.message);
  }
}

// Navigation tests
async function testNavigation(page) {
  console.log('\n🧭 Testing Navigation and Sidebar...');
  
  try {
    // Test sidebar presence
    const sidebar = await page.$('.sidebar, nav, [role="navigation"]');
    logTest('navigation', 'Sidebar/navigation present', !!sidebar);
    
    if (sidebar) {
      // Test sidebar collapse/expand functionality
      const toggleButton = await page.$('.sidebar-toggle, .menu-toggle, [aria-label="toggle sidebar"], .hamburger');
      if (toggleButton) {
        const sidebarVisibleBefore = await sidebar.isVisible();
        await toggleButton.click();
        await page.waitForTimeout(500);
        const sidebarVisibleAfter = await sidebar.isVisible();
        
        const toggleWorking = sidebarVisibleBefore !== sidebarVisibleAfter;
        logTest('navigation', 'Sidebar toggle functionality', toggleWorking);
        
        // Restore sidebar if it was hidden
        if (!sidebarVisibleAfter) {
          await toggleButton.click();
          await page.waitForTimeout(500);
        }
      } else {
        logTest('navigation', 'Sidebar toggle button found', false, 'No toggle button found');
      }
      
      // Test navigation links
      const navLinks = await sidebar.$$('a, [role="menuitem"]');
      let workingNavLinks = 0;
      
      for (let i = 0; i < Math.min(navLinks.length, 5); i++) {
        try {
          const link = navLinks[i];
          const href = await link.getAttribute('href');
          const text = await link.textContent();
          
          if (href && text && href !== '#') {
            const currentUrl = page.url();
            await link.click();
            await page.waitForTimeout(1000);
            
            const navigated = page.url() !== currentUrl;
            if (navigated) workingNavLinks++;
            
            // Go back to continue testing
            await page.goBack();
            await page.waitForTimeout(1000);
          }
        } catch (error) {
          // Continue with next link
        }
      }
      
      logTest('navigation', 'Navigation links functional', 
        workingNavLinks > 0, `${workingNavLinks}/${Math.min(navLinks.length, 5)} links work correctly`);
      
      // Test active page highlighting
      const activeLinks = await sidebar.$$('.active, [aria-current="page"], .current');
      logTest('navigation', 'Active page highlighting', activeLinks.length > 0, 
        `Found ${activeLinks.length} active navigation items`);
    }
    
    // Test logo navigation
    const logo = await page.$('.logo, .brand, [alt="logo"], a[href="/"]');
    if (logo) {
      const currentUrl = page.url();
      await logo.click();
      await page.waitForTimeout(1000);
      
      const navigatedToHome = page.url().includes('/dashboard') || page.url().endsWith('/');
      logTest('navigation', 'Logo navigates to dashboard/home', navigatedToHome);
    }
    
    // Test logout functionality
    const logoutButton = await page.$('.logout, [data-logout], button:has-text("Logout"), button:has-text("Sign out")');
    if (logoutButton) {
      const currentUrl = page.url();
      await logoutButton.click();
      await page.waitForTimeout(2000);
      
      const loggedOut = page.url().includes('/login') || page.url().includes('/signin');
      logTest('navigation', 'Logout functionality works', loggedOut);
      
      // Log back in to continue testing
      if (loggedOut) {
        await page.goto(`${BASE_URL}/login`);
        await page.fill('input[type="email"], input[name="email"]', TEST_CREDENTIALS.email);
        await page.fill('input[type="password"], input[name="password"]', TEST_CREDENTIALS.password);
        await Promise.all([
          page.waitForNavigation({ timeout: 10000 }),
          page.click('button[type="submit"]')
        ]);
        await page.waitForTimeout(1000);
      }
    }
    
    await takeScreenshot(page, 'navigation-overview');
    
  } catch (error) {
    logTest('navigation', 'Navigation test failed', false, error.message);
  }
}

// Responsive design tests
async function testResponsiveDesign(page) {
  console.log('\n📱 Testing Responsive Design...');
  
  try {
    const originalViewport = page.viewportSize();
    
    // Test mobile view
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'mobile-view', 'mobile');
    
    // Check mobile-specific elements
    const mobileMenu = await page.$('.mobile-menu, .hamburger, [aria-label="menu"], .menu-toggle');
    logTest('responsive', 'Mobile menu present in mobile view', !!mobileMenu);
    
    // Test that content is readable on mobile
    const bodyText = await page.$eval('body', el => window.getComputedStyle(el).fontSize);
    const readableFontSize = parseFloat(bodyText) >= 14;
    logTest('responsive', 'Text readable on mobile', readableFontSize, `Font size: ${bodyText}`);
    
    // Test horizontal scrolling (should not exist)
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > document.body.clientWidth;
    });
    logTest('responsive', 'No horizontal scroll on mobile', !hasHorizontalScroll);
    
    // Test tablet view
    await page.setViewportSize(VIEWPORTS.tablet);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'tablet-view', 'tablet');
    
    // Test laptop view
    await page.setViewportSize(VIEWPORTS.laptop);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'laptop-view', 'laptop');
    
    // Test desktop view
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'desktop-view', 'desktop');
    
    // Test touch-friendly controls on mobile
    await page.setViewportSize(VIEWPORTS.mobile);
    const buttons = await page.$$('button, .btn, a[role="button"]');
    let touchFriendlyButtons = 0;
    
    for (let i = 0; i < Math.min(buttons.length, 5); i++) {
      try {
        const button = buttons[i];
        const styles = await getElementStyles(page, button);
        if (styles) {
          const padding = parseInt(styles.padding) || 0;
          const fontSize = parseFloat(styles.fontSize) || 0;
          
          // Touch targets should be at least 44x44px
          const boundingBox = await button.boundingBox();
          if (boundingBox && boundingBox.height >= 44 && boundingBox.width >= 44) {
            touchFriendlyButtons++;
          }
        }
      } catch (error) {
        // Continue with next button
      }
    }
    
    logTest('responsive', 'Touch-friendly controls on mobile', 
      touchFriendlyButtons > 0, `${touchFriendlyButtons}/${Math.min(buttons.length, 5)} buttons are touch-friendly`);
    
    // Restore original viewport
    await page.setViewportSize(originalViewport);
    
  } catch (error) {
    logTest('responsive', 'Responsive design test failed', false, error.message);
  }
}

// Theme and styling tests
async function testThemeAndStyling(page) {
  console.log('\n🎭 Testing Theme and Styling...');
  
  try {
    // Test dark/light theme consistency
    const body = await page.$('body');
    const bodyStyles = await getElementStyles(page, body);
    
    logTest('theme', 'Theme styles applied', !!bodyStyles, 
      `Background: ${bodyStyles?.backgroundColor}, Color: ${bodyStyles?.color}`);
    
    // Test blur effects and transparency
    const blurElements = await page.$$('.backdrop-blur, [style*="blur"], .glass');
    logTest('theme', 'Blur effects present', blurElements.length > 0, 
      `Found ${blurElements.length} elements with blur effects`);
    
    // Test color-coded elements
    const colorCodedElements = await page.$$('.text-green, .text-red, .text-blue, .text-yellow, [class*="success"], [class*="error"], [class*="warning"]');
    logTest('theme', 'Color-coded elements present', colorCodedElements.length > 0, 
      `Found ${colorCodedElements.length} color-coded elements`);
    
    // Test visual feedback for states
    const interactiveElements = await page.$$('button, .btn, input, a');
    let elementsWithStateStyles = 0;
    
    for (let i = 0; i < Math.min(interactiveElements.length, 5); i++) {
      try {
        const element = interactiveElements[i];
        const styles = await getElementStyles(page, element);
        if (styles && (styles.transition || styles.transform || styles.boxShadow)) {
          elementsWithStateStyles++;
        }
      } catch (error) {
        // Continue with next element
      }
    }
    
    logTest('theme', 'Visual feedback for interactive states', 
      elementsWithStateStyles > 0, `${elementsWithStateStyles}/${Math.min(interactiveElements.length, 5)} elements have state styles`);
    
    // Test consistent spacing and alignment
    const gridElements = await page.$$('.grid, .flex, [class*="grid"], [class*="flex"]');
    logTest('theme', 'Layout system used', gridElements.length > 0, 
      `Found ${gridElements.length} elements using grid/flex layout`);
    
    await takeScreenshot(page, 'theme-overview');
    
  } catch (error) {
    logTest('theme', 'Theme and styling test failed', false, error.message);
  }
}

// Accessibility tests
async function testAccessibility(page) {
  console.log('\n♿ Testing Accessibility Features...');
  
  try {
    // Test keyboard navigation
    let tabbableElements = 0;
    let keyboardNavigationWorking = false;
    
    try {
      // Get all tabbable elements
      tabbableElements = await page.$$eval('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', 
        els => els.length);
      
      if (tabbableElements > 0) {
        // Test Tab navigation
        await page.keyboard.press('Tab');
        await page.waitForTimeout(200);
        
        const focusedElement = await page.evaluate(() => document.activeElement.tagName);
        keyboardNavigationWorking = focusedElement !== 'BODY';
      }
    } catch (error) {
      // Continue with other tests
    }
    
    logTest('accessibility', 'Keyboard navigation possible', keyboardNavigationWorking, 
      `Found ${tabbableElements} tabbable elements`);
    
    // Test focus indicators
    const focusableElements = await page.$$('button, input, select, textarea, a');
    let elementsWithFocusStyles = 0;
    
    for (let i = 0; i < Math.min(focusableElements.length, 3); i++) {
      try {
        const element = focusableElements[i];
        await element.focus();
        await page.waitForTimeout(200);
        
        const styles = await getElementStyles(page, element);
        if (styles && (styles.outline || styles.boxShadow || styles.border)) {
          elementsWithFocusStyles++;
        }
      } catch (error) {
        // Continue with next element
      }
    }
    
    logTest('accessibility', 'Focus indicators present', 
      elementsWithFocusStyles > 0, `${elementsWithFocusStyles}/${Math.min(focusableElements.length, 3)} elements have focus styles`);
    
    // Test ARIA labels
    const elementsWithAria = await page.$$('[aria-label], [aria-labelledby], [aria-describedby], role="button"], role="navigation"], role="main"]');
    logTest('accessibility', 'ARIA attributes used', elementsWithAria.length > 0, 
      `Found ${elementsWithAria.length} elements with ARIA attributes`);
    
    // Test semantic HTML
    const semanticElements = await page.$$('header, nav, main, section, article, aside, footer');
    logTest('accessibility', 'Semantic HTML elements used', semanticElements.length > 0, 
      `Found ${semanticElements.length} semantic elements`);
    
    // Test alt text for images
    const images = await page.$$('img');
    let imagesWithAlt = 0;
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      if (alt !== null) imagesWithAlt++;
    }
    
    logTest('accessibility', 'Images have alt text', 
      images.length === 0 || imagesWithAlt === images.length, 
      `${imagesWithAlt}/${images.length} images have alt text`);
    
    // Test heading hierarchy
    const headings = await page.$$('h1, h2, h3, h4, h5, h6');
    let properHierarchy = true;
    let lastLevel = 0;
    
    for (const heading of headings) {
      const level = parseInt(heading.tagName.substring(1));
      if (level > lastLevel + 1) {
        properHierarchy = false;
        break;
      }
      lastLevel = level;
    }
    
    logTest('accessibility', 'Proper heading hierarchy', properHierarchy, 
      `Found ${headings.length} headings with proper hierarchy`);
    
    // Test color contrast (basic check)
    const textElements = await page.$$('p, span, div, h1, h2, h3, h4, h5, h6');
    let readableTextElements = 0;
    
    for (let i = 0; i < Math.min(textElements.length, 5); i++) {
      try {
        const element = textElements[i];
        const styles = await getElementStyles(page, element);
        if (styles && styles.color && styles.backgroundColor) {
          // This is a simplified check - real contrast calculation is more complex
          const hasContrast = styles.color !== styles.backgroundColor;
          if (hasContrast) readableTextElements++;
        }
      } catch (error) {
        // Continue with next element
      }
    }
    
    logTest('accessibility', 'Text color contrast', 
      readableTextElements > 0, `${readableTextElements}/${Math.min(textElements.length, 5)} elements have color contrast`);
    
  } catch (error) {
    logTest('accessibility', 'Accessibility test failed', false, error.message);
  }
}

// Loading states and error handling tests
async function testLoadingAndErrorHandling(page) {
  console.log('\n⏳ Testing Loading States and Error Handling...');
  
  try {
    // Test loading spinners/skeletons
    const loadingElements = await page.$$('.loading, .spinner, .skeleton, [class*="loading"], [class*="spinner"]');
    logTest('loadingAndError', 'Loading indicators present', loadingElements.length > 0, 
      `Found ${loadingElements.length} loading elements`);
    
    // Test error message display (simulate network error)
    // This would require intercepting network requests, which is complex
    // Instead, we'll check if error containers exist
    const errorContainers = await page.$$('.error, .alert-error, [role="alert"], .error-message');
    logTest('loadingAndError', 'Error containers present', errorContainers.length > 0, 
      `Found ${errorContainers.length} error containers`);
    
    // Test empty state handling
    const emptyStates = await page.$$('.empty, .no-data, [class*="empty"], [class*="no-data"]');
    logTest('loadingAndError', 'Empty state components present', emptyStates.length > 0, 
      `Found ${emptyStates.length} empty state components`);
    
    // Test success messages
    const successMessages = await page.$$('.success, .alert-success, .toast, [class*="success"]');
    logTest('loadingAndError', 'Success message components present', successMessages.length > 0, 
      `Found ${successMessages.length} success message components`);
    
    // Test user-friendly error messages
    const userFriendlyErrors = await page.$$('.error, .alert-error');
    let hasUserFriendlyErrors = false;
    
    for (const errorElement of userFriendlyErrors) {
      try {
        const text = await errorElement.textContent();
        if (text && text.length > 10 && !text.includes('undefined') && !text.includes('null')) {
          hasUserFriendlyErrors = true;
          break;
        }
      } catch (error) {
        // Continue with next element
      }
    }
    
    logTest('loadingAndError', 'User-friendly error messages', hasUserFriendlyErrors);
    
    // Test form validation messages
    const validationMessages = await page.$$('.validation, .error-message, [class*="error"], [class*="validation"]');
    logTest('loadingAndError', 'Form validation messages present', validationMessages.length > 0, 
      `Found ${validationMessages.length} validation message elements`);
    
    await takeScreenshot(page, 'loading-error-overview');
    
  } catch (error) {
    logTest('loadingAndError', 'Loading and error handling test failed', false, error.message);
  }
}

// Main test execution function
async function runComprehensiveUIUXTest() {
  console.log('🚀 Starting Comprehensive UI/UX Test for VeroTrade...');
  console.log('==================================================');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: VIEWPORTS.desktop,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  try {
    // Start with authentication
    await testAuthentication(page);
    
    // If authentication was successful, continue with other tests
    const isLoggedIn = page.url().includes('/dashboard') || page.url().includes('/trades');
    
    if (isLoggedIn) {
      // Run all UI/UX tests
      await testVisualDesign(page);
      await testInteractiveElements(page);
      await testNavigation(page);
      await testResponsiveDesign(page);
      await testThemeAndStyling(page);
      await testAccessibility(page);
      await testLoadingAndErrorHandling(page);
    } else {
      console.log('❌ Authentication failed. Skipping remaining tests.');
      logTest('authentication', 'Overall test suite', false, 'Authentication failed, cannot proceed with UI/UX tests');
    }
    
    // Generate final report
    const reportPath = path.join(__dirname, `ui-ux-test-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    
    console.log('\n📊 Test Summary:');
    console.log('================');
    console.log(`Total Tests: ${testResults.summary.total}`);
    console.log(`Passed: ${testResults.summary.passed} ✅`);
    console.log(`Failed: ${testResults.summary.failed} ❌`);
    console.log(`Success Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`);
    
    console.log('\n📸 Screenshots taken:');
    testResults.screenshots.forEach(screenshot => {
      console.log(`- ${screenshot.name} (${screenshot.viewport}): ${screenshot.filename}`);
    });
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    if (testResults.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      testResults.errors.forEach(error => console.log(`- ${error}`));
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    testResults.errors.push(`Test execution failed: ${error.message}`);
  } finally {
    await browser.close();
  }
  
  return testResults;
}

// Run the tests if this file is executed directly
if (require.main === module) {
  runComprehensiveUIUXTest()
    .then(results => {
      console.log('\n✅ UI/UX testing completed!');
      process.exit(results.summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ UI/UX testing failed:', error);
      process.exit(1);
    });
}

module.exports = { runComprehensiveUIUXTest, testResults };