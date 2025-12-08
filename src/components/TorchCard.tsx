'use client';

import React, { useState, useEffect, useRef } from 'react';

interface TorchCardProps {
  children: React.ReactNode;
  className?: string;
  onMouseMove?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export default function TorchCard({ children, className = '', onMouseMove }: TorchCardProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setMousePosition({ x, y });
    
    if (onMouseMove) {
      onMouseMove(e);
    }
  };

  const handleMouseLeave = () => {
    setMousePosition({ x: 50, y: 50 });
  };

  return (
    <div
      ref={cardRef}
      className={`flashlight-card ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        '--mouse-x': `${mousePosition.x}%`,
        '--mouse-y': `${mousePosition.y}%`,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}