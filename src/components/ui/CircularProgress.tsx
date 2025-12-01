'use client';

import React, { useEffect, useState } from 'react';

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  animationDuration?: number;
}

export default function CircularProgress({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  label,
  color = 'var(--dusty-gold)',
  backgroundColor = 'rgba(255, 255, 255, 0.1)',
  showPercentage = true,
  animationDuration = 1000
}: CircularProgressProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => {
      setAnimatedValue(value);
      setIsAnimating(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [value]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedValue / max) * circumference;

  const getColorClass = () => {
    if (value >= 70) return 'text-[var(--muted-olive)]';
    if (value >= 50) return 'text-[var(--muted-olive)]';
    if (value >= 30) return 'text-[var(--muted-olive)]';
    return 'text-[var(--rust-red)]';
  };

  const getStrokeColor = () => {
    if (value >= 70) return 'var(--muted-olive)';
    if (value >= 50) return 'var(--muted-olive)';
    if (value >= 30) return 'var(--muted-olive)';
    return 'var(--rust-red)';
  };

  return (
    <div className="circular-progress" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getStrokeColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="progress"
          style={{
            color: 'var(--dusty-gold)',
            transition: `stroke-dashoffset ${animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            filter: `drop-shadow(0 0 6px var(--dusty-gold)40)`
          }}
        />
      </svg>
      
      {/* Center content */}
      <div 
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ color: 'var(--dusty-gold)' }}
      >
        {showPercentage && (
          <span className={`text-2xl font-bold ${getColorClass()} ${isAnimating ? 'animate-pulse' : ''}`}
                style={{ color: 'var(--dusty-gold)' }}
          >
            {Math.round(animatedValue)}%
          </span>
        )}
        {label && (
          <span className="text-xs text-white/70 mt-1 text-center">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}