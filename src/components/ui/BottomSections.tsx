'use client';

import React, { useState, useEffect } from 'react';

interface BottomSectionsProps {
  className?: string;
}

const BottomSections: React.FC<BottomSectionsProps> = ({ className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade-in animation on load
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Generate emotional pattern dots with enhanced warm color palette
  const emotionalDots = Array.from({ length: 15 }, (_, i) => {
    const colors = ['#6A7661', '#5A6651', '#4A5641', '#4F5B4A', '#5A6655', '#65715A', '#B89B5E', '#A7352D'];
    const color = colors[i % colors.length];
    const size = Math.random() * 6 + 3; // 3-9px for better visibility
    const opacity = Math.random() * 0.3 + 0.7; // 0.7-1.0
    const animationType = i % 3 === 0 ? 'pulse' : i % 3 === 1 ? 'ping' : 'bounce';
    return {
      id: i,
      color,
      size,
      opacity,
      left: `${8 + (i % 5) * 18}%`,
      top: `${15 + Math.floor(i / 5) * 23}%`,
      animationDelay: `${i * 0.15}s`,
      animationType,
      animationDuration: `${2 + Math.random() * 2}s`
    };
  });

  // Generate P&L performance dots with enhanced warm gradient
  const pnlDots = Array.from({ length: 15 }, (_, i) => {
    const colors = ['#D6C7B2', '#C5B6A1', '#B4A590', '#B89B5E', '#C5A570', '#D2AF82', '#EAE6DD', '#4F5B4A'];
    const color = colors[i % colors.length];
    const size = Math.random() * 6 + 3; // 3-9px for better visibility
    const opacity = Math.random() * 0.3 + 0.7; // 0.7-1.0
    const animationType = i % 3 === 0 ? 'pulse' : i % 3 === 1 ? 'ping' : 'bounce';
    return {
      id: i,
      color,
      size,
      opacity,
      left: `${8 + (i % 5) * 18}%`,
      top: `${15 + Math.floor(i / 5) * 23}%`,
      animationDelay: `${i * 0.15}s`,
      animationType,
      animationDuration: `${2 + Math.random() * 2}s`
    };
  });

  return (
    <div
      className={`grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 gap-4 transition-opacity duration-700 ease-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } ${className}`}
    >
      {/* Emotional Patterns Card */}
      <div
        className="group relative overflow-hidden card-unified hover-lift transition-all duration-300 cursor-pointer focus-within:ring-2 focus-within:ring-dusty-gold/50 focus-within:ring-offset-2 focus-within:ring-offset-[#121212] touch-manipulation"
        style={{
          height: '80px',
          padding: 'var(--spacing-card-inner)',
          background: 'var(--soft-graphite)',
          borderRadius: 'var(--radius-card)',
          border: '0.8px solid var(--border-primary)'
        }}
        role="article"
        aria-label="Emotional Patterns - Behavioral insights"
        tabIndex={0}
      >
        {/* Hover effect overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(79, 91, 74, 0.1) 0%, rgba(106, 118, 97, 0.05) 100%)',
            borderRadius: 'var(--radius-card)'
          }}
        />
        
        {/* Subtle animated border on hover */}
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            border: '0.8px solid var(--border-primary)',
            borderRadius: 'var(--radius-card)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}
        />
        <div className="relative flex items-center justify-between h-full">
          <div>
            <h3
              className="font-medium transition-all duration-300 group-hover:text-white group-hover:scale-105"
              style={{
                color: 'var(--warm-off-white)',
                fontSize: '16px',
                marginBottom: '4px'
              }}
            >
              Emotional Patterns
            </h3>
            <p
              className="text-xs transition-colors duration-300 group-hover:text-[var(--warm-sand)]"
              style={{
                color: 'var(--warm-off-white)',
                fontSize: '12px'
              }}
            >
              Behavioral insights
            </p>
          </div>
          
          {/* Enhanced Visual dots with warm color palette */}
          <div className="relative group-hover:scale-110 transition-transform duration-300" style={{ width: '140px', height: '56px' }}>
            {emotionalDots.map((dot) => (
              <div
                key={dot.id}
                className={`absolute rounded-full transition-all duration-300 ${
                  dot.animationType === 'pulse' ? 'animate-pulse' :
                  dot.animationType === 'ping' ? 'animate-ping' :
                  'animate-bounce'
                } group-hover:scale-125`}
                style={{
                  backgroundColor: dot.color,
                  width: `${dot.size}px`,
                  height: `${dot.size}px`,
                  left: dot.left,
                  top: dot.top,
                  opacity: dot.opacity,
                  animationDelay: dot.animationDelay,
                  animationDuration: dot.animationDuration,
                  transform: 'translate(-50%, -50%)',
                  boxShadow: `0 0 ${dot.size/2}px ${dot.color}40`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {/* Inner glow effect */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${dot.color}60 0%, transparent 70%)`,
                    transform: 'scale(1.5)'
                  }}
                />
              </div>
            ))}
            {/* Enhanced gradient overlay with animation */}
            <div
              className="absolute inset-0 rounded-full opacity-30 group-hover:opacity-50 transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, var(--soft-olive-highlight) 0%, var(--muted-olive) 50%, #5A6655 100%)',
                filter: 'blur(12px)',
                animation: 'pulse 4s ease-in-out infinite'
              }}
            />
            {/* Interactive hover ring */}
            <div
              className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                border: '2px solid var(--border-primary)',
                filter: 'blur(4px)',
                animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
              }}
            />
          </div>
        </div>
      </div>

      {/* P&L Performance Card */}
      <div
        className="group relative overflow-hidden card-unified hover-lift transition-all duration-300 cursor-pointer focus-within:ring-2 focus-within:ring-dusty-gold/50 focus-within:ring-offset-2 focus-within:ring-offset-[#121212] touch-manipulation"
        style={{
          height: '80px',
          padding: 'var(--spacing-card-inner)',
          background: 'var(--soft-graphite)',
          borderRadius: 'var(--radius-card)',
          border: '0.8px solid var(--border-primary)'
        }}
        role="article"
        aria-label="P&L Performance - Trading results"
        tabIndex={0}
      >
        {/* Hover effect overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(214, 199, 178, 0.1) 0%, rgba(184, 155, 94, 0.05) 100%)',
            borderRadius: 'var(--radius-card)'
          }}
        />
        
        {/* Subtle animated border on hover */}
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            border: '0.8px solid var(--border-primary)',
            borderRadius: 'var(--radius-card)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}
        />
        <div className="relative flex items-center justify-between h-full">
          <div>
            <h3
              className="font-medium transition-all duration-300 group-hover:text-white group-hover:scale-105"
              style={{
                color: 'var(--warm-off-white)',
                fontSize: '16px',
                marginBottom: '4px'
              }}
            >
              P&L Performance
            </h3>
            <p
              className="text-xs transition-colors duration-300 group-hover:text-[var(--warm-sand)]"
              style={{
                color: 'var(--warm-off-white)',
                fontSize: '12px'
              }}
            >
              Trading results
            </p>
          </div>
          
          {/* Enhanced Visual dots with warm gradient */}
          <div className="relative group-hover:scale-110 transition-transform duration-300" style={{ width: '140px', height: '56px' }}>
            {pnlDots.map((dot) => (
              <div
                key={dot.id}
                className={`absolute rounded-full transition-all duration-300 ${
                  dot.animationType === 'pulse' ? 'animate-pulse' :
                  dot.animationType === 'ping' ? 'animate-ping' :
                  'animate-bounce'
                } group-hover:scale-125`}
                style={{
                  backgroundColor: dot.color,
                  width: `${dot.size}px`,
                  height: `${dot.size}px`,
                  left: dot.left,
                  top: dot.top,
                  opacity: dot.opacity,
                  animationDelay: dot.animationDelay,
                  animationDuration: dot.animationDuration,
                  transform: 'translate(-50%, -50%)',
                  boxShadow: `0 0 ${dot.size/2}px ${dot.color}40`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {/* Inner glow effect */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${dot.color}60 0%, transparent 70%)`,
                    transform: 'scale(1.5)'
                  }}
                />
              </div>
            ))}
            {/* Enhanced gradient overlay with animation */}
            <div
              className="absolute inset-0 rounded-full opacity-30 group-hover:opacity-50 transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, var(--warm-sand) 0%, var(--dusty-gold) 50%, #C5A570 100%)',
                filter: 'blur(12px)',
                animation: 'pulse 4s ease-in-out infinite'
              }}
            />
            {/* Interactive hover ring */}
            <div
              className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                border: '2px solid var(--border-primary)',
                filter: 'blur(4px)',
                animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomSections;