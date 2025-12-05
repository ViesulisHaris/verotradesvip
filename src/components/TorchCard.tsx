"use client";

import React, { useRef, useState, useEffect } from 'react';

interface TorchCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function TorchCard({ children, className = "" }: TorchCardProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;

    const div = divRef.current;
    const rect = div.getBoundingClientRect();

    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  useEffect(() => {
    // Development verification - remove when confirmed
    // eslint-disable-next-line no-console
    console.log('TorchCard (Fiber Optic & Spotlight design) mounted');
  }, []);

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      // Base styles: Dark background with thin white border when light is off
      className={`relative overflow-hidden rounded-xl border border-white/10 bg-[#0A0A0A] ${className}`}
    >
      {/* Layer A: The Fiber Optic Ring (The Border) */}
      <div
        className="pointer-events-none absolute inset-0 rounded-xl transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          // CSS masking to ensure the border effect doesn't touch the inside of the card
          maskImage: 'radial-gradient(circle at center, transparent calc(100% - 2px), black calc(100% - 1px))',
          WebkitMaskImage: 'radial-gradient(circle at center, transparent calc(100% - 2px), black calc(100% - 1px))',
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, 
            rgba(197, 160, 101, 0.6) 0%, 
            rgba(197, 160, 101, 0.3) 40%, 
            transparent 70%)`,
          zIndex: 1,
        }}
      />

      {/* Layer B: The Ambient Spotlight (The Center) */}
      <div
        className="pointer-events-none absolute inset-0 rounded-xl transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(800px circle at ${position.x}px ${position.y}px, 
            rgba(255, 255, 255, 0.03) 0%, 
            rgba(255, 255, 255, 0.015) 30%, 
            transparent 60%)`,
          zIndex: 0,
        }}
      />

      {/* Content Layer */}
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  );
}