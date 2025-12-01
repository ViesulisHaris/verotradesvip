'use client';

import React from 'react';
import { LucideIcon, LucideProps } from 'lucide-react';

export interface IconProps extends Omit<LucideProps, 'size'> {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'accent' | 'muted';
  clickable?: boolean;
  className?: string;
}

export default function Icon({
  size = 'md',
  color = 'primary',
  clickable = false,
  className = '',
  ...props
}: IconProps) {
  const sizeConfig = {
    sm: 16,
    md: 20,
    lg: 24
  };

  const colorConfig = {
    primary: 'var(--warm-off-white)',
    secondary: 'var(--muted-gray)',
    accent: 'var(--dusty-gold)',
    muted: 'var(--muted-gray)'
  };

  const actualSize = sizeConfig[size];
  const actualColor = colorConfig[color];

  const classes = `
    transition-colors duration-200
    ${clickable ? 'cursor-pointer hover:opacity-80 active:scale-95' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <LucideIcon
      {...props}
      size={actualSize}
      className={classes}
      style={{
        color: actualColor,
        transition: 'var(--transition-fast)',
        width: `${actualSize}px`,
        height: `${actualSize}px`
      }}
    />
  );
}

// Export a wrapper for creating icon buttons
export interface IconButtonProps {
  icon: LucideIcon;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'accent' | 'muted';
  variant?: 'default' | 'ghost';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function IconButton({
  icon: Icon,
  size = 'md',
  color = 'primary',
  variant = 'default',
  onClick,
  disabled = false,
  className = '',
  children
}: IconButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    default: 'bg-[var(--soft-graphite)] border border-[var(--border-primary)] hover:bg-[rgba(184,155,94,0.1)] hover:border-[var(--dusty-gold)]',
    ghost: 'bg-transparent border border-transparent hover:bg-[rgba(184,155,94,0.1)]'
  };

  const classes = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={classes}
      style={{
        borderRadius: 'var(--radius-button)',
        transition: 'var(--transition-base)',
        minWidth: '44px',
        minHeight: '44px',
        padding: '8px',
        backgroundColor: 'var(--dusty-gold)',
        outlineOffset: '2px',
        outlineColor: 'var(--dusty-gold)'
      }}
    >
      <Icon size={size} color={color} />
      {children && (
        <span className="ml-2" style={{
          fontSize: 'var(--text-body)',
          color: 'var(--warm-off-white)'
        }}>
          {children}
        </span>
      )}
    </button>
  );
}