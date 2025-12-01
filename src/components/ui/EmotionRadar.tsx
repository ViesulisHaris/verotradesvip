'use client';

import React, { useEffect, useState, Suspense, useCallback, useMemo, useRef } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, PolarRadiusAxis, Tooltip } from 'recharts';
import { Brain, AlertTriangle } from 'lucide-react';
import { useSidebarSync, getGlobalSidebarState } from '@/hooks/useSidebarSync';
import { debounce } from '@/lib/performance';

interface Data {
  subject: string;
  value: number;
  fullMark: number;
  leaning: string; // 'Buy Leaning', 'Sell Leaning', or 'Balanced'
  side: string; // 'Buy', 'Sell', or 'NULL'
  leaningValue?: number; // The actual leaning value (-100 to +100)
  totalTrades?: number; // Total number of trades for this emotion
}

interface Props {
  data: Data[];
}

// Define the 7 valid emotions from TradeForm
const VALID_EMOTIONS = ['FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'PATIENCE', 'REGRET', 'DISCIPLINE', 'CONFIDENT', 'ANXIOUS', 'NEUTRAL'];

/**
 * Comprehensive data validation function for EmotionRadar component
 * Validates data structure, emotion names, and numeric values to prevent SVG path rendering errors
 */
function validateEmotionRadarData(data: any[]): { isValid: boolean; validatedData: Data[]; warnings: string[] } {
  const warnings: string[] = [];
  const validatedData: Data[] = [];
  
  // Check if data is an array
  if (!Array.isArray(data)) {
    console.error('EmotionRadar: Invalid data - expected array, received:', typeof data, data);
    return { isValid: false, validatedData: [], warnings: ['Data is not an array'] };
  }
  
  // Process each data item
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    
    // Check if item exists and is an object
    if (!item || typeof item !== 'object') {
      warnings.push(`Item ${i}: Not an object - ${JSON.stringify(item)}`);
      continue;
    }
    
    // Validate subject (emotion name)
    if (typeof item.subject !== 'string' || !item.subject.trim()) {
      warnings.push(`Item ${i}: Missing or invalid subject`);
      continue;
    }
    
    const normalizedSubject = item.subject.toUpperCase().trim();
    if (!VALID_EMOTIONS.includes(normalizedSubject)) {
      warnings.push(`Item ${i}: Invalid emotion "${item.subject}" - not in valid emotions list`);
      continue;
    }
    
    // Validate value (must be a finite number)
    if (typeof item.value !== 'number') {
      warnings.push(`Item ${i}: Value is not a number - ${typeof item.value}`);
      continue;
    }
    
    if (!isFinite(item.value)) {
      warnings.push(`Item ${i}: Value is not finite (${item.value}) - NaN or Infinity detected`);
      continue;
    }
    
    // Check for reasonable value ranges (0-100% for radar chart)
    if (item.value < 0 || item.value > 100) {
      warnings.push(`Item ${i}: Value ${item.value} is outside expected range (0-100)`);
      // We'll still include it but clamp it to valid range
    }
    
    // Validate optional fields with proper defaults
    const leaning = typeof item.leaning === 'string' ? item.leaning.trim() : 'Balanced';
    const side = (item.side === 'Buy' || item.side === 'Sell') ? item.side : 'NULL';
    
    let leaningValue = 0;
    if (typeof item.leaningValue === 'number') {
      if (isFinite(item.leaningValue)) {
        leaningValue = Math.max(-100, Math.min(100, item.leaningValue));
      } else {
        warnings.push(`Item ${i}: leaningValue is not finite (${item.leaningValue})`);
      }
    }
    
    let totalTrades = 0;
    if (typeof item.totalTrades === 'number') {
      if (isFinite(item.totalTrades) && item.totalTrades >= 0) {
        totalTrades = item.totalTrades;
      } else {
        warnings.push(`Item ${i}: totalTrades is invalid (${item.totalTrades})`);
      }
    }
    
    // Create validated data item with sanitized values
    const validatedItem: Data = {
      subject: normalizedSubject,
      value: Math.max(0, Math.min(100, item.value)), // Clamp to 0-100 range
      fullMark: 100, // Standard fullMark for radar chart
      leaning,
      side,
      leaningValue,
      totalTrades
    };
    
    validatedData.push(validatedItem);
  }
  
  // Check if we have any valid data
  if (validatedData.length === 0) {
    console.error('EmotionRadar: No valid data items after validation', { originalData: data, warnings });
    return { isValid: false, validatedData: [], warnings };
  }
  
  // Log warnings if any
  if (warnings.length > 0) {
    console.warn('EmotionRadar: Data validation warnings:', warnings);
  }
  
  return { isValid: true, validatedData, warnings };
}

