'use client';

import React from 'react';
import Toast, { ToastProps } from './Toast';

interface ToastItem extends ToastProps {
  id: string;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  console.log('🔍 [TOAST_DEBUG] ToastContainer rendering with toasts:', toasts);
  
  return (
    <div className="toast-container" style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      pointerEvents: 'none'
    }}>
      {toasts.map((toast) => {
        console.log('🔍 [TOAST_DEBUG] Rendering toast:', toast);
        return (
          <Toast
            key={toast.id}
            {...toast}
            onClose={() => onRemove(toast.id)}
          />
        );
      })}
    </div>
  );
}