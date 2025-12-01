'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingProps {
  variant?: 'spinner' | 'skeleton' | 'dots' | 'progress';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  progress?: number;
  className?: string;
}

export default function Loading({
  variant = 'spinner',
  size = 'md',
  text,
  progress,
  className = ''
}: LoadingProps) {
  const sizeConfig = {
    sm: { spinner: 'w-4 h-4', dots: 'w-2 h-2', container: 'p-2' },
    md: { spinner: 'w-6 h-6', dots: 'w-3 h-3', container: 'p-4' },
    lg: { spinner: 'w-8 h-8', dots: 'w-4 h-4', container: 'p-6' }
  };

  const config = sizeConfig[size];

  if (variant === 'spinner') {
    return (
      <div className={`flex items-center justify-center ${config.container} ${className}`}>
        <Loader2 
          className={`animate-spin ${config.spinner}`}
          style={{
            color: 'var(--dusty-gold)',
            borderTopColor: 'transparent',
            borderRightColor: 'var(--dusty-gold)',
            borderBottomColor: 'var(--dusty-gold)',
            borderLeftColor: 'var(--dusty-gold)',
            borderWidth: '2px',
            borderStyle: 'solid',
            borderRadius: '50%'
          }}
        />
        {text && (
          <span 
            className="ml-3 text-sm"
            style={{
              color: 'var(--warm-off-white)',
              fontSize: 'var(--text-body)'
            }}
          >
            {text}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={`flex items-center justify-center gap-2 ${config.container} ${className}`}>
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={`${config.dots} rounded-full animate-pulse`}
            style={{
              backgroundColor: 'var(--dusty-gold)',
              animationDelay: `${index * 0.2}s`
            }}
          />
        ))}
        {text && (
          <span 
            className="ml-3 text-sm"
            style={{
              color: 'var(--warm-off-white)',
              fontSize: 'var(--text-body)'
            }}
          >
            {text}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'skeleton') {
    return (
      <div className={`space-y-3 ${config.container} ${className}`}>
        {/* Skeleton lines */}
        <div 
          className="h-4 rounded animate-pulse"
          style={{
            backgroundColor: 'rgba(184, 155, 94, 0.2)',
            width: '60%'
          }}
        />
        <div 
          className="h-4 rounded animate-pulse"
          style={{
            backgroundColor: 'rgba(184, 155, 94, 0.2)',
            width: '80%'
          }}
        />
        <div 
          className="h-4 rounded animate-pulse"
          style={{
            backgroundColor: 'rgba(184, 155, 94, 0.2)',
            width: '40%'
          }}
        />
      </div>
    );
  }

  if (variant === 'progress') {
    const percentage = progress !== undefined ? progress : 0;
    return (
      <div className={`w-full ${config.container} ${className}`}>
        {text && (
          <div className="flex justify-between items-center mb-2">
            <span 
              className="text-sm font-medium"
              style={{
                color: 'var(--warm-off-white)',
                fontSize: 'var(--text-body)'
              }}
            >
              {text}
            </span>
            <span 
              className="text-sm font-medium"
              style={{
                color: 'var(--dusty-gold)',
                fontSize: 'var(--text-body)'
              }}
            >
              {Math.round(percentage)}%
            </span>
          </div>
        )}
        <div 
          className="w-full h-2 rounded-full overflow-hidden"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 'var(--radius-small)'
          }}
        >
          <div
            className="h-full transition-all duration-300 ease-out"
            style={{
              width: `${percentage}%`,
              backgroundColor: 'var(--dusty-gold)',
              borderRadius: 'var(--radius-small)'
            }}
          />
        </div>
      </div>
    );
  }

  return null;
}