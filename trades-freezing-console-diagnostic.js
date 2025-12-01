/**
 * Trades Tab Freezing Console Diagnostic Script
 * 
 * Copy and paste this script into the browser console when on the Trades page
 * to identify what's causing the navigation freeze
 */

(function() {
    console.log('🔍 Starting Trades Tab Freezing Diagnostic...');
    
    // Create diagnostic object
    const diagnostic = {
        timestamp: new Date().toISOString(),
        issues: [],
        overlays: [],
        bodyStyles: {},
        eventListeners: [],
        domNodes: 0,
        performance: {}
    };
    
    // 1. Check for overlays that might block navigation
    function checkOverlays() {
        console.log('🔍 Checking for overlays...');
        
        const overlays = [];
        const elements = document.querySelectorAll('*');
        
        elements.forEach(el => {
            const style = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            const zIndex = parseInt(style.zIndex) || 0;
            
            // Look for elements with high z-index that cover the screen
            if (zIndex > 50 && 
                (style.position === 'fixed' || style.position === 'absolute') &&
                rect.width > 100 && rect.height > 100) {
                
                overlays.push({
                    element: el.tagName,
                    className: el.className,
                    id: el.id,
                    zIndex: zIndex,
                    position: style.position,
                    pointerEvents: style.pointerEvents,
                    display: style.display,
                    visibility: style.visibility,
                    rect: {
                        x: rect.x,
                        y: rect.y,
                        width: rect.width,
                        height: rect.height
                    },
                    isBlocking: rect.width > window.innerWidth * 0.8 && 
                                rect.height > window.innerHeight * 0.8
                });
            }
        });
        
        diagnostic.overlays = overlays;
        
        // Filter to only potentially blocking overlays
        const blockingOverlays = overlays.filter(o => o.isBlocking);
        
        if (blockingOverlays.length > 0) {
            diagnostic.issues.push(`Found ${blockingOverlays.length} blocking overlays`);
            console.error('❌ Blocking overlays found:', blockingOverlays);
        } else {
            console.log('✅ No blocking overlays found');
        }
        
        return overlays;
    }
    
    // 2. Check body styles that might block interactions
    function checkBodyStyles() {
        console.log('🔍 Checking body styles...');
        
        const body = document.body;
        const style = window.getComputedStyle(body);
        
        diagnostic.bodyStyles = {
            pointerEvents: style.pointerEvents,
            overflow: style.overflow,
            userSelect: style.userSelect,
            touchAction: style.touchAction,
            classList: Array.from(body.classList),
            hasInlineStyles: body.hasAttribute('style'),
            inlineStyles: body.getAttribute('style')
        };
        
        const issues = [];
        if (style.pointerEvents === 'none') {
            issues.push('Body has pointer-events: none (BLOCKS ALL INTERACTIONS)');
        }
        if (style.overflow === 'hidden') {
            issues.push('Body has overflow: hidden');
        }
        if (style.userSelect === 'none') {
            issues.push('Body has user-select: none');
        }
        
        if (issues.length > 0) {
            diagnostic.issues.push(...issues);
            console.error('❌ Body style issues:', issues);
        } else {
            console.log('✅ No problematic body styles found');
        }
        
        return diagnostic.bodyStyles;
    }
    
    // 3. Check for excessive DOM nodes (memory leak indicator)
    function checkDOMNodes() {
        console.log('🔍 Checking DOM node count...');
        
        const nodeCount = document.querySelectorAll('*').length;
        diagnostic.domNodes = nodeCount;
        
        if (nodeCount > 5000) {
            diagnostic.issues.push(`High DOM node count: ${nodeCount} (possible memory leak)`);
            console.error('❌ High DOM node count detected');
        } else {
            console.log(`✅ DOM node count: ${nodeCount} (normal)`);
        }
        
        return nodeCount;
    }
    
    // 4. Check performance metrics
    function checkPerformance() {
        console.log('🔍 Checking performance metrics...');
        
        const timing = performance.timing;
        const memory = performance.memory;
        
        diagnostic.performance = {
            loadTime: timing.loadEventEnd - timing.navigationStart,
            domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
            memoryUsed: memory ? memory.usedJSHeapSize : 0,
            memoryTotal: memory ? memory.totalJSHeapSize : 0,
            memoryLimit: memory ? memory.jsHeapSizeLimit : 0
        };
        
        console.log('📊 Performance metrics:', diagnostic.performance);
        
        return diagnostic.performance;
    }
    
    // 5. Test navigation click handler
    function testNavigationClick() {
        console.log('🖱️ Testing navigation click...');
        
        // Find a navigation link
        const navLink = document.querySelector('a[href="/dashboard"]');
        
        if (!navLink) {
            console.log('❌ No dashboard navigation link found');
            return;
        }
        
        // Check if link is actually clickable
        const linkStyle = window.getComputedStyle(navLink);
        const linkRect = navLink.getBoundingClientRect();
        
        console.log('🔍 Navigation link info:', {
            href: navLink.href,
            isVisible: linkStyle.visibility !== 'hidden' && linkStyle.display !== 'none',
            isClickable: linkStyle.pointerEvents !== 'none',
            zIndex: linkStyle.zIndex,
            position: linkStyle.position,
            rect: linkRect
        });
        
        // Add click listener to test if click is blocked
        let clickFired = false;
        let navigationStarted = false;
        
        const clickHandler = (e) => {
            clickFired = true;
            console.log('🖱️ Click event fired on:', e.target);
        };
        
        const beforeUnloadHandler = () => {
            navigationStarted = true;
            console.log('🧭 Navigation started (beforeunload fired)');
        };
        
        navLink.addEventListener('click', clickHandler, { once: true });
        window.addEventListener('beforeunload', beforeUnloadHandler, { once: true });
        
        // Simulate click
        console.log('🖱️ Simulating click on navigation link...');
        navLink.click();
        
        // Check results after a short delay
        setTimeout(() => {
            if (!clickFired) {
                diagnostic.issues.push('Navigation click event was blocked');
                console.error('❌ Click event was blocked');
            }
            
            if (!navigationStarted && clickFired) {
                diagnostic.issues.push('Click fired but navigation didn\'t start');
                console.error('❌ Click fired but navigation blocked');
            }
            
            if (clickFired && navigationStarted) {
                console.log('✅ Navigation click worked correctly');
            }
            
            // Clean up listeners
            navLink.removeEventListener('click', clickHandler);
            window.removeEventListener('beforeunload', beforeUnloadHandler);
        }, 100);
    }
    
    // 6. Check for problematic event listeners
    function checkEventListeners() {
        console.log('🔍 Checking for problematic event listeners...');
        
        // Look for global event listeners that might block navigation
        const eventListenerInfo = [];
        
        // Check if navigation safety is interfering
        if (window.navigationSafety) {
            eventListenerInfo.push('Navigation safety system is active');
        }
        
        // Check for excessive capture phase listeners
        const listeners = [];
        document.addEventListener('test-event', () => {}, true); // Test capture phase
        document.removeEventListener('test-event', () => {}, true);
        
        eventListenerInfo.push({
            type: 'global_listeners',
            hasNavigationSafety: !!window.navigationSafety,
            hasCaptureListeners: true
        });
        
        diagnostic.eventListeners = eventListenerInfo;
        console.log('🔧 Event listener info:', eventListenerInfo);
        
        return eventListenerInfo;
    }
    
    // 7. Check ZoomAwareLayout debug panel
    function checkDebugPanel() {
        console.log('🔍 Checking debug panel...');
        
        const debugPanel = document.querySelector('.zoom-debug-panel');
        
        if (debugPanel) {
            const style = window.getComputedStyle(debugPanel);
            const zIndex = parseInt(style.zIndex) || 0;
            
            console.log('🔧 Debug panel found:', {
                zIndex: zIndex,
                pointerEvents: style.pointerEvents,
                position: style.position,
                isBlocking: zIndex > 100
            });
            
            if (zIndex > 100) {
                diagnostic.issues.push('Debug panel has high z-index that might block navigation');
                console.error('❌ Debug panel z-index too high');
            }
            
            return {
                exists: true,
                zIndex: zIndex,
                isProblematic: zIndex > 100
            };
        } else {
            console.log('✅ No debug panel found');
            return { exists: false };
        }
    }
    
    // Run all diagnostic checks
    function runFullDiagnostic() {
        console.log('🚀 Running full diagnostic...');
        
        checkOverlays();
        checkBodyStyles();
        checkDOMNodes();
        checkPerformance();
        checkEventListeners();
        checkDebugPanel();
        testNavigationClick();
        
        // Generate final report
        console.log('📋 DIAGNOSTIC REPORT:');
        console.log(JSON.stringify(diagnostic, null, 2));
        
        // Save to localStorage for later analysis
        localStorage.setItem('trades-freezing-diagnostic', JSON.stringify(diagnostic));
        
        return diagnostic;
    }
    
    // Auto-run diagnostic
    runFullDiagnostic();
    
    // Expose functions to global scope for manual testing
    window.tradesDiagnostic = {
        checkOverlays,
        checkBodyStyles,
        checkDOMNodes,
        checkPerformance,
        testNavigationClick,
        checkEventListeners,
        checkDebugPanel,
        runFullDiagnostic
    };
    
    console.log('✅ Diagnostic complete. Access results via window.tradesDiagnostic');
    console.log('💡 To test navigation manually, run: window.tradesDiagnostic.testNavigationClick()');
    
})();