'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, closeOnEscape]);

  // Focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const timer = setTimeout(() => {
        modalRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md sm:max-w-md',
    md: 'max-w-sm sm:max-w-md md:max-w-lg',
    lg: 'max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl',
    xl: 'max-w-md sm:max-w-lg md:max-w-xl lg:max-w-3xl xl:max-w-4xl'
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[var(--z-modal-backdrop)] flex items-center justify-center p-2 sm:p-4 animate-fade-in"
      style={{
        backgroundColor: 'rgba(18, 18, 18, 0.8)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)'
      }}
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className={`relative w-full ${sizeClasses[size]} max-h-[85vh] sm:max-h-[90vh] overflow-y-auto overflow-x-hidden animate-scale-up`}
        style={{
          backgroundColor: 'var(--soft-graphite)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-modal)',
          backdropFilter: 'blur(var(--glass-morphism-blur))',
          WebkitBackdropFilter: 'blur(var(--glass-morphism-blur))',
          border: '0.8px solid var(--border-primary)',
          transition: 'var(--transition-base)',
          margin: '0 auto',
          maxHeight: 'calc(100vh - 2rem)',
          minHeight: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div
            className="flex items-center justify-between p-component border-b"
            style={{
              borderBottom: '0.8px solid var(--border-primary)'
            }}
          >
            {title && (
              <h2
                id="modal-title"
                className="h2-section truncate"
              >
                {title}
              </h2>
            )}
            
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-element rounded-full hover:bg-[rgba(184,155,94,0.1)] transition-colors duration-200"
                style={{
                  color: 'var(--warm-off-white)',
                  transition: 'var(--transition-fast)'
                }}
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div
          className="p-component"
          style={{
            padding: 'var(--spacing-card-inner)',
            overflowX: 'hidden'
          }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}