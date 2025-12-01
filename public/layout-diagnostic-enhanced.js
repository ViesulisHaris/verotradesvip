// Enhanced Layout Diagnostic Script
// This script will analyze the layout issues in the trading journal dashboard

console.log('🔍 Starting Enhanced Layout Diagnosis...');

// Wait for page to load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    runComprehensiveDiagnostics();
  }, 2000); // Wait 2 seconds for full render
});

function runComprehensiveDiagnostics() {
  console.log('📊 Running comprehensive layout diagnostics...');
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio
    },
    document: {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      offsetWidth: document.documentElement.offsetWidth
    },
    body: {
      scrollWidth: document.body.scrollWidth,
      clientWidth: document.body.clientWidth,
      offsetWidth: document.body.offsetWidth,
      computedStyle: window.getComputedStyle(document.body)
    },
    html: {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      offsetWidth: document.documentElement.offsetWidth,
      computedStyle: window.getComputedStyle(document.documentElement)
    }
  };

  // Check main container elements
  const mainContainer = document.querySelector('main');
  const dashboardContainer = document.querySelector('.max-w-screen-2xl');
  const gridContainer = document.querySelector('[class*="grid-cols-4"]');
  const sidebar = document.querySelector('aside');
  
  if (mainContainer) {
    diagnostics.main = {
      exists: true,
      width: mainContainer.offsetWidth,
      clientWidth: mainContainer.clientWidth,
      scrollWidth: mainContainer.scrollWidth,
      computedStyle: window.getComputedStyle(mainContainer),
      classes: mainContainer.className,
      marginLeft: window.getComputedStyle(mainContainer).marginLeft,
      marginRight: window.getComputedStyle(mainContainer).marginRight,
      paddingLeft: window.getComputedStyle(mainContainer).paddingLeft,
      paddingRight: window.getComputedStyle(mainContainer).paddingRight,
      maxWidth: window.getComputedStyle(mainContainer).maxWidth
    };
  } else {
    diagnostics.main = { exists: false };
  }

  if (dashboardContainer) {
    diagnostics.dashboard = {
      exists: true,
      width: dashboardContainer.offsetWidth,
      clientWidth: dashboardContainer.clientWidth,
      scrollWidth: dashboardContainer.scrollWidth,
      computedStyle: window.getComputedStyle(dashboardContainer),
      classes: dashboardContainer.className,
      maxWidth: window.getComputedStyle(dashboardContainer).maxWidth,
      marginLeft: window.getComputedStyle(dashboardContainer).marginLeft,
      marginRight: window.getComputedStyle(dashboardContainer).marginRight
    };
  } else {
    diagnostics.dashboard = { exists: false };
  }

  if (gridContainer) {
    diagnostics.grid = {
      exists: true,
      width: gridContainer.offsetWidth,
      clientWidth: gridContainer.clientWidth,
      scrollWidth: gridContainer.scrollWidth,
      computedStyle: window.getComputedStyle(gridContainer),
      classes: gridContainer.className,
      gridTemplateColumns: window.getComputedStyle(gridContainer).gridTemplateColumns,
      display: window.getComputedStyle(gridContainer).display
    };
  } else {
    diagnostics.grid = { exists: false };
  }

  if (sidebar) {
    diagnostics.sidebar = {
      exists: true,
      width: sidebar.offsetWidth,
      clientWidth: sidebar.clientWidth,
      computedStyle: window.getComputedStyle(sidebar),
      classes: sidebar.className,
      position: window.getComputedStyle(sidebar).position,
      display: window.getComputedStyle(sidebar).display
    };
  } else {
    diagnostics.sidebar = { exists: false };
  }

  // Check for CSS overrides
  const allElements = document.querySelectorAll('*');
  const problematicElements = [];
  
  allElements.forEach(el => {
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    
    // Check for elements that might be constraining width
    if (style.maxWidth && style.maxWidth !== 'none' && parseFloat(style.maxWidth) < window.innerWidth * 0.8) {
      problematicElements.push({
        element: el.tagName.toLowerCase() + (el.className ? '.' + el.className.split(' ').join('.') : ''),
        maxWidth: style.maxWidth,
        width: rect.width,
        issue: 'Constraining maxWidth'
      });
    }
  });

  diagnostics.problematicElements = problematicElements;

  // Check Tailwind classes being applied
  const tailwindClasses = {
    container: document.querySelector('.max-w-screen-2xl') ? 'Found' : 'Missing',
    grid: document.querySelector('[class*="grid-cols-4"]') ? 'Found' : 'Missing',
    responsive: {
      sm: document.querySelector('[class*="sm:"]') ? 'Found' : 'Missing',
      md: document.querySelector('[class*="md:"]') ? 'Found' : 'Missing',
      lg: document.querySelector('[class*="lg:"]') ? 'Found' : 'Missing',
      xl: document.querySelector('[class*="xl:"]') ? 'Found' : 'Missing',
      '2xl': document.querySelector('[class*="2xl:"]') ? 'Found' : 'Missing'
    }
  };

  diagnostics.tailwindClasses = tailwindClasses;

  // Check for viewport meta tag
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  diagnostics.viewportMeta = viewportMeta ? viewportMeta.content : 'Missing';

  // Analyze issues
  const issues = [];
  
  if (window.innerWidth >= 1024) { // Desktop
    if (!diagnostics.sidebar.exists) {
      issues.push('❌ Desktop sidebar not found');
    }
    
    if (!diagnostics.dashboard.exists) {
      issues.push('❌ Dashboard container (.max-w-screen-2xl) not found');
    }
    
    if (!diagnostics.grid.exists) {
      issues.push('❌ Grid container not found');
    }
    
    if (diagnostics.main && diagnostics.main.maxWidth && parseFloat(diagnostics.main.maxWidth) < window.innerWidth * 0.9) {
      issues.push(`❌ Main container constrained: ${diagnostics.main.maxWidth}`);
    }
    
    if (diagnostics.dashboard && diagnostics.dashboard.maxWidth && diagnostics.dashboard.maxWidth !== '1536px') {
      issues.push(`❌ Dashboard container wrong maxWidth: ${diagnostics.dashboard.maxWidth} (should be 1536px)`);
    }
    
    if (diagnostics.grid && diagnostics.grid.gridTemplateColumns && !diagnostics.grid.gridTemplateColumns.includes('repeat(4,')) {
      issues.push(`❌ Grid not 4-column: ${diagnostics.grid.gridTemplateColumns}`);
    }
    
    if (parseFloat(diagnostics.html.computedStyle.fontSize) < 16) {
      issues.push(`❌ Font size too small: ${diagnostics.html.computedStyle.fontSize} (should be 16px+)`);
    }
  }

  diagnostics.issues = issues;

  // Log results
  console.group('🔍 ENHANCED LAYOUT DIAGNOSTICS');
  console.log('📊 Complete Diagnostics:', diagnostics);
  console.log('🖥️ Viewport Info:', diagnostics.viewport);
  console.log('📄 Document Info:', diagnostics.document);
  console.log('🏗️ Main Container:', diagnostics.main);
  console.log('📱 Dashboard Container:', diagnostics.dashboard);
  console.log('🎯 Grid Container:', diagnostics.grid);
  console.log('📋 Sidebar:', diagnostics.sidebar);
  console.log('🎨 Tailwind Classes:', diagnostics.tailwindClasses);
  console.log('📱 Viewport Meta:', diagnostics.viewportMeta);
  
  if (issues.length > 0) {
    console.group('❌ ISSUES FOUND');
    issues.forEach(issue => console.log(issue));
    console.groupEnd();
  } else {
    console.log('✅ No layout issues detected');
  }
  
  if (problematicElements.length > 0) {
    console.group('⚠️ PROBLEMATIC ELEMENTS');
    problematicElements.forEach(el => console.log(el));
    console.groupEnd();
  }
  
  console.groupEnd();

  // Create visual overlay with diagnostics
  createDiagnosticOverlay(diagnostics);
}

