'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext-simple';
import ErrorBoundary from '@/components/ErrorBoundary';

// Import icons
import {
  LayoutDashboard,
  TrendingUp,
  PlusCircle,
  Calendar,
  Brain,
  Network,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';

// Safe icon components
const SafeIcon = ({ fallback, children, ...props }: any) => {
  try {
    return children || <span {...props}>{fallback}</span>;
  } catch (error) {
    console.error('🔧 [FIX] Icon render error:', error);
    return <span {...props}>{fallback}</span>;
  }
};

const SafeLayoutDashboard = (props: any) => <SafeIcon fallback="📊"><LayoutDashboard {...props} /></SafeIcon>;
const SafeTrendingUp = (props: any) => <SafeIcon fallback="📈"><TrendingUp {...props} /></SafeIcon>;
const SafePlusCircle = (props: any) => <SafeIcon fallback="➕"><PlusCircle {...props} /></SafeIcon>;
const SafeCalendar = (props: any) => <SafeIcon fallback="📅"><Calendar {...props} /></SafeIcon>;
const SafeBrain = (props: any) => <SafeIcon fallback="🧠"><Brain {...props} /></SafeIcon>;
const SafeNetwork = (props: any) => <SafeIcon fallback="🔗"><Network {...props} /></SafeIcon>;
const SafeSettings = (props: any) => <SafeIcon fallback="⚙️"><Settings {...props} /></SafeIcon>;
const SafeLogOut = (props: any) => <SafeIcon fallback="🚪"><LogOut {...props} /></SafeIcon>;
const SafeMenu = (props: any) => <SafeIcon fallback="☰"><Menu {...props} /></SafeIcon>;
const SafeX = (props: any) => <SafeIcon fallback="✖️"><X {...props} /></SafeIcon>;

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: SafeLayoutDashboard
  },
  {
    name: 'Trades',
    href: '/trades',
    icon: SafeTrendingUp
  },
  {
    name: 'Log Trade',
    href: '/log-trade',
    icon: SafePlusCircle
  },
  {
    name: 'Calendar',
    href: '/calendar',
    icon: SafeCalendar
  },
  {
    name: 'Strategy',
    href: '/strategies',
    icon: SafeBrain
  },
  {
    name: 'Confluence',
    href: '/confluence',
    icon: SafeNetwork
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: SafeSettings
  }
];

interface TopNavigationProps {
  className?: string;
}

