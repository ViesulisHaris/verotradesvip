'use client';

import React, { useEffect, useState } from 'react';
import Alert, { AlertProps } from './Alert';

export interface ToastProps extends Omit<AlertProps, 'onClose'> {
  id?: string;
  duration?: number;
  onClose?: (id?: string) => void;
  autoClose?: boolean;
}

export default function Toast({
  id,
  duration = 5000,
  onClose,
  autoClose = true,
  ...alertProps
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (autoClose && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.(id);
    }, 300); // Match the animation duration
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`toast-wrapper ${isExiting ? 'toast-exit' : 'toast-enter'}`}
      style={{
        marginBottom: '12px',
      }}
    >
      <Alert
        {...alertProps}
        closable={true}
        onClose={handleClose}
        className="shadow-lg backdrop-blur-md"
      />
    </div>
  );
}