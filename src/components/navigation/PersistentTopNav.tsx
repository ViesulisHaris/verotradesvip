'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext-simple';

// 🔧 [DEBUG] Add diagnostic logging to identify the source of "Cannot read properties of undefined (reading 'call')" error
console.log('🔧 [DEBUG] PersistentTopNav module loading...');
console.log('🔧 [DEBUG] useAuth function:', typeof useAuth);
console.log('🔧 [DEBUG] Current environment:', typeof window !== 'undefined' ? 'client' : 'server');

interface PersistentTopNavProps {
  className?: string;
}

const PersistentTopNav: React.FC<PersistentTopNavProps> = ({ className = '' }) => {
  console.log('🔧 [DEBUG] PersistentTopNav component rendering...');
  
  let authContext;
  try {
    console.log('🔧 [DEBUG] About to call useAuth()...');
    authContext = useAuth();
    console.log('🔧 [DEBUG] useAuth() returned successfully:', {
      hasLogout: !!authContext?.logout,
      logoutType: typeof authContext?.logout,
      hasUser: !!authContext?.user,
      loading: authContext?.loading,
      authInitialized: authContext?.authInitialized
    });
  } catch (error) {
    console.error('🔧 [DEBUG] useAuth() failed with error:', error);
    console.error('🔧 [DEBUG] Error details:', {
      message: (error as any)?.message,
      stack: (error as any)?.stack,
      name: (error as any)?.name
    });
    throw error;
  }
  
  const { logout } = authContext;

  return (
    <header
      className={`verotrade-persistent-top-nav ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '70px', // Appropriate height for navigation
        backgroundColor: 'rgba(18, 18, 18, 0.98)', // Dark background matching dashboard theme
        borderBottom: '1px solid rgba(184, 155, 94, 0.3)', // Subtle border for visual separation
        zIndex: 1050, // High z-index to stay above other content
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)', // Subtle shadow for depth
        backdropFilter: 'blur(12px)', // Add backdrop blur for modern look
        WebkitBackdropFilter: 'blur(12px)', // Safari support
        // Ensure no content cutoff
        overflow: 'visible',
        minHeight: '70px',
        maxHeight: '70px',
      }}
    >
      {/* Left side: VeroTrade logo */}
      <div 
        style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '26px',
          fontWeight: 'normal',
          color: '#e0e0e0',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        VeroTrade
      </div>
      
      {/* Center area: Can be empty or contain optional navigation elements */}
      <div style={{ flex: 1 }}></div>
      
      {/* Right side: Logout button */}
      <button
        onClick={() => {
          console.log('🔧 [DEBUG] Logout button clicked');
          console.log('🔧 [DEBUG] Logout function type:', typeof logout);
          try {
            logout();
          } catch (error) {
            console.error('🔧 [DEBUG] Logout function call failed:', error);
          }
        }}
        style={{
          backgroundColor: 'transparent',
          color: '#e0e0e0',
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          fontWeight: '500',
          borderRadius: '8px',
          padding: '10px 20px',
          border: '1px solid rgba(184, 155, 94, 0.3)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(184, 155, 94, 0.1)';
          e.currentTarget.style.borderColor = 'rgba(184, 155, 94, 0.5)';
          e.currentTarget.style.color = '#d4af37';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.borderColor = 'rgba(184, 155, 94, 0.3)';
          e.currentTarget.style.color = '#e0e0e0';
        }}
      >
        Logout
      </button>
    </header>
  );
};

export default PersistentTopNav;