function createDiagnosticOverlay(diagnostics) {
  // Remove existing overlay
  const existingOverlay = document.getElementById('layout-diagnostic-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }

  const overlay = document.createElement('div');
  overlay.id = 'layout-diagnostic-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 400px;
    max-height: 80vh;
    overflow-y: auto;
    background: rgba(0, 0, 0, 0.95);
    color: white;
    padding: 20px;
    border-radius: 8px;
    font-family: monospace;
    font-size: 12px;
    z-index: 9999;
    border: 2px solid #ff6b6b;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  `;

  const issuesHtml = diagnostics.issues.length > 0 
    ? diagnostics.issues.map(issue => `<div style="color: #ff6b6b; margin: 4px 0;">${issue}</div>`).join('')
    : '<div style="color: #51cf66; margin: 4px 0;">✅ No layout issues detected</div>';

  overlay.innerHTML = `
    <div style="font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #ffd43b;">
      🔍 LAYOUT DIAGNOSTICS
    </div>
    
    <div style="margin-bottom: 10px;">
      <strong>Viewport:</strong> ${diagnostics.viewport.width}px × ${diagnostics.viewport.height}px
    </div>
    
    <div style="margin-bottom: 10px;">
      <strong>Device:</strong> ${diagnostics.viewport.width >= 1024 ? 'Desktop' : diagnostics.viewport.width >= 640 ? 'Tablet' : 'Mobile'}
    </div>
    
    <div style="margin-bottom: 10px;">
      <strong>Font Size:</strong> ${diagnostics.html.computedStyle.fontSize} ${parseFloat(diagnostics.html.computedStyle.fontSize) >= 16 ? '✅' : '❌'}
    </div>
    
    <div style="margin-bottom: 10px;">
      <strong>Dashboard Container:</strong> ${diagnostics.dashboard.exists ? diagnostics.dashboard.maxWidth : '❌ Missing'}
    </div>
    
    <div style="margin-bottom: 10px;">
      <strong>Grid Container:</strong> ${diagnostics.grid.exists ? diagnostics.grid.gridTemplateColumns : '❌ Missing'}
    </div>
    
    <div style="margin-bottom: 10px;">
      <strong>Main Width:</strong> ${diagnostics.main ? diagnostics.main.width + 'px' : 'N/A'}
    </div>
    
    <div style="margin-bottom: 10px;">
      <strong>Sidebar:</strong> ${diagnostics.sidebar.exists ? diagnostics.sidebar.width + 'px' : '❌ Missing'}
    </div>
    
    <div style="margin: 15px 0; padding-top: 10px; border-top: 1px solid #555;">
      <strong>ISSUES:</strong>
      ${issuesHtml}
    </div>
    
    <div style="margin-top: 15px; font-size: 10px; color: #888;">
      ${diagnostics.timestamp}
    </div>
    
    <button onclick="this.parentElement.remove()" style="
      position: absolute;
      top: 10px;
      right: 10px;
      background: #ff6b6b;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      cursor: pointer;
      font-size: 10px;
    ">✕</button>
  `;

  document.body.appendChild(overlay);
}

// Also run diagnostics on resize
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    runComprehensiveDiagnostics();
  }, 500);
});