const TopNavigation: React.FC<TopNavigationProps> = ({ className = '' }) => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    console.error('🔧 [FIX] useAuth hook failed:', error);
    authContext = {
      user: null,
      logout: async () => { console.log('🔧 [FIX] Fallback logout called'); },
      loading: false,
      authInitialized: true
    };
  }
  
  const { user, logout } = authContext;

  // Check if we're on mobile
  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Close mobile menu when switching to desktop
      if (!mobile && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    // Initial check
    checkIsMobile();
    
    // Listen for window resize
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu when route changes
  useEffect(() => {
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [pathname, isMobile]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <ErrorBoundary
      onError={(error, errorInfo, isHydrationError) => {
        console.error('🚨 TopNavigation ErrorBoundary caught error:', {
          error: error.message,
          isHydrationError,
          componentStack: errorInfo.componentStack
        });
      }}
    >
      <header
        className={`verotrade-top-navigation ${className}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '70px',
          backgroundColor: 'rgba(18, 18, 18, 0.98)',
          borderBottom: '1px solid rgba(184, 155, 94, 0.3)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '0 16px' : '0 24px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          overflow: 'visible',
          minHeight: '70px',
          maxHeight: '70px',
          pointerEvents: 'auto',
        }}
      >
        {/* Left side: VeroTrade logo and mobile menu button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            pointerEvents: 'auto',
          }}
        >
          {/* Mobile menu button */}
          {isMobile && (
            <button
              onClick={toggleMobileMenu}
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#e0e0e0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                borderRadius: '8px',
              }}
            >
              {isMobileMenuOpen ? <SafeX className="w-6 h-6" /> : <SafeMenu className="w-6 h-6" />}
            </button>
          )}
          
          {/* VeroTrade logo */}
          <div
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: isMobile ? '20px' : '26px',
              fontWeight: 'normal',
              color: '#e0e0e0',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            VeroTrade
          </div>
        </div>
        
        {/* Center: Navigation icons (desktop only) */}
        {!isMobile && (
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flex: 1,
              justifyContent: 'center',
              pointerEvents: 'auto',
            }}
          >
            {navigationItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={item.name}
                  passHref
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    color: isActive ? '#B89B5E' : '#e0e0e0',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    backgroundColor: isActive ? 'rgba(184, 155, 94, 0.15)' : 'transparent',
                    border: isActive ? '1px solid rgba(184, 155, 94, 0.3)' : '1px solid transparent',
                    position: 'relative',
                    pointerEvents: 'auto',
                    cursor: 'pointer',
                    zIndex: 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'rgba(184, 155, 94, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(184, 155, 94, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = 'transparent';
                    }
                  }}
                >
                  <Icon className="w-5 h-5" />
                  
                  {/* Tooltip on hover */}
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '-30px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                      opacity: 0,
                      pointerEvents: 'none',
                      transition: 'opacity 0.2s ease',
                    }}
                    className="nav-tooltip"
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        )}
        
        {/* Right side: User info and logout */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '8px' : '12px',
            pointerEvents: 'auto',
          }}
        >
          {/* User avatar */}
          <div
            style={{
              width: isMobile ? '32px' : '36px',
              height: isMobile ? '32px' : '36px',
              background: 'linear-gradient(135deg, #B89B5E 0%, #D6C7B2 50%, #B89B5E 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: isMobile ? '12px' : '14px',
              color: '#121212',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(184, 155, 94, 0.3)',
            }}
          >
            {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
          </div>
          
          {/* Logout button (desktop only) */}
          {!isMobile && (
            <button
              onClick={logout}
              style={{
                backgroundColor: 'transparent',
                color: '#e0e0e0',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: '500',
                borderRadius: '8px',
                padding: '8px 16px',
                border: '1px solid rgba(184, 155, 94, 0.3)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
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
              <SafeLogOut className="w-4 h-4" />
              Logout
            </button>
          )}
        </div>
      </header>
      
      {/* Mobile menu overlay */}
      {isMobile && isMobileMenuOpen && (
        <>
          {/* Overlay backdrop */}
          <div
            onClick={toggleMobileMenu}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              zIndex: 998,
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              pointerEvents: isMobileMenuOpen ? 'auto' : 'none',
            }}
          />
          
          {/* Mobile menu content */}
          <div
            style={{
              position: 'fixed',
              top: '70px',
              left: 0,
              right: 0,
              backgroundColor: 'rgba(18, 18, 18, 0.98)',
              borderBottom: '1px solid rgba(184, 155, 94, 0.3)',
              zIndex: 999,
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: 'calc(100vh - 70px)',
              overflowY: 'auto',
              pointerEvents: isMobileMenuOpen ? 'auto' : 'none',
            }}
          >
            {navigationItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={toggleMobileMenu}
                  passHref
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    color: isActive ? '#B89B5E' : '#e0e0e0',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    backgroundColor: isActive ? 'rgba(184, 155, 94, 0.15)' : 'transparent',
                    border: isActive ? '1px solid rgba(184, 155, 94, 0.3)' : '1px solid transparent',
                    pointerEvents: 'auto',
                    cursor: 'pointer',
                    zIndex: 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'rgba(184, 155, 94, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(184, 155, 94, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = 'transparent';
                    }
                  }}
                >
                  <Icon className="w-5 h-5" />
                  <span style={{ fontSize: '16px', fontWeight: '500' }}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
            
            {/* Mobile logout button */}
            <button
              onClick={() => {
                logout();
                toggleMobileMenu();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '8px',
                color: '#e0e0e0',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                backgroundColor: 'transparent',
                border: '1px solid rgba(184, 155, 94, 0.3)',
                cursor: 'pointer',
                marginTop: '8px',
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
              <SafeLogOut className="w-5 h-5" />
              <span style={{ fontSize: '16px', fontWeight: '500' }}>
                Logout
              </span>
            </button>
          </div>
        </>
      )}
      
      {/* Add CSS for tooltips */}
      <style jsx>{`
        .nav-tooltip {
          opacity: 0;
        }
        
        a:hover .nav-tooltip {
          opacity: 1;
        }
      `}</style>
    </ErrorBoundary>
  );
};

export default TopNavigation;