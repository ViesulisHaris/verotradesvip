'use client';

import React, { useState, useEffect, useRef } from 'react';

interface TorchCardProps {
  children: React.ReactNode;
  className?: string;
  onMouseMove?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export default function TorchCard({ children, className = '', onMouseMove }: TorchCardProps) {
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Clamp values to prevent overflow
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));
    
    setMousePosition({ x: clampedX, y: clampedY });
    
    if (onMouseMove) {
      onMouseMove(e);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePosition({ x: 50, y: 50 }); // Reset to center
  };

  return (
    <div
      ref={cardRef}
      className={`flashlight-card ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        '--mouse-x': `${mousePosition.x}%`,
        '--mouse-y': `${mousePosition.y}%`,
      } as React.CSSProperties}
    >
      {/* Flashlight background glow */}
      <div
        className="flashlight-bg"
        style={{
          opacity: isHovered ? 1 : 0,
        }}
      />
      
      {/* Flashlight border glow */}
      <div
        className="flashlight-border"
        style={{
          opacity: isHovered ? 1 : 0,
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}