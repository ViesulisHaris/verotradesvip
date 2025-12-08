'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  preventBodyScroll?: boolean;
  className?: string;
  overlayClassName?: string;
}

const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  preventBodyScroll = true,
  className = '',
  overlayClassName = ''
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const scrollPositionRef = useRef(0);

  // Store scroll position and prevent body scroll
  const preventScroll = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    scrollPositionRef.current = window.scrollY;
    const body = document.body;
    const html = document.documentElement;
    
    // Store current styles
    const bodyOverflow = body.style.overflow;
    const bodyPosition = body.style.position;
    const bodyTop = body.style.top;
    const htmlOverflow = html.style.overflow;
    
    // Prevent scrolling
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollPositionRef.current}px`;
    body.style.width = '100%';
    html.style.overflow = 'hidden';
    
    return () => {
      // Restore scrolling
      body.style.overflow = bodyOverflow;
      body.style.position = bodyPosition;
      body.style.top = bodyTop;
      html.style.overflow = htmlOverflow;
      window.scrollTo(0, scrollPositionRef.current);
    };
  }, []);

  // Handle overlay click
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  }, [closeOnOverlayClick, onClose]);

  // Handle escape key
  const handleEscapeKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && closeOnEscape) {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
  }, [closeOnEscape, onClose]);

  // Focus management
  const trapFocus = useCallback(() => {
    if (!modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    // Store current focus
    previousFocusRef.current = document.activeElement as HTMLElement;
    
    // Focus first element
    firstElement?.focus();
    
    // Add tab key listener
    document.addEventListener('keydown', handleTabKey);
    
    return () => {
      document.removeEventListener('keydown', handleTabKey);
      // Restore focus
      previousFocusRef.current?.focus();
    };
  }, []);

  // Setup modal effects
  useEffect(() => {
    if (!isOpen) return;

    console.log('🎭 [BaseModal] Modal opening with enhanced features');
    
    // Prevent body scroll
    let restoreScroll: (() => void) | undefined;
    if (preventBodyScroll) {
      restoreScroll = preventScroll();
    }

    // Add escape key listener
    document.addEventListener('keydown', handleEscapeKey);

    // Trap focus
    const restoreFocus = trapFocus();

    // Cleanup
    return () => {
      console.log('🎭 [BaseModal] Modal closing, cleaning up');
      document.removeEventListener('keydown', handleEscapeKey);
      restoreFocus?.();
      restoreScroll?.();
    };
  }, [isOpen, preventBodyScroll, handleEscapeKey, trapFocus, preventScroll]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] w-[95vw]'
  };

  // Create portal to render modal at the end of body
  return createPortal(
    <div
      className={`fixed inset-0 z-[999999] flex items-center justify-center p-4 ${overlayClassName}`}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh'
      }}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        ref={modalRef}
        className={`relative w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto bg-surface rounded-xl shadow-2xl border border-white/10 animate-scale-up ${className}`}
        style={{
          animation: 'scale-up 0.2s ease-out',
          transformOrigin: 'center'
        }}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            {title && (
              <h2
                id="modal-title"
                className="text-xl font-bold text-white truncate"
              >
                {title}
              </h2>
            )}
            
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors duration-200 text-white/70 hover:text-white"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>

      {/* Add keyframe styles */}
      <style jsx>{`
        @keyframes scale-up {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-scale-up {
          animation: scale-up 0.2s ease-out;
        }
      `}</style>
    </div>,
    document.body
  );
};

export default BaseModal;