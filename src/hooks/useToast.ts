'use client';

import { useState, useCallback } from 'react';

export interface ToastItem {
  id: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  description?: string;
  duration?: number;
  autoClose?: boolean;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    
    console.log('🔍 [TOAST_DEBUG] Adding toast:', { id, toast: newToast });
    setToasts(prev => {
      const updated = [...prev, newToast];
      console.log('🔍 [TOAST_DEBUG] Updated toasts array:', updated);
      return updated;
    });
    
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = useCallback((title: string, description?: string, options?: Partial<ToastItem>) => {
    return addToast({
      variant: 'success',
      title,
      description,
      duration: 4000,
      autoClose: true,
      ...options
    });
  }, [addToast]);

  const showError = useCallback((title: string, description?: string, options?: Partial<ToastItem>) => {
    return addToast({
      variant: 'error',
      title,
      description,
      duration: 6000, // Error messages stay longer
      autoClose: true,
      ...options
    });
  }, [addToast]);

  const showWarning = useCallback((title: string, description?: string, options?: Partial<ToastItem>) => {
    return addToast({
      variant: 'warning',
      title,
      description,
      duration: 5000,
      autoClose: true,
      ...options
    });
  }, [addToast]);

  const showInfo = useCallback((title: string, description?: string, options?: Partial<ToastItem>) => {
    return addToast({
      variant: 'info',
      title,
      description,
      duration: 4000,
      autoClose: true,
      ...options
    });
  }, [addToast]);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAll
  };
}