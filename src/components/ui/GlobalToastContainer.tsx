'use client';

import React from 'react';
import Toast, { ToastProps } from './Toast';
import { useToastContext } from '@/contexts/ToastContext';

export default function GlobalToastContainer() {
  const { toasts, removeToast } = useToastContext();
  
  console.log('🔍 [TOAST_DEBUG] GlobalToastContainer rendering with toasts:', toasts);
  
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
            onClose={() => removeToast(toast.id)}
          />
        );
      })}
    </div>
  );
}