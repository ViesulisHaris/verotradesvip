'use client';

import React, { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';

export interface InputGroupProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  variant?: 'default' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const InputGroup = forwardRef<HTMLInputElement, InputGroupProps>(
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
    const baseClasses = 'transition-all duration-300 focus:outline-none placeholder:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variantClasses = {
      default: 'bg-surface border border-input focus:border-gold focus:shadow-[0_0_0_3px_rgba(197,160,101,0.2)]',
      ghost: 'bg-transparent border border-transparent focus:border-gold focus:bg-surface'
    };

    const sizeClasses = {
      sm: 'px-3 py-2 text-xs min-h-[36px] rounded-lg',
      md: 'px-4 py-3 text-sm min-h-[44px] rounded-lg',
      lg: 'px-5 py-4 text-base min-h-[48px] rounded-lg'
    };

    const widthClass = fullWidth ? 'w-full' : '';

    const errorClasses = error ? 'border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]' : '';

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
          <label className="block text-sm font-medium mb-2 text-warm-off-white">
            {label}
          </label>
        )}
        
        <div className="relative">
          {Icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Icon className="w-4 h-4 text-gray-500" />
            </div>
          )}
          
          <input
            ref={ref}
            className={`${classes} ${iconPadding}`}
            disabled={disabled}
            style={{
              borderRadius: '0.5rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              borderWidth: '0.8px'
            }}
            {...props}
          />
          
          {Icon && iconPosition === 'right' && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Icon className="w-4 h-4 text-gray-500" />
            </div>
          )}
        </div>
        
        {error && (
          <p className="mt-2 text-sm text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }
);

InputGroup.displayName = 'InputGroup';

export default InputGroup;