'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ToastItem } from '@/hooks/useToast';

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  showSuccess: (title: string, description?: string, options?: Partial<ToastItem>) => string;
  showError: (title: string, description?: string, options?: Partial<ToastItem>) => string;
  showWarning: (title: string, description?: string, options?: Partial<ToastItem>) => string;
  showInfo: (title: string, description?: string, options?: Partial<ToastItem>) => string;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToastContext() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (toast: Omit<ToastItem, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    
    console.log('🔍 [TOAST_DEBUG] Adding toast:', { id, toast: newToast });
    setToasts(prev => {
      const updated = [...prev, newToast];
      console.log('🔍 [TOAST_DEBUG] Updated toasts array:', updated);
      return updated;
    });
    
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (title: string, description?: string, options?: Partial<ToastItem>) => {
    return addToast({
      variant: 'success',
      title,
      description,
      duration: 4000,
      autoClose: true,
      ...options
    });
  };

  const showError = (title: string, description?: string, options?: Partial<ToastItem>) => {
    return addToast({
      variant: 'error',
      title,
      description,
      duration: 6000,
      autoClose: true,
      ...options
    });
  };

  const showWarning = (title: string, description?: string, options?: Partial<ToastItem>) => {
    return addToast({
      variant: 'warning',
      title,
      description,
      duration: 5000,
      autoClose: true,
      ...options
    });
  };

  const showInfo = (title: string, description?: string, options?: Partial<ToastItem>) => {
    return addToast({
      variant: 'info',
      title,
      description,
      duration: 4000,
      autoClose: true,
      ...options
    });
  };

  const clearAll = () => {
    setToasts([]);
  };

  const value: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAll
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}