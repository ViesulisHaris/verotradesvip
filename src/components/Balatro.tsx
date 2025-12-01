"use client";

import React, { useEffect, useRef, useState } from "react";
import "./Balatro.css";

interface BalatroProps {
  isRotate?: boolean;
  mouseInteraction?: boolean;
  pixelFilter?: number;
}

const Balatro: React.FC<BalatroProps> = React.memo(({
  isRotate = false,
  mouseInteraction = true,
  pixelFilter = 700
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationIdRef = useRef<number | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // WebGL refs (for compatibility with existing code)
  const rendererRef = useRef<any>(null);
  const programRef = useRef<any>(null);
  const meshRef = useRef<any>(null);
  const isContextLostRef = useRef<boolean>(false);
  const mouseXRef = useRef<number>(0);
  const mouseYRef = useRef<number>(0);

  useEffect(() => {
    // Simple animated background without WebGL
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Simplified animated background without WebGL dependency
  const createAnimatedBackground = () => {
    if (!canvasRef.current || dimensions.width === 0) return null;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('[ERROR] Failed to create 2D context');
      return null;
    }

    console.log('[DEBUG] Creating animated background...');
    console.log('[DEBUG] Canvas element:', canvas);
    console.log('[DEBUG] Canvas dimensions:', dimensions.width, 'x', dimensions.height);

    return { canvas, ctx };
  };

  // Mock WebGL resources function for compatibility
  const createWebGLResources = () => {
    if (!canvasRef.current || dimensions.width === 0) return null;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('[ERROR] Failed to create 2D context for WebGL mock');
      return null;
    }

    // Return mock WebGL resources for compatibility
    return {
      gl: ctx,
      renderer: { render: () => {} },
      program: { uniforms: { uTime: { value: 0 }, uMouse: { value: [0, 0] } } },
      mesh: {}
    };
  };

  // Function to start the animation loop
  const startAnimation = () => {
    if (!rendererRef.current || !programRef.current || !meshRef.current) return;

    let lastTime = 0;
    const targetFPS = 30; // Reduce FPS for better performance
    const targetFrameTime = 1000 / targetFPS;

    const update = (t: number) => {
      if (isContextLostRef.current) return;
      
      // Throttle to target FPS - improved for better scaling
      if (t - lastTime < targetFrameTime) {
        animationIdRef.current = requestAnimationFrame(update);
        return;
      }
      
      lastTime = t;
      
      try {
        if (programRef.current && rendererRef.current && meshRef.current) {
          programRef.current.uniforms.uTime.value = t * 0.0003; // Even slower animation for better performance
          programRef.current.uniforms.uMouse.value = [mouseXRef.current, mouseYRef.current];
          
          rendererRef.current.render({ scene: meshRef.current });
        }
      } catch (error) {
        console.error('[ERROR] Error during render:', error);
        if (animationIdRef.current) {
          cancelAnimationFrame(animationIdRef.current);
        }
      }
    };

    update(0);
  };

  useEffect(() => {
    if (!canvasRef.current || dimensions.width === 0) return;

    // Create initial WebGL resources
    const resources = createWebGLResources();
    if (!resources) return;

    // Store resources in refs
    rendererRef.current = resources.renderer;
    programRef.current = resources.program;
    meshRef.current = resources.mesh;
    isContextLostRef.current = false;

    const canvas = canvasRef.current;
    const gl = resources.gl;

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseInteraction) return;
      
      const rect = canvas.getBoundingClientRect();
      mouseXRef.current = e.clientX - rect.left;
      mouseYRef.current = dimensions.height - (e.clientY - rect.top);
    };

    if (mouseInteraction) {
      canvas.addEventListener("mousemove", handleMouseMove);
    }

    // WebGL context loss handler - PREVENT DEFAULT BEHAVIOR
    const handleContextLoss = (event: Event) => {
      console.warn('[WARNING] WebGL context lost');
      isContextLostRef.current = true;
      
      // Prevent the default behavior which would prevent restoration
      event.preventDefault();
      
      // Stop the animation loop
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
    };
    
    // WebGL context restoration handler - COMPLETELY RECREATE RESOURCES
    const handleContextRestored = (event: Event) => {
      console.log('[INFO] WebGL context restored, recreating resources...');
      
      // Recreate all WebGL resources
      const newResources = createWebGLResources();
      if (!newResources) {
        console.error('[ERROR] Failed to recreate WebGL resources after context restore');
        return;
      }
      
      // Update refs with new resources
      rendererRef.current = newResources.renderer;
      programRef.current = newResources.program;
      meshRef.current = newResources.mesh;
      isContextLostRef.current = false;
      
      console.log('[INFO] WebGL resources recreated successfully');
      
      // Restart the animation loop
      startAnimation();
    };
    
    // Add event listeners with proper typing
    canvas.addEventListener('webglcontextlost', handleContextLoss);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    // Start the animation loop
    startAnimation();

    return () => {
      // Stop animation
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      
      // Remove event listeners
      if (mouseInteraction) {
        canvas.removeEventListener("mousemove", handleMouseMove);
      }
      canvas.removeEventListener('webglcontextlost', handleContextLoss);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [dimensions, isRotate, mouseInteraction, pixelFilter]);

  // DIAGNOSTIC: Add logging to check Balatro rendering and layering
  useEffect(() => {
    if (typeof document !== 'undefined' && containerRef.current) {
      console.log('🔍 [BALATRO_DEBUG] Balatro component rendered:', {
        containerExists: !!containerRef.current,
        canvasExists: !!canvasRef.current,
        containerClasses: containerRef.current.className,
        computedZIndex: window.getComputedStyle(containerRef.current).zIndex,
        computedPosition: window.getComputedStyle(containerRef.current).position,
        computedTop: window.getComputedStyle(containerRef.current).top,
        computedLeft: window.getComputedStyle(containerRef.current).left,
        canvasZIndex: canvasRef.current ? window.getComputedStyle(canvasRef.current).zIndex : 'no canvas',
        timestamp: new Date().toISOString()
      });
    }
  }, [dimensions]);

  return (
    <div ref={containerRef} className={`balatro-container ${mouseInteraction ? 'mouse-interaction' : ''}`}>
      <canvas ref={canvasRef} className="balatro-canvas" />
    </div>
  );
});

Balatro.displayName = 'Balatro';

export default Balatro;