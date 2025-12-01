const puppeteer = require('puppeteer');

async function verifyLayoutFixes() {
  console.log('🔍 LAYOUT FIXES VERIFICATION STARTED');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  const page = await browser.newPage();

  try {
    // Navigate to dashboard (will redirect to login, but we can check layout elements)
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
    
    // Wait a bit for any redirects
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    // Check if we're on login page or dashboard
    if (currentUrl.includes('/login')) {
      console.log('📱 Redirected to login page - checking login page layout...');
      
      // Test typography on login page
      const typographyAnalysis = await page.evaluate(() => {
        const allElements = document.querySelectorAll('*');
        let minFontSize = Infinity;
        let smallestElement = null;
        
        allElements.forEach(el => {
          if (el.children.length === 0 && el.textContent.trim()) {
            const styles = window.getComputedStyle(el);
            const fontSize = parseFloat(styles.fontSize);
            if (fontSize > 0 && fontSize < minFontSize) {
              minFontSize = fontSize;
              smallestElement = {
                tagName: el.tagName,
                className: el.className,
                text: el.textContent.substring(0, 50),
                fontSize: fontSize
              };
            }
          }
        });
        
        return {
          minFontSize,
          smallestElement,
          htmlFontSize: parseFloat(getComputedStyle(document.documentElement).fontSize),
          bodyFontSize: parseFloat(getComputedStyle(document.body).fontSize)
        };
      });
      
      console.log('📝 Typography Analysis:');
      console.log(`  HTML font-size: ${typographyAnalysis.htmlFontSize}px`);
      console.log(`  Body font-size: ${typographyAnalysis.bodyFontSize}px`);
      console.log(`  Minimum font size: ${typographyAnalysis.minFontSize}px`);
      console.log(`  Smallest element:`, typographyAnalysis.smallestElement);
      
      if (typographyAnalysis.minFontSize >= 16) {
        console.log('✅ Typography fix VERIFIED - All text is 16px or larger');
      } else {
        console.log('❌ Typography issue found - Some text is smaller than 16px');
      }
      
    } else if (currentUrl.includes('/dashboard')) {
      console.log('🖥️ On dashboard page - checking dashboard layout...');
      
      // Test main content container width
      const containerAnalysis = await page.evaluate(() => {
        const main = document.querySelector('main');
        if (!main) return { error: 'No main element found' };
        
        const styles = getComputedStyle(main);
        return {
          exists: true,
          className: main.className,
          maxWidth: styles.maxWidth,
          width: styles.width,
          marginLeft: styles.marginLeft,
          marginRight: styles.marginRight,
          hasMaxW7xl: main.classList.contains('max-w-7xl') || main.innerHTML.includes('max-w-7xl'),
          hasContainer: main.querySelector('.max-w-7xl') !== null
        };
      });
      
      console.log('📦 Container Analysis:');
      console.log(`  Main element exists: ${containerAnalysis.exists}`);
      console.log(`  Main classes: ${containerAnalysis.className}`);
      console.log(`  Max-width: ${containerAnalysis.maxWidth}`);
      console.log(`  Width: ${containerAnalysis.width}`);
      console.log(`  Margins: ${containerAnalysis.marginLeft} / ${containerAnalysis.marginRight}`);
      console.log(`  Has max-w-7xl: ${containerAnalysis.hasMaxW7xl}`);
      console.log(`  Has container: ${containerAnalysis.hasContainer}`);
      
      if (containerAnalysis.hasContainer) {
        console.log('✅ Container width constraint fix VERIFIED');
      } else {
        console.log('❌ Container width constraint issue found');
      }
      
      // Test sidebar visibility
      const sidebarAnalysis = await page.evaluate(() => {
        const desktopSidebar = document.querySelector('[class*="hidden lg:flex"]');
        const mobileSidebar = document.querySelector('[class*="lg:hidden"]');
        
        return {
          desktopSidebar: {
            exists: !!desktopSidebar,
            classes: desktopSidebar?.className || 'Not found',
            visible: desktopSidebar ? getComputedStyle(desktopSidebar).display !== 'none' : false
          },
          mobileSidebar: {
            exists: !!mobileSidebar,
            classes: mobileSidebar?.className || 'Not found',
            visible: mobileSidebar ? getComputedStyle(mobileSidebar).display !== 'none' : false
          }
        };
      });
      
      console.log('🖥️ Sidebar Analysis:');
      console.log(`  Desktop sidebar exists: ${sidebarAnalysis.desktopSidebar.exists}`);
      console.log(`  Desktop sidebar visible: ${sidebarAnalysis.desktopSidebar.visible}`);
      console.log(`  Mobile sidebar exists: ${sidebarAnalysis.mobileSidebar.exists}`);
      console.log(`  Mobile sidebar visible: ${sidebarAnalysis.mobileSidebar.visible}`);
      
      if (sidebarAnalysis.desktopSidebar.exists && !sidebarAnalysis.mobileSidebar.visible) {
        console.log('✅ Sidebar responsiveness fix VERIFIED');
      } else {
        console.log('❌ Sidebar responsiveness issue found');
      }
    }
    
    // Test responsive behavior by changing viewport
    console.log('\n📱 Testing responsive behavior...');
    
    // Mobile viewport
    await page.setViewport({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    const mobileLayout = await page.evaluate(() => {
      const desktopSidebar = document.querySelector('[class*="hidden lg:flex"]');
      const mobileSidebar = document.querySelector('[class*="lg:hidden"]');
      
      return {
        desktopSidebarVisible: desktopSidebar ? getComputedStyle(desktopSidebar).display !== 'none' : false,
        mobileSidebarExists: !!mobileSidebar
      };
    });
    
    console.log(`  Mobile (375px): Desktop sidebar visible: ${mobileLayout.desktopSidebarVisible}`);
    console.log(`  Mobile (375px): Mobile sidebar exists: ${mobileLayout.mobileSidebarExists}`);
    
    // Desktop viewport
    await page.setViewport({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    
    const desktopLayout = await page.evaluate(() => {
      const desktopSidebar = document.querySelector('[class*="hidden lg:flex"]');
      const mobileSidebar = document.querySelector('[class*="lg:hidden"]');
      
      return {
        desktopSidebarVisible: desktopSidebar ? getComputedStyle(desktopSidebar).display !== 'none' : false,
        mobileSidebarVisible: mobileSidebar ? getComputedStyle(mobileSidebar).display !== 'none' : false
      };
    });
    
    console.log(`  Desktop (1920px): Desktop sidebar visible: ${desktopLayout.desktopSidebarVisible}`);
    console.log(`  Desktop (1920px): Mobile sidebar visible: ${desktopLayout.mobileSidebarVisible}`);
    
    if (!mobileLayout.desktopSidebarVisible && desktopLayout.desktopSidebarVisible && !desktopLayout.mobileSidebarVisible) {
      console.log('✅ Responsive behavior VERIFIED');
    } else {
      console.log('❌ Responsive behavior issues found');
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  } finally {
    await browser.close();
  }
  
  console.log('\n🏁 LAYOUT FIXES VERIFICATION COMPLETED');
}

verifyLayoutFixes().catch(console.error);