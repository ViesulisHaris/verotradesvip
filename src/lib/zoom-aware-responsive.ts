/**
 * Zoom-Aware Responsive Utilities
 * 
 * This module provides CSS utilities and JavaScript functions
 * to handle responsive breakpoints correctly when browser zoom is applied.
 */

export interface ZoomAwareBreakpoints {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

export const DEFAULT_BREAKPOINTS: ZoomAwareBreakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

/**
 * Generate zoom-aware media queries
 */
export function createZoomAwareMediaQuery(breakpointKey: keyof ZoomAwareBreakpoints, zoomLevel: number = 1): string {
  const breakpointValue = DEFAULT_BREAKPOINTS[breakpointKey];
  const adjustedBreakpoint = breakpointValue / zoomLevel;
  return `(min-width: ${adjustedBreakpoint}px)`;
}

/**
 * Generate zoom-aware max-width media queries
 */
export function createZoomAwareMaxMediaQuery(breakpointKey: keyof ZoomAwareBreakpoints, zoomLevel: number = 1): string {
  const breakpointValue = DEFAULT_BREAKPOINTS[breakpointKey];
  const adjustedBreakpoint = breakpointValue / zoomLevel;
  return `(max-width: ${adjustedBreakpoint - 1}px)`;
}

/**
 * Generate zoom-aware range media queries
 */
export function createZoomAwareRangeMediaQuery(
  minBreakpoint: keyof ZoomAwareBreakpoints,
  maxBreakpoint: keyof ZoomAwareBreakpoints,
  zoomLevel: number = 1
): string {
  const min = DEFAULT_BREAKPOINTS[minBreakpoint];
  const max = DEFAULT_BREAKPOINTS[maxBreakpoint];
  const adjustedMin = min / zoomLevel;
  const adjustedMax = (max / zoomLevel) - 1;
  return `(min-width: ${adjustedMin}px) and (max-width: ${adjustedMax}px)`;
}

/**
 * Get current zoom-aware breakpoint
 */
export function getZoomAwareBreakpoint(width: number, zoomLevel: number = 1): keyof ZoomAwareBreakpoints {
  const effectiveWidth = width * zoomLevel;
  
  if (effectiveWidth >= DEFAULT_BREAKPOINTS['2xl']) return '2xl';
  if (effectiveWidth >= DEFAULT_BREAKPOINTS.xl) return 'xl';
  if (effectiveWidth >= DEFAULT_BREAKPOINTS.lg) return 'lg';
  if (effectiveWidth >= DEFAULT_BREAKPOINTS.md) return 'md';
  return 'sm';
}

/**
 * Generate CSS custom properties for zoom-aware responsive design
 */
export function generateZoomAwareCSS(zoomLevel: number = 1): string {
  const breakpoints = DEFAULT_BREAKPOINTS;
  
  return `
    /* Zoom-aware responsive breakpoints */
    :root {
      --zoom-level: ${zoomLevel};
      --zoom-sm: ${breakpoints.sm / zoomLevel}px;
      --zoom-md: ${breakpoints.md / zoomLevel}px;
      --zoom-lg: ${breakpoints.lg / zoomLevel}px;
      --zoom-xl: ${breakpoints.xl / zoomLevel}px;
      --zoom-2xl: ${breakpoints['2xl'] / zoomLevel}px;
    }

    /* Zoom-aware media queries using CSS custom properties */
    @media (min-width: var(--zoom-sm)) {
      .zoom-sm { display: block; }
      .zoom-sm-hidden { display: none; }
    }

    @media (min-width: var(--zoom-md)) {
      .zoom-md { display: block; }
      .zoom-md-hidden { display: none; }
    }

    @media (min-width: var(--zoom-lg)) {
      .zoom-lg { display: block; }
      .zoom-lg-hidden { display: none; }
    }

    @media (min-width: var(--zoom-xl)) {
      .zoom-xl { display: block; }
      .zoom-xl-hidden { display: none; }
    }

    @media (min-width: var(--zoom-2xl)) {
      .zoom-2xl { display: block; }
      .zoom-2xl-hidden { display: none; }
    }

    /* Zoom-aware layout utilities */
    .zoom-desktop-only {
      display: none;
    }

    .zoom-tablet-only {
      display: none;
    }

    .zoom-mobile-only {
      display: none;
    }

    @media (min-width: var(--zoom-lg)) {
      .zoom-desktop-only {
        display: block;
      }
    }

    @media (min-width: var(--zoom-md)) and (max-width: calc(var(--zoom-lg) - 1px)) {
      .zoom-tablet-only {
        display: block;
      }
    }

    @media (max-width: calc(var(--zoom-md) - 1px)) {
      .zoom-mobile-only {
        display: block;
      }
    }

    /* Zoom-aware sidebar utilities */
    .zoom-sidebar-desktop {
      display: none;
    }

    .zoom-sidebar-mobile {
      display: none;
    }

    @media (min-width: var(--zoom-lg)) {
      .zoom-sidebar-desktop {
        display: flex;
      }
      .zoom-sidebar-mobile {
        display: none;
      }
    }

    @media (max-width: calc(var(--zoom-lg) - 1px)) {
      .zoom-sidebar-desktop {
        display: none;
      }
      .zoom-sidebar-mobile {
        display: flex;
      }
    }

    /* Zoom-aware grid utilities */
    .zoom-grid-mobile {
      grid-template-columns: 1fr;
    }

    .zoom-grid-tablet {
      grid-template-columns: repeat(2, 1fr);
    }

    .zoom-grid-desktop {
      grid-template-columns: repeat(3, 1fr);
    }

    @media (max-width: calc(var(--zoom-md) - 1px)) {
      .zoom-grid-mobile { grid-template-columns: 1fr; }
      .zoom-grid-tablet { display: none; }
      .zoom-grid-desktop { display: none; }
    }

    @media (min-width: var(--zoom-md)) and (max-width: calc(var(--zoom-lg) - 1px)) {
      .zoom-grid-mobile { display: none; }
      .zoom-grid-tablet { grid-template-columns: repeat(2, 1fr); }
      .zoom-grid-desktop { display: none; }
    }

    @media (min-width: var(--zoom-lg)) {
      .zoom-grid-mobile { display: none; }
      .zoom-grid-tablet { display: none; }
      .zoom-grid-desktop { grid-template-columns: repeat(3, 1fr); }
    }

    /* Zoom-aware text sizing */
    .zoom-text-adjust {
      font-size: calc(1rem / var(--zoom-level, 1));
    }

    .zoom-spacing-adjust {
      margin: calc(var(--space-4, 1rem) / var(--zoom-level, 1));
      padding: calc(var(--space-4, 1rem) / var(--zoom-level, 1));
      gap: calc(var(--space-4, 1rem) / var(--zoom-level, 1));
    }

    /* High zoom specific adjustments */
    .zoom-high .zoom-text-adjust {
      font-size: calc(0.9rem / var(--zoom-level, 1));
    }

    .zoom-low .zoom-text-adjust {
      font-size: calc(1.1rem / var(--zoom-level, 1));
    }
  `;
}

/**
 * Apply zoom-aware CSS to document
 */
export function applyZoomAwareCSS(zoomLevel: number = 1): void {
  // SSR safety check
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  try {
    const css = generateZoomAwareCSS(zoomLevel);
    
    // Create or update style element
    let styleElement = document.getElementById('zoom-aware-responsive-styles') as HTMLStyleElement;
    if (!styleElement) {
      styleElement = document.createElement('style') as HTMLStyleElement;
      styleElement.id = 'zoom-aware-responsive-styles';
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = css;
  } catch (error) {
    console.error('[ZOOM-AWARE-RESPONSIVE] Failed to apply CSS:', error);
  }
}

/**
 * Get zoom-aware class name for current breakpoint
 */
export function getZoomAwareClass(breakpoint: keyof ZoomAwareBreakpoints, prefix: string = 'zoom'): string {
  return `${prefix}-${breakpoint}`;
}

/**
 * Check if element should be visible at current zoom level
 */
export function shouldBeVisible(
  elementBreakpoint: keyof ZoomAwareBreakpoints,
  currentBreakpoint: keyof ZoomAwareBreakpoints,
  operator: 'min' | 'max' | 'exact' = 'min'
): boolean {
  const elementValue = DEFAULT_BREAKPOINTS[elementBreakpoint];
  const currentValue = DEFAULT_BREAKPOINTS[currentBreakpoint];
  
  switch (operator) {
    case 'min':
      return currentValue >= elementValue;
    case 'max':
      return currentValue <= elementValue;
    case 'exact':
      return currentValue === elementValue;
    default:
      return false;
  }
}

/**
 * Create zoom-aware responsive object for Tailwind-like utilities
 */
export function createZoomResponsiveClasses(
  zoomLevel: number = 1,
  currentBreakpoint: keyof ZoomAwareBreakpoints
): Record<string, string> {
  const classes: Record<string, string> = {
    // Display utilities
    'block': 'zoom-block',
    'hidden': 'zoom-hidden',
    'flex': 'zoom-flex',
    'grid': 'zoom-grid',
    
    // Layout utilities
    'desktop-only': 'zoom-desktop-only',
    'tablet-only': 'zoom-tablet-only',
    'mobile-only': 'zoom-mobile-only',
    
    // Sidebar utilities
    'sidebar-desktop': 'zoom-sidebar-desktop',
    'sidebar-mobile': 'zoom-sidebar-mobile',
    
    // Grid utilities
    'grid-mobile': 'zoom-grid-mobile',
    'grid-tablet': 'zoom-grid-tablet',
    'grid-desktop': 'zoom-grid-desktop',
    
    // Text utilities
    'text-adjust': 'zoom-text-adjust',
    'spacing-adjust': 'zoom-spacing-adjust'
  };
  
  // Add breakpoint-specific classes
  Object.keys(DEFAULT_BREAKPOINTS).forEach(bpKey => {
    const bp = bpKey as keyof ZoomAwareBreakpoints;
    classes[bp] = getZoomAwareClass(bp);
    classes[`${bp}-hidden`] = getZoomAwareClass(bp, 'zoom') + '-hidden';
  });
  
  return classes;
}

/**
 * Initialize zoom-aware responsive system
 */
export function initializeZoomAwareResponsive(zoomLevel: number = 1): void {
  // SSR safety check
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  try {
    // Apply CSS
    applyZoomAwareCSS(zoomLevel);
    
    // Add zoom-aware class to body
    document.body.classList.add('zoom-aware-responsive');
    
    // Add zoom level class
    if (zoomLevel < 0.9) {
      document.body.classList.add('zoom-low');
    } else if (zoomLevel > 1.1) {
      document.body.classList.add('zoom-high');
    } else {
      document.body.classList.add('zoom-normal');
    }
    
    console.log(`🔍 Zoom-aware responsive initialized with zoom level: ${zoomLevel}`);
  } catch (error) {
    console.error('[ZOOM-AWARE-RESPONSIVE] Failed to initialize:', error);
  }
}