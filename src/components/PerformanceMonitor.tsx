'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useSidebarSync } from '@/hooks/useSidebarSync';

interface PerformanceMetrics {
  sidebarToggleTime: number;
  chartResizeTime: number;
  totalTransitionTime: number;
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  maxRenderTime: number;
  minRenderTime: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export default function PerformanceMonitor({ enabled = true, onMetricsUpdate }: PerformanceMonitorProps) {
  const { isCollapsed, isTransitioning, transitionProgress } = useSidebarSync();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    sidebarToggleTime: 0,
    chartResizeTime: 0,
    totalTransitionTime: 0,
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    maxRenderTime: 0,
    minRenderTime: Infinity
  });
  
  const renderTimesRef = useRef<number[]>([]);
  const sidebarToggleStartRef = useRef<number>(0);
  const chartResizeStartRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(performance.now());

  // Monitor sidebar transition timing
  useEffect(() => {
    if (isTransitioning && sidebarToggleStartRef.current === 0) {
      sidebarToggleStartRef.current = performance.now();
      console.log('🚀 [PERFORMANCE_MONITOR] Sidebar transition started:', {
        startTime: sidebarToggleStartRef.current,
        isCollapsed,
        timestamp: new Date().toISOString()
      });
    } else if (!isTransitioning && sidebarToggleStartRef.current > 0) {
      const transitionEndTime = performance.now();
      const transitionDuration = transitionEndTime - sidebarToggleStartRef.current;
      
      console.log('✅ [PERFORMANCE_MONITOR] Sidebar transition completed:', {
        duration: transitionDuration.toFixed(2),
        expectedDuration: 300,
        isWithinTolerance: Math.abs(transitionDuration - 300) < 50,
        timestamp: new Date().toISOString()
      });
      
      setMetrics(prev => ({
        ...prev,
        sidebarToggleTime: transitionDuration,
        totalTransitionTime: transitionDuration
      }));
      
      sidebarToggleStartRef.current = 0;
      
      // Notify parent component
      onMetricsUpdate?.({
        ...metrics,
        sidebarToggleTime: transitionDuration,
        totalTransitionTime: transitionDuration
      });
    }
  }, [isTransitioning, isCollapsed, metrics, onMetricsUpdate]);

  // Monitor render performance
  useEffect(() => {
    if (!enabled) return;
    
    const frameTime = performance.now();
    const renderTime = frameTime - lastFrameTimeRef.current;
    lastFrameTimeRef.current = frameTime;
    
    // Track render times
    renderTimesRef.current.push(renderTime);
    if (renderTimesRef.current.length > 100) {
      renderTimesRef.current = renderTimesRef.current.slice(-50); // Keep last 50 renders
    }
    
    const renderTimes = renderTimesRef.current;
    const averageRenderTime = renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;
    const maxRenderTime = Math.max(...renderTimes);
    const minRenderTime = Math.min(...renderTimes);
    
    setMetrics(prev => ({
      ...prev,
      renderCount: prev.renderCount + 1,
      lastRenderTime: renderTime,
      averageRenderTime,
      maxRenderTime,
      minRenderTime
    }));
    
    // Log performance warnings
    if (renderTime > 16.67) { // More than 60fps
      console.warn('⚠️ [PERFORMANCE_MONITOR] Slow render detected:', {
        renderTime: renderTime.toFixed(2),
        fps: (1000 / renderTime).toFixed(1),
        timestamp: new Date().toISOString()
      });
    }
    
    // Log transition progress
    if (isTransitioning && transitionProgress > 0) {
      console.log('📊 [PERFORMANCE_MONITOR] Transition progress:', {
        progress: (transitionProgress * 100).toFixed(1),
        isCollapsed,
        timestamp: new Date().toISOString()
      });
    }
  }, [enabled, isTransitioning, transitionProgress]);

  // Monitor chart resize events
  useEffect(() => {
    const handleResizeStart = () => {
      chartResizeStartRef.current = performance.now();
    };
    
    const handleResizeEnd = () => {
      if (chartResizeStartRef.current > 0) {
        const resizeDuration = performance.now() - chartResizeStartRef.current;
        
        console.log('📏 [PERFORMANCE_MONITOR] Chart resize completed:', {
          duration: resizeDuration.toFixed(2),
          timestamp: new Date().toISOString()
        });
        
        setMetrics(prev => ({
          ...prev,
          chartResizeTime: resizeDuration
        }));
        
        chartResizeStartRef.current = 0;
      }
    };
    
    // Listen for resize events on chart containers
    const chartContainers = document.querySelectorAll('.chart-container-stable');
    chartContainers.forEach(container => {
      container.addEventListener('resizestart', handleResizeStart);
      container.addEventListener('resizeend', handleResizeEnd);
    });
    
    return () => {
      chartContainers.forEach(container => {
        container.removeEventListener('resizestart', handleResizeStart);
        container.removeEventListener('resizeend', handleResizeEnd);
      });
    };
  }, []);

  // Performance summary
  const performanceGrade = useMemo(() => {
    const { sidebarToggleTime, averageRenderTime, maxRenderTime } = metrics;
    
    if (sidebarToggleTime === 0) return 'N/A';
    
    // Calculate performance score
    let score = 100;
    
    // Sidebar transition performance (40% weight)
    if (sidebarToggleTime > 400) score -= 20;
    else if (sidebarToggleTime > 350) score -= 10;
    else if (sidebarToggleTime > 300) score -= 5;
    
    // Average render time (30% weight)
    if (averageRenderTime > 20) score -= 20;
    else if (averageRenderTime > 16.67) score -= 10;
    else if (averageRenderTime > 10) score -= 5;
    
    // Max render time (20% weight)
    if (maxRenderTime > 50) score -= 20;
    else if (maxRenderTime > 33) score -= 10;
    else if (maxRenderTime > 25) score -= 5;
    
    // Transition synchronization (10% weight)
    if (Math.abs(sidebarToggleTime - 300) > 100) score -= 10;
    else if (Math.abs(sidebarToggleTime - 300) > 50) score -= 5;
    
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    return 'D';
  }, [metrics]);

  if (!enabled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 glass-enhanced p-4 rounded-xl border border-blue-500/30 max-w-sm">
      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
        Performance Monitor
      </h3>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-white/70">Sidebar Transition:</span>
          <span className={`font-mono ${
            metrics.sidebarToggleTime <= 300 ? 'text-green-400' : 
            metrics.sidebarToggleTime <= 400 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {metrics.sidebarToggleTime.toFixed(0)}ms
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-white/70">Chart Resize:</span>
          <span className={`font-mono ${
            metrics.chartResizeTime <= 50 ? 'text-green-400' : 
            metrics.chartResizeTime <= 100 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {metrics.chartResizeTime.toFixed(0)}ms
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-white/70">Avg Render:</span>
          <span className={`font-mono ${
            metrics.averageRenderTime <= 16.67 ? 'text-green-400' : 
            metrics.averageRenderTime <= 20 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {metrics.averageRenderTime.toFixed(1)}ms
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-white/70">Max Render:</span>
          <span className={`font-mono ${
            metrics.maxRenderTime <= 25 ? 'text-green-400' : 
            metrics.maxRenderTime <= 33 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {metrics.maxRenderTime.toFixed(0)}ms
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-white/70">Performance:</span>
          <span className={`font-bold ${
            performanceGrade === 'A+' || performanceGrade === 'A' ? 'text-green-400' :
            performanceGrade === 'B' ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {performanceGrade}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-white/70">Status:</span>
          <span className={`font-medium ${
            isTransitioning ? 'text-blue-400 animate-pulse' : 'text-green-400'
          }`}>
            {isTransitioning ? 'Transitioning' : 'Idle'}
          </span>
        </div>
      </div>
    </div>
  );
}