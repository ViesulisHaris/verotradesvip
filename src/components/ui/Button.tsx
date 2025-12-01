'use client';

import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation';
    
    const variantClasses = {
      primary: 'bg-[var(--dusty-gold)] text-[var(--deep-charcoal)] hover:bg-[var(--dusty-gold-hover)] hover:translate-y-[-1px] hover:shadow-[var(--shadow-button-hover)] focus:ring-[var(--dusty-gold)] focus:ring-offset-[var(--deep-charcoal)]',
      secondary: 'bg-transparent border border-[var(--border-primary)] text-[var(--dusty-gold)] hover:bg-[rgba(184,155,94,0.1)] hover:border-[var(--dusty-gold)] focus:ring-[var(--dusty-gold)] focus:ring-offset-[var(--deep-charcoal)]',
      ghost: 'bg-transparent text-[var(--warm-off-white)] hover:bg-[rgba(184,155,94,0.1)] focus:ring-[var(--dusty-gold)] focus:ring-offset-[var(--deep-charcoal)]'
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 label-text min-h-[36px] rounded-[var(--radius-button)]',
      md: 'px-6 py-3 body-text min-h-[44px] rounded-[var(--radius-button)]',
      lg: 'px-8 py-4 body-text min-h-[48px] rounded-[var(--radius-button)]'
    };

    const widthClass = fullWidth ? 'w-full' : '';

    const classes = `
      ${baseClasses}
      ${variantClasses[variant]}
      ${sizeClasses[size]}
      ${widthClass}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        style={{
          borderRadius: 'var(--radius-button)',
          transition: 'var(--transition-base)'
        }}
        {...props}
      >
        {loading && (
          <Loader2 className="w-4 h-4 gap-element animate-spin" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;