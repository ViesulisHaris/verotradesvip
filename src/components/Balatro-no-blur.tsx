"use client";

import { useEffect, useRef, useState } from "react";
import * as OGL from "ogl";
import "./Balatro.css";

interface BalatroProps {
  isRotate?: boolean;
  mouseInteraction?: boolean;
  pixelFilter?: number;
}

const BalatroNoBlur: React.FC<BalatroProps> = ({
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

    const { Renderer, Program, Mesh, Geometry, Triangle } = OGL;
    const canvas = canvasRef.current;

    const renderer = new Renderer({
      canvas,
      width: dimensions.width,
      height: dimensions.height,
      dpr: window.devicePixelRatio,
    });

    const gl = renderer.gl;

    // Vertex shader
    const vertex = `
      attribute vec2 position;
      varying vec2 vUv;
      
      void main() {
        vUv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Fragment shader
    const fragment = `
      precision highp float;
      
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uMouse;
      uniform float uPixelFilter;
      uniform bool uIsRotate;
      
      varying vec2 vUv;
      
      // Noise function
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }
      
      float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        
        vec2 u = f * f * (3.0 - 2.0 * f);
        
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }
      
      // Main rendering function
      void main() {
        vec2 uv = vUv;
        vec2 mouse = uMouse / uResolution;
        
        // Apply rotation if enabled
        if (uIsRotate) {
          float angle = uTime * 0.1;
          mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
          uv = (uv - 0.5) * rotation + 0.5;
        }
        
        // Create animated noise pattern
        vec2 noiseCoord = uv * 3.0 + uTime * 0.1;
        float n = noise(noiseCoord);
        
        // Apply pixelation effect
        vec2 pixelatedUv = floor(uv * uPixelFilter) / uPixelFilter;
        
        // Create gradient effect
        float gradient = distance(uv, mouse) * 0.5;
        
        // Combine effects
        float pattern = noise(pixelatedUv * 5.0 + uTime * 0.05);
        pattern += gradient;
        
        // Create color based on pattern
        vec3 color1 = vec3(0.1, 0.05, 0.2); // Dark blue
        vec3 color2 = vec3(0.05, 0.1, 0.3); // Darker blue
        vec3 color3 = vec3(0.2, 0.05, 0.4); // Purple
        
        vec3 finalColor = mix(color1, color2, pattern);
        finalColor = mix(finalColor, color3, n * 0.5);
        
        // Add subtle animation
        finalColor += sin(uTime * 0.5 + uv.x * 10.0) * 0.05;
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [dimensions.width, dimensions.height] },
        uMouse: { value: [0, 0] },
        uPixelFilter: { value: pixelFilter },
        uIsRotate: { value: isRotate }
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    let animationId: number;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseInteraction) return;
      
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = dimensions.height - (e.clientY - rect.top);
    };

    if (mouseInteraction) {
      canvas.addEventListener("mousemove", handleMouseMove);
    }

    const update = (t: number) => {
      animationId = requestAnimationFrame(update);
      
      program.uniforms.uTime.value = t * 0.001;
      program.uniforms.uMouse.value = [mouseX, mouseY];
      
      renderer.render({ scene: mesh });
    };

    update(0);

    return () => {
      cancelAnimationFrame(animationId);
      if (mouseInteraction) {
        canvas.removeEventListener("mousemove", handleMouseMove);
      }
    };
  }, [dimensions, isRotate, mouseInteraction, pixelFilter]);

  return (
    <div ref={containerRef} className={`balatro-container ${mouseInteraction ? 'mouse-interaction' : ''}`}>
      <canvas ref={canvasRef} className="balatro-canvas-no-blur" />
    </div>
  );
};

export default BalatroNoBlur;