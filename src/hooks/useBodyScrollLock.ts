import { useEffect } from 'react';

/**
 * Custom hook to lock/unlock body scroll when modals are open
 * @param isLocked - Whether the body scroll should be locked
 */
export const useBodyScrollLock = (isLocked: boolean) => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    
    if (isLocked) {
      // Save the original overflow style
      document.body.style.overflow = 'hidden';
      // Also prevent scrolling on touch devices
      document.body.style.touchAction = 'none';
    } else {
      // Restore the original overflow style
      document.body.style.overflow = originalStyle;
      document.body.style.touchAction = '';
    }

    // Cleanup function to restore original style when component unmounts
    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.touchAction = '';
    };
  }, [isLocked]);
};