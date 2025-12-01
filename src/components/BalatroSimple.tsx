"use client";

import { useEffect, useRef, useState } from "react";
import * as OGL from "ogl";
import "./Balatro.css";

interface BalatroSimpleProps {
  isRotate?: boolean;
  mouseInteraction?: boolean;
  pixelFilter?: number;
}

const BalatroSimple: React.FC<BalatroSimpleProps> = ({
  isRotate = false,
  mouseInteraction = true,
  pixelFilter = 700
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
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

  useEffect(() => {
    if (!canvasRef.current || dimensions.width === 0) return;

    console.log('[DEBUG] Simple Balatro: Starting initialization...');
    
    try {
      const { Renderer, Program, Mesh, Geometry, Triangle } = OGL;
      const canvas = canvasRef.current;

      console.log('[DEBUG] Simple Balatro: Creating renderer...');
      const renderer = new Renderer({
        canvas,
        width: dimensions.width,
        height: dimensions.height,
        dpr: window.devicePixelRatio,
      });

      const gl = renderer.gl;
      console.log('[DEBUG] Simple Balatro: WebGL context created:', gl);

      // Simplified vertex shader
      const vertex = `
        attribute vec2 position;
        varying vec2 vUv;
        
        void main() {
          vUv = position * 0.5 + 0.5;
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `;

      // Simplified fragment shader
      const fragment = `
        precision highp float;
        
        uniform float uTime;
        uniform vec2 uResolution;
        
        varying vec2 vUv;
        
        void main() {
          vec3 color = vec3(0.1, 0.05, 0.2);
          color += sin(uTime * 0.2 + vUv.x * 2.0 + vUv.y * 2.0) * 0.02;
          gl_FragColor = vec4(color, 1.0);
        }
      `;

      console.log('[DEBUG] Simple Balatro: Creating geometry...');
      const geometry = new Triangle(gl);
      console.log('[DEBUG] Simple Balatro: Geometry created:', geometry);
      console.log('[DEBUG] Simple Balatro: Geometry attributes:', Object.keys(geometry));

      console.log('[DEBUG] Simple Balatro: Creating program...');
      const program = new Program(gl, {
        vertex,
        fragment,
        uniforms: {
          uTime: { value: 0 },
          uResolution: { value: [dimensions.width, dimensions.height] }
        },
      });
      
      console.log('[DEBUG] Simple Balatro: Program created successfully');

      console.log('[DEBUG] Simple Balatro: Creating mesh...');
      const mesh = new Mesh(gl, { geometry, program });
      console.log('[DEBUG] Simple Balatro: Mesh created successfully');

      let animationId: number;

      const update = (t: number) => {
        animationId = requestAnimationFrame(update);
        
        try {
          program.uniforms.uTime.value = t * 0.001;
          renderer.render({ scene: mesh });
        } catch (error) {
          console.error('[ERROR] Simple Balatro: Error during render:', error);
          cancelAnimationFrame(animationId);
        }
      };

      update(0);

      return () => {
        cancelAnimationFrame(animationId);
      };
    } catch (error) {
      console.error('[ERROR] Simple Balatro: Initialization failed:', error);
      console.error('[ERROR] Simple Balatro: Error details:', error instanceof Error ? error.stack : String(error));
      return;
    }
  }, [dimensions]);

  return (
    <div ref={containerRef} className={`balatro-container ${mouseInteraction ? 'mouse-interaction' : ''}`}>
      <canvas ref={canvasRef} className="balatro-canvas" />
    </div>
  );
};

export default BalatroSimple;