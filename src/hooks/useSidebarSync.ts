'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { debounce } from '@/lib/performance';

interface SidebarSyncState {
  isCollapsed: boolean;
  isTransitioning: boolean;
  transitionStartTime: number;
}

interface UseSidebarSyncReturn {
  isCollapsed: boolean;
  isTransitioning: boolean;
  toggleSidebar: () => void;
  setSidebarState: (collapsed: boolean) => void;
  transitionProgress: number;
}

// Global sidebar state for synchronization across components
let globalSidebarState: SidebarSyncState = {
  isCollapsed: true,
  isTransitioning: false,
  transitionStartTime: 0
};

const listeners = new Set<(state: SidebarSyncState) => void>();

// Debounced localStorage save to prevent blocking
const debouncedSaveToLocalStorage = debounce((isCollapsed: boolean) => {
  try {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
  } catch (error) {
    console.error('Error saving sidebar state:', error);
  }
}, 100);

export function useSidebarSync(initialCollapsed = true): UseSidebarSyncReturn {
  const [localState, setLocalState] = useState<SidebarSyncState>(() => ({
    isCollapsed: initialCollapsed,
    isTransitioning: false,
    transitionStartTime: 0
  }));
  
  const animationFrameRef = useRef<number | undefined>(undefined);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  // Refs to track transition state without triggering re-renders
  const transitionStateRef = useRef({
    isTransitioning: false,
    transitionStartTime: 0
  });

  // Load initial state from localStorage
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('sidebar-collapsed');
      if (savedState !== null) {
        const parsedState = JSON.parse(savedState);
        globalSidebarState.isCollapsed = parsedState;
        setLocalState(globalSidebarState);
      }
    } catch (error) {
      console.error('Error loading sidebar state:', error);
    }
    // No cleanup needed for this effect
  }, []);

  // Listen for global state changes
  useEffect(() => {
    const listener = (state: SidebarSyncState) => {
      setLocalState(state);
    };
    
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  // Notify all listeners of state changes
  const notifyListeners = useCallback((newState: SidebarSyncState) => {
    globalSidebarState = newState;
    listeners.forEach(listener => listener(newState));
  }, []);

  // Calculate transition progress for smooth animations
  // Using refs to avoid circular dependencies with state
  const updateTransitionProgress = useCallback(() => {
    if (!transitionStateRef.current.isTransitioning) {
      return;
    }
    
    const elapsed = performance.now() - transitionStateRef.current.transitionStartTime;
    const progress = Math.min(elapsed / 300, 1); // 300ms transition duration
    
    if (progress >= 1) {
      // Transition complete
      transitionStateRef.current.isTransitioning = false;
      notifyListeners({
        ...globalSidebarState,
        isTransitioning: false
      });
      return;
    }
    
    // Continue updating progress
    animationFrameRef.current = requestAnimationFrame(updateTransitionProgress);
  }, [notifyListeners]); // Only depends on notifyListeners, not on state

  // Toggle sidebar with optimized performance
  const toggleSidebar = useCallback(() => {
    const newState = !globalSidebarState.isCollapsed;
    const startTime = performance.now();
    
    // Update ref and state immediately in the same frame
    transitionStateRef.current = {
      isTransitioning: true,
      transitionStartTime: startTime
    };
    
    const updatedState: SidebarSyncState = {
      isCollapsed: newState,
      isTransitioning: true,
      transitionStartTime: startTime
    };
    
    // Notify all listeners in the same frame
    notifyListeners(updatedState);
    
    // Save to localStorage (debounced)
    debouncedSaveToLocalStorage(newState);
    
    // Start transition progress tracking with optimized timing
    animationFrameRef.current = requestAnimationFrame(updateTransitionProgress);
    
    // Clear transition with optimized timing
    transitionTimeoutRef.current = setTimeout(() => {
      transitionStateRef.current.isTransitioning = false;
      notifyListeners({
        ...globalSidebarState,
        isTransitioning: false
      });
    }, 300);
  }, [notifyListeners, updateTransitionProgress]);

  // Set sidebar state directly
  const setSidebarState = useCallback((collapsed: boolean) => {
    const startTime = performance.now();
    
    // Update ref and state
    transitionStateRef.current = {
      isTransitioning: true,
      transitionStartTime: startTime
    };
    
    const updatedState: SidebarSyncState = {
      isCollapsed: collapsed,
      isTransitioning: true,
      transitionStartTime: startTime
    };
    
    notifyListeners(updatedState);
    debouncedSaveToLocalStorage(collapsed);
    
    animationFrameRef.current = requestAnimationFrame(updateTransitionProgress);
    
    transitionTimeoutRef.current = setTimeout(() => {
      transitionStateRef.current.isTransitioning = false;
      notifyListeners({
        ...globalSidebarState,
        isTransitioning: false
      });
    }, 300);
  }, [notifyListeners, updateTransitionProgress]);

  // Calculate transition progress
  const transitionProgress = localState.isTransitioning ?
    (() => {
      const elapsed = performance.now() - transitionStateRef.current.transitionStartTime;
      return Math.min(elapsed / 300, 1); // 300ms transition duration
    })() : 0;

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  return {
    isCollapsed: localState.isCollapsed,
    isTransitioning: localState.isTransitioning,
    toggleSidebar,
    setSidebarState,
    transitionProgress
  };
}

// Export global state for chart components to access
export function getGlobalSidebarState(): SidebarSyncState {
  return globalSidebarState;
}

// Subscribe to sidebar state changes for non-React components
export function subscribeToSidebarChanges(callback: (state: SidebarSyncState) => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}