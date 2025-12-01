'use client';

import React from 'react';
import { 
  AlertCircle, 
  CheckCircle, 
  Info, 
  AlertTriangle,
  X
} from 'lucide-react';

export interface AlertProps {
  variant?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  description?: string;
  closable?: boolean;
  onClose?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export default function Alert({
  variant = 'info',
  title,
  description,
  closable = false,
  onClose,
  className = '',
  children
}: AlertProps) {
  const variantConfig = {
    success: {
      bg: 'bg-[var(--muted-olive)]/10',
      border: 'border-[var(--muted-olive)]/30',
      text: 'text-[var(--muted-olive)]',
      icon: CheckCircle,
      iconBg: 'bg-[var(--muted-olive)]/20'
    },
    error: {
      bg: 'bg-[var(--rust-red)]/10',
      border: 'border-[var(--rust-red)]/30',
      text: 'text-[var(--rust-red)]',
      icon: AlertCircle,
      iconBg: 'bg-[var(--rust-red)]/20'
    },
    warning: {
      bg: 'bg-[var(--warm-sand)]/10',
      border: 'border-[var(--warm-sand)]/30',
      text: 'text-[var(--warm-sand)]',
      icon: AlertTriangle,
      iconBg: 'bg-[var(--warm-sand)]/20'
    },
    info: {
      bg: 'bg-[var(--dusty-gold)]/10',
      border: 'border-[var(--dusty-gold)]/30',
      text: 'text-[var(--dusty-gold)]',
      icon: Info,
      iconBg: 'bg-[var(--dusty-gold)]/20'
    }
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={`
        relative p-4 rounded-lg border transition-all duration-300
        ${config.bg} ${config.border} ${config.text}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      style={{
        borderRadius: 'var(--radius-card)',
        transition: 'var(--transition-base)'
      }}
    >
      {/* Close button */}
      {closable && onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-black/10 transition-colors duration-200"
          style={{
            color: 'var(--warm-off-white)'
          }}
          aria-label="Close alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Content */}
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`p-2 rounded-lg flex-shrink-0 ${config.iconBg}`}
          style={{
            backgroundColor: 'var(--soft-graphite)'
          }}
        >
          <Icon className="w-5 h-5" />
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="font-semibold mb-1 body-text" style={{
              fontSize: 'var(--text-body)',
              fontWeight: 'var(--font-weight-h2)',
              color: 'var(--warm-off-white)'
            }}>
              {title}
            </h3>
          )}
          
          {description && (
            <p className="text-sm opacity-90" style={{
              fontSize: 'var(--text-small)',
              color: 'var(--warm-off-white)'
            }}>
              {description}
            </p>
          )}
          
          {children}
        </div>
      </div>
    </div>
  );
}