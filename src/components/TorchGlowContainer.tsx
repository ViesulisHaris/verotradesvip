'use client';

import React, { useRef, useState, MouseEvent, ReactNode } from 'react';

interface TorchGlowContainerProps {
  children: ReactNode;
  className?: string;
  intensity?: 'subtle' | 'medium' | 'strong';
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  backgroundOpacity?: number;
  borderOpacity?: number;
  glowSize?: 'small' | 'medium' | 'large';
  animated?: boolean;
  hoverOnly?: boolean;
}

export default function TorchGlowContainer({
  children,
  className = "",
  intensity = 'medium',
  borderRadius = 'xl',
  padding = 'lg',
  backgroundOpacity = 0.4,
  borderOpacity = 0.6,
  glowSize = 'medium',
  animated = true,
  hoverOnly = false
}: TorchGlowContainerProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(hoverOnly ? 0 : 1);

  // Reddish-orange color palette configuration using CSS variables
  const colorConfig = {
    subtle: {
      background: 'var(--torch-glow-bg)',
      border: 'var(--torch-glow-border)',
      glow: 'var(--torch-glow-ambient)'
    },
    medium: {
      background: 'var(--torch-glow-bg)',
      border: 'var(--torch-glow-border)',
      glow: 'var(--torch-glow-ambient)'
    },
    strong: {
      background: 'var(--torch-glow-bg)',
      border: 'var(--torch-glow-border)',
      glow: 'var(--torch-glow-ambient)'
    }
  };

  // Glow size configuration - increased for better visibility while still subtle
  const glowSizeConfig = {
    small: { background: 200, border: 150 },
    medium: { background: 300, border: 220 },
    large: { background: 400, border: 300 }
  };

  const currentColors = colorConfig[intensity];
  const currentGlowSize = glowSizeConfig[glowSize];

  // Border radius mapping
  const borderRadiusMap = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full'
  };

  // Padding mapping
  const paddingMap = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;

    const div = divRef.current;
    const rect = div.getBoundingClientRect();

    // Calculate mouse position relative to element
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // DEBUG: Log position and dimensions
    console.log('🔥 TORCH DEBUG:', {
      x, y,
      width: rect.width,
      height: rect.height,
      isHovered,
      hoverOnly,
      currentOpacity: opacity
    });

    setPosition({ x, y });
    
    // Simplified opacity logic - show effect when hovering
    if (hoverOnly && isHovered) {
      setOpacity(0.3); // Further reduced opacity for subtler effect
    }
  };

  const handleMouseEnter = () => {
    console.log('🔥 TORCH DEBUG: Mouse entered');
    setIsHovered(true);
    if (hoverOnly) {
      setOpacity(0.3); // Consistent with mouse move
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (hoverOnly) {
      setOpacity(0);
    }
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`torch-glow-container torch-glow-${intensity} relative overflow-hidden ${borderRadiusMap[borderRadius]} border border-white/5 ${paddingMap[padding]} ${className}`}
      style={{
        backgroundColor: 'transparent',
      }}
    >
      {/* Border-only ring overlay (no inner bubble)
         - Single masked layer produces an outline-only gold highlight.
         - Gradient starts transparent at center so no colored bubble appears.
         - Masking cuts out the middle so only the container outline shows.
      */}
      <div
        className="pointer-events-none absolute -inset-px rounded-xl transition-opacity duration-500"
        style={{
          opacity: animated ? opacity : 1,
          background: `radial-gradient(${currentGlowSize.border}px circle at ${position.x}px ${position.y}px, transparent 0%, ${
            intensity === 'subtle'
              ? 'rgba(197,160,101,0.2)'
              : intensity === 'strong'
                ? 'rgba(197,160,101,0.3)'
                : 'rgba(197,160,101,0.25)'
          } 34%, ${
            intensity === 'subtle'
              ? 'rgba(197,160,101,0.12)'
              : intensity === 'strong'
                ? 'rgba(197,160,101,0.18)'
                : 'rgba(197,160,101,0.15)'
          } 44%, transparent 60%)`,
          zIndex: 1,
          borderRadius: 'inherit',

          // Masking keeps only the border visible (middle cut-out)
          maskImage: `linear-gradient(#fff 0 0), linear-gradient(#fff 0 0)`,
          WebkitMaskImage: `linear-gradient(#fff 0 0), linear-gradient(#fff 0 0)`,
          maskClip: `content-box, border-box`,
          WebkitMaskClip: `content-box, border-box`,
          padding: `1px`, // Visual thickness of the ring
          maskComposite: `exclude`,
          WebkitMaskComposite: `xor`,
        }}
      />

      {/* 2. The Content */}
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  );
}

// Export a simplified version for specific use cases
export function SimpleTorchGlow({ 
  children, 
  className = "" 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <TorchGlowContainer
      className={className}
      intensity="medium"
      borderRadius="lg"
      padding="md"
      animated={true}
      hoverOnly={true}
    >
      {children}
    </TorchGlowContainer>
  );
}

// Export a strong version for emphasis elements
export function StrongTorchGlow({ 
  children, 
  className = "" 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <TorchGlowContainer
      className={className}
      intensity="strong"
      borderRadius="xl"
      padding="lg"
      animated={true}
      hoverOnly={false}
      glowSize="large"
    >
      {children}
    </TorchGlowContainer>
  );
}