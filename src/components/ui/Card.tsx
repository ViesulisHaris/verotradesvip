'use client';

import React, { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated';
  padding?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'top-left' | 'top-right';
  hover?: boolean;
  children: React.ReactNode;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className = '',
      variant = 'default',
      padding = 'md',
      icon: Icon,
      iconPosition = 'top-left',
      hover = true,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'relative overflow-hidden transition-all duration-300';
    
    const variantClasses = {
      default: 'bg-[var(--soft-graphite)] border border-[var(--border-primary)]',
      glass: 'bg-[var(--glass-morphism-bg)] backdrop-blur-[var(--glass-morphism-blur)] border border-[var(--border-primary)]',
      elevated: 'bg-[var(--soft-graphite)] border border-[var(--border-primary)] shadow-[var(--shadow-card)]'
    };

    const paddingClasses = {
      sm: 'p-3',
      md: 'p-[var(--spacing-card-inner)]',
      lg: 'p-6'
    };

    const hoverClasses = hover ? 'hover:translate-y-[-2px] hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--border-hover)]' : '';

    const classes = `
      ${baseClasses}
      ${variantClasses[variant]}
      ${paddingClasses[padding]}
      ${hoverClasses}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
      <div
        ref={ref}
        className={classes}
        style={{
          borderRadius: 'var(--radius-card)',
          transition: 'var(--transition-base)',
          backdropFilter: variant === 'glass' ? 'blur(var(--glass-morphism-blur))' : undefined,
          WebkitBackdropFilter: variant === 'glass' ? 'blur(var(--glass-morphism-blur))' : undefined
        }}
        {...props}
      >
        {/* Icon */}
        {Icon && (
          <div 
            className={`absolute ${iconPosition === 'top-left' ? 'top-4 left-4' : 'top-4 right-4'}`}
          >
            <div className="p-2 rounded-lg bg-[var(--soft-graphite)] border border-[var(--border-primary)]">
              <Icon className="w-5 h-5 text-[var(--dusty-gold)]" />
            </div>
          </div>
        )}

        {/* Content */}
        <div className={Icon && iconPosition === 'top-left' ? 'ml-12' : ''}>
          {children}
        </div>

        {/* Glass morphism overlay for glass variant */}
        {variant === 'glass' && (
          <div 
            className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300"
            style={{
              background: 'linear-gradient(135deg, rgba(184, 155, 94, 0.05) 0%, rgba(212, 184, 127, 0.03) 100%)',
              borderRadius: 'var(--radius-card)'
            }}
          />
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;