// Error boundary component for EmotionRadar
class EmotionRadarErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('EmotionRadar Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="card-unified h-64 lg:h-80 flex items-center justify-center text-tertiary">
          <div className="text-center px-4">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50 text-error" />
            <p className="text-sm">Chart rendering error</p>
            <p className="text-xs text-tertiary mt-1">{this.state.error?.message}</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Define proper types for the dot props
interface DotProps {
  cx?: number;
  cy?: number;
  payload?: {
    side?: string;
    [key: string]: any;
  };
}

// Safe custom dot component with error handling
const SafeCustomDot = React.memo((props: DotProps) => {
  try {
    const { cx, cy, payload } = props;
    
    // Validate required props
    if (typeof cx !== 'number' || typeof cy !== 'number' || !payload) {
      return null;
    }
    
    // Determine color based on trade side with fallback
    let gradientId = 'defaultGradient';
    if (payload.side === 'Buy') {
      gradientId = 'buyGradient';
    } else if (payload.side === 'Sell') {
      gradientId = 'sellGradient';
    }
    
    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={5}
          fill={`url(#${gradientId})`}
          stroke="#ffffff"
          strokeWidth={1.5}
          className="transition-all duration-200"
        />
      </g>
    );
  } catch (error) {
    console.error('Error in CustomDot:', error);
    return null;
  }
});

SafeCustomDot.displayName = 'SafeCustomDot';

// Custom Tooltip component with enhanced error handling and better styling
const CustomTooltip = ({ active, payload, label }: any) => {
  try {
    if (active && payload && payload.length && payload[0]) {
      const data = payload[0].payload;
      
      // Validate required data fields
      if (!data || typeof data !== 'object') {
        return null;
      }
      
      // Safely extract values with defaults
      const safeLabel = typeof label === 'string' ? label : 'Unknown';
      const safeValue = typeof payload[0].value === 'number' ? payload[0].value : 0;
      const safeSide = typeof data.side === 'string' ? data.side : 'NULL';
      const safeLeaning = typeof data.leaning === 'string' ? data.leaning : 'Balanced';
      const safeTotalTrades = typeof data.totalTrades === 'number' ? data.totalTrades : null;
      
      return (
        <div className="card-unified p-4 rounded-xl border border-accent shadow-2xl backdrop-blur-xl bg-black/60 min-w-[180px] transform transition-all duration-200 hover:scale-105" style={{backgroundColor: 'rgba(26, 26, 26, 0.95)', borderColor: 'rgba(184, 155, 94, 0.3)'}}>
          <p className="text-primary text-sm font-semibold mb-3 border-b border-secondary pb-2">{safeLabel}</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
              <p className="text-accent text-sm font-medium">
                Frequency: {safeValue.toFixed(1)}%
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                safeSide === 'Buy' ? 'bg-[#B89B5E]' : // Dusty Gold for Buy
                safeSide === 'Sell' ? 'bg-[#A7352D]' : 'bg-[#4F5B4A]' // Rust Red for Sell, Muted Olive for neutral
              }`}></div>
              <p className={`text-sm font-medium ${
                safeSide === 'Buy' ? 'text-[#B89B5E]' : // Dusty Gold for Buy
                safeSide === 'Sell' ? 'text-[#A7352D]' : 'text-[#4F5B4A]' // Rust Red for Sell, Muted Olive for neutral
              }`}>
                {safeLeaning}
              </p>
            </div>
            {safeTotalTrades !== null && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#D6C7B2] rounded-full"></div> // Warm Sand for accent
                <p className="text-[#D6C7B2] text-sm font-medium"> // Warm Sand for accent text
                  Total Trades: {safeTotalTrades}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }
  } catch (error) {
    console.error('Error in CustomTooltip:', error);
  }
  return null;
};

// Main EmotionRadar component with enhanced error handling
function EmotionRadarComponent({ data }: Props) {
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL LOGIC OR EARLY RETURNS
  const [isClient, setIsClient] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const { isCollapsed, isTransitioning, transitionProgress } = useSidebarSync();
  
  // Ref to track viewport size without triggering re-renders
  const viewportSizeRef = useRef(viewportSize);
  viewportSizeRef.current = viewportSize;
  
  // Ref to track transitioning state without triggering re-renders
  const isTransitioningRef = useRef(isTransitioning);
  isTransitioningRef.current = isTransitioning;
  
  // Stable debounced resize handler that doesn't recreate on every render
  const debouncedResizeHandler = useMemo(() => {
    return debounce(() => {
      // Skip resize handling during sidebar transitions to prevent performance issues
      if (isTransitioningRef.current) {
        return;
      }
      
      const newSize = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      
      // Only update if size actually changed significantly (more than 50px difference)
      const significantChange =
        Math.abs(newSize.width - viewportSizeRef.current.width) > 50 ||
        Math.abs(newSize.height - viewportSizeRef.current.height) > 50;
      
      if (significantChange) {
        setViewportSize(newSize);
      }
    }, 100);
  }, []); // Empty dependency array - this handler is now stable

  useEffect(() => {
    setIsClient(true);
    
    // Initialize viewport size
    const initialSize = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    setViewportSize(initialSize);
    
    // Add optimized resize listener
    window.addEventListener('resize', debouncedResizeHandler);
    
    return () => {
      window.removeEventListener('resize', debouncedResizeHandler);
    };
  }, [debouncedResizeHandler]);
  

  // Process data and determine what to render - all hooks are already called
  let renderContent: React.ReactNode;
  
  try {
    // Handle empty or invalid data
    if (!data || data.length === 0) {
      renderContent = (
        <div className="card-unified h-64 lg:h-80 flex items-center justify-center text-tertiary">
          <div className="text-center px-4">
            <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No emotional data available</p>
          </div>
        </div>
      );
    }
    // Show loading state during SSR/hydration
    else if (!isClient) {
      renderContent = (
        <div className="card-unified h-64 lg:h-80 flex items-center justify-center text-tertiary">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      );
    }
    else {
      // Use comprehensive data validation to prevent SVG path rendering errors
      const validation = validateEmotionRadarData(data);
      const filteredData = validation.validatedData;
      
      // If validation failed or no valid emotions after validation, show empty state
      if (!validation.isValid || filteredData.length === 0) {
        renderContent = (
          <div className="card-unified h-64 lg:h-80 flex items-center justify-center text-tertiary">
            <div className="text-center px-4">
              <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No valid emotional data available</p>
            </div>
          </div>
        );
      } else {
        // Render the actual radar chart with enhanced glass morphism design
        renderContent = (
          <div className="chart-container-enhanced relative w-full min-h-[300px] h-[320px] md:h-[350px] lg:h-[400px] overflow-hidden"
               style={{
                 // FIXED: Maintain stable dimensions regardless of sidebar state
                 position: 'relative',
                 // PERFECTED: Combined transform properties to avoid duplication
                 transform: `translateZ(0)`, // Hardware acceleration without scaling to prevent data shifting
                 willChange: 'auto', // Disable willChange during transitions to prevent layout shifts
                 backfaceVisibility: 'hidden', // Prevent flickering
                 isolation: 'isolate', // Create new stacking context
                 contain: 'layout style paint', // CSS containment for performance
                 // FIXED: Use stable dimensions that don't change during sidebar transitions
                 width: '100%',
                 height: '100%',
                 minWidth: '250px',
                 minHeight: '300px',
                 transformOrigin: 'center center',
                 // FIXED: Disable transitions during sidebar toggles to prevent data shifting
                 transition: 'none',
                 // PERFECTED: Enhanced GPU acceleration
                 perspective: '1000px',
                 // PERFECTED: Anti-flicker measures
                 opacity: 1, // Fixed opacity to prevent flicker
                 // Prevent layout recalculations
                 overflow: 'hidden',
                 background: 'transparent'
               }}>
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={250}
              minHeight={300}
              debounce={isTransitioning ? 500 : 100} // Higher debounce during transitions
              className="w-full h-full chart-container-stable"
              onResize={(width, height) => {
                // Skip expensive operations during transitions
                if (isTransitioning) {
                  return;
                }
              }}
            >
              <RadarChart
                data={filteredData}
                margin={{ top: 25, right: 30, bottom: 25, left: 30 }}
                startAngle={90}
                endAngle={-270}
              >
                <defs>
                  {/* Updated dusty gold gradient for the radar fill to match warm theme */}
                  <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B89B5E" stopOpacity={0.85}/>
                    <stop offset="30%" stopColor="#4F5B4A" stopOpacity={0.75}/>
                    <stop offset="60%" stopColor="#6B7359" stopOpacity={0.65}/>
                    <stop offset="95%" stopColor="#3A3F36" stopOpacity={0.45}/>
                  </linearGradient>
                   
                  {/* Updated glow filter for the radar line with dusty gold colors */}
                  <filter id="tealGlow">
                    <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
                    <feColorMatrix in="coloredBlur" type="matrix" values="0 0 0 0 0.72
                                                                 0 0 0 0 0.61
                                                                 0 0 0 0 0.37
                                                                 0 0 0 0.8 0"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                   
                  {/* Additional glow filter for hover effects with dusty gold colors */}
                  <filter id="hoverGlow">
                    <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                    <feColorMatrix in="coloredBlur" type="matrix" values="0 0 0 0 0.72
                                                                 0 0 0 0 0.61
                                                                 0 0 0 0 0.37
                                                                 0 0 0 1 0"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                   
                  {/* Secondary gradient for hover effects with dusty gold colors */}
                  <linearGradient id="hoverGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#B89B5E" stopOpacity={0.95}/>
                    <stop offset="50%" stopColor="#4F5B4A" stopOpacity={0.85}/>
                    <stop offset="100%" stopColor="#3A3F36" stopOpacity={0.5}/>
                  </linearGradient>
                   
                  {/* Animated gradient for pulse effect with dusty gold colors */}
                  <linearGradient id="pulseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#B89B5E" stopOpacity={0.9}>
                      <animate attributeName="stop-opacity" values="0.9;0.6;0.9" dur="3s" repeatCount="indefinite"/>
                    </stop>
                    <stop offset="100%" stopColor="#3A3F36" stopOpacity={0.5}>
                      <animate attributeName="stop-opacity" values="0.5;0.3;0.5" dur="3s" repeatCount="indefinite"/>
                    </stop>
                  </linearGradient>
                   
                  {/* Buy side gradients (Warm Gold) - updated to match warm theme */}
                  <radialGradient id="buyGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#D6C7B2" />
                    <stop offset="70%" stopColor="#B89B5E" />
                    <stop offset="100%" stopColor="#9B8049" />
                  </radialGradient>
                   
                  {/* Sell side gradients (Rust Red) - updated to match warm theme */}
                  <radialGradient id="sellGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#E27B58" />
                    <stop offset="70%" stopColor="#C85A3C" />
                    <stop offset="100%" stopColor="#A84532" />
                  </radialGradient>
                   
                  {/* Default gradients (Updated to muted olive) */}
                  <radialGradient id="defaultGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#4F5B4A" />
                    <stop offset="70%" stopColor="#4F5B4A" />
                    <stop offset="100%" stopColor="#3A4235" />
                  </radialGradient>
                </defs>
                
                {/* Enhanced grid with warm theme styling and improved visual depth */}
                <PolarGrid
                  gridType="polygon"
                  stroke="rgba(214, 199, 178, 0.1)"
                  strokeWidth={1.2}
                  radialLines={true}
                />
                
                {/* Clean axis labels with warm theme typography */}
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{
                    fill: 'rgba(234, 230, 221, 0.9)',
                    fontSize: viewportSize.width >= 1024 ? 13 : viewportSize.width >= 768 ? 12 : 11,
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontWeight: '500'
                  }}
                  className="opacity-90"
                />
                
                {/* PolarRadiusAxis with fixed domain for percentage-based visualization */}
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                  tickCount={5}
                />
                
                {/* Enhanced radar with smooth curves, gradients, and visual enhancements */}
                <Radar
                  name="Emotional State"
                  dataKey="value"
                  stroke="url(#pulseGradient)"
                  strokeWidth={viewportSize.width >= 1024 ? 5 : 4}
                  fill="url(#tealGradient)"
                  fillOpacity={0.75}
                  dot={false} // Remove cyan data point markers
                  activeDot={{
                    r: viewportSize.width >= 1024 ? 8 : 7,
                    fill: '#B89B5E',
                    stroke: '#fff',
                    strokeWidth: 3,
                    filter: "url(#hoverGlow)",
                    style: {
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }
                  }}
                  animationDuration={isTransitioning ? 0 : 400} // Slightly longer animation for smoother effect
                  animationEasing="ease-out" // Enhanced easing for better visual flow
                  animationBegin={0} // IMMEDIATE start - no delay to prevent lag
                  isAnimationActive={!isTransitioning} // Disable animations during transitions
                  // Apply enhanced glow effect to the line with dusty gold
                  style={{
                    filter: "url(#tealGlow)",
                    strokeLinejoin: "round",
                    strokeLinecap: "round",
                    boxShadow: "0 0 10px rgba(184, 155, 94, 0.5)"
                  }}
                />
                
                {/* Enhanced tooltip with better cursor styling and visual effects */}
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{
                    stroke: 'rgba(184, 155, 94, 0.8)',
                    strokeWidth: 3,
                    strokeDasharray: '10 5',
                    filter: "url(#tealGlow)"
                  }}
                  wrapperStyle={{
                    zIndex: 1000,
                    backdropFilter: 'blur(10px)'
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        );
      }
    }
  } catch (error) {
    console.error('Error rendering EmotionRadar:', error);
    setRenderError(error instanceof Error ? error.message : 'Unknown error');
    
    renderContent = (
      <div className="card-unified h-64 lg:h-80 flex items-center justify-center text-tertiary">
        <div className="text-center px-4">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50 text-error" />
          <p className="text-sm">Error loading emotional patterns</p>
          {renderError && <p className="text-xs text-tertiary mt-1">{renderError}</p>}
        </div>
      </div>
    );
  }

  // Single return statement at the end - all hooks have been called
  return <>{renderContent}</>;
}

// Wrapper component with error boundary and suspense
export default function EmotionRadar({ data }: Props) {
  return (
    <EmotionRadarErrorBoundary>
      <Suspense
        fallback={
          <div className="chart-container-enhanced h-64 lg:h-80 flex items-center justify-center text-white/70">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B89B5E]"></div> // Dusty Gold for spinner
          </div>
        }
      >
        <EmotionRadarComponent data={data} />
      </Suspense>
    </EmotionRadarErrorBoundary>
  );
}
