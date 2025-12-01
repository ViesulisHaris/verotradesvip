'use client';

import React, { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  variant?: 'default' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = '',
      label,
      error,
      icon: Icon,
      iconPosition = 'left',
      variant = 'default',
      size = 'md',
      fullWidth = true,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'transition-all duration-300 focus:outline-none placeholder:text-[var(--muted-gray)] disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variantClasses = {
      default: 'bg-[var(--soft-graphite)] border border-[var(--border-primary)] focus:border-[var(--dusty-gold)] focus:shadow-[0_0_0_3px_rgba(184,155,94,0.2)]',
      ghost: 'bg-transparent border border-transparent focus:border-[var(--dusty-gold)] focus:bg-[var(--soft-graphite)]'
    };

    const sizeClasses = {
      sm: 'px-3 py-2 text-xs min-h-[36px] rounded-[var(--radius-button)]',
      md: 'px-4 py-3 text-sm min-h-[44px] rounded-[var(--radius-button)]',
      lg: 'px-5 py-4 text-base min-h-[48px] rounded-[var(--radius-button)]'
    };

    const widthClass = fullWidth ? 'w-full' : '';

    const errorClasses = error ? 'border-[var(--rust-red)] focus:border-[var(--rust-red)] focus:shadow-[0_0_0_3px_rgba(167,53,45,0.2)]' : '';

    const classes = `
      ${baseClasses}
      ${variantClasses[variant]}
      ${sizeClasses[size]}
      ${widthClass}
      ${errorClasses}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    const iconPadding = Icon ? (iconPosition === 'left' ? 'pl-12' : 'pr-12') : '';

    return (
      <div className={`relative ${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label className="block label-text mb-2">
            {label}
          </label>
        )}
        
        <div className="relative">
          {Icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Icon className="w-4 h-4 text-[var(--muted-gray)]" />
            </div>
          )}
          
          <input
            ref={ref}
            className={`${classes} ${iconPadding}`}
            disabled={disabled}
            style={{
              borderRadius: 'var(--radius-button)',
              transition: 'var(--transition-base)',
              borderWidth: '0.8px'
            }}
            {...props}
          />
          
          {Icon && iconPosition === 'right' && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Icon className="w-4 h-4 text-[var(--muted-gray)]" />
            </div>
          )}
        </div>
        
        {error && (
          <p className="mt-2 small-text text-[var(--rust-red)]">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;