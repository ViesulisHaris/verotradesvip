'use client';

import React, { useState, useEffect, forwardRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  PlusCircle,
  Calendar,
  Brain,
  Network,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
  TrendingUp as TrendingIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    badge: 'new'
  },
  {
    name: 'Trades',
    href: '/trades',
    icon: TrendingUp
  },
  {
    name: 'Log Trade',
    href: '/log-trade',
    icon: PlusCircle
  },
  {
    name: 'Calendar',
    href: '/calendar',
    icon: Calendar
  },
  {
    name: 'Strategy',
    href: '/strategies',
    icon: Brain
  },
  {
    name: 'Confluence',
    href: '/confluence',
    icon: Network
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings
  }
];

interface UnifiedSidebarProps {
  className?: string;
}

const UnifiedSidebar = forwardRef<HTMLDivElement, UnifiedSidebarProps>(({ className }, ref) => {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed by default
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userManuallyToggled, setUserManuallyToggled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Start closed for overlay behavior
  const pathname = usePathname();

  // Don't render sidebar if user is not authenticated
  if (!user) {
    return null;
  }

  // Check if we're on mobile and adjust initial state
  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Always start collapsed on desktop, overlay only when opened
      if (mobile) {
        setIsSidebarOpen(false);
        setIsCollapsed(true);
      } else {
        // Desktop: start collapsed but visible
        setIsCollapsed(true);
        setIsSidebarOpen(false);
      }
    };

    // Initial check
    checkIsMobile();
    
    // Listen for window resize
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Dispatch visibility event when sidebar state changes
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('sidebarVisibility', {
      detail: { isVisible: isSidebarOpen }
    }));
  }, [isSidebarOpen]);

  // Listen for close sidebar event
  useEffect(() => {
    const handleCloseSidebar = () => {
      setIsSidebarOpen(false);
      if (!isMobile) {
        setIsCollapsed(true);
        setUserManuallyToggled(true);
      }
    };

    window.addEventListener('closeSidebar', handleCloseSidebar);
    
    return () => {
      window.removeEventListener('closeSidebar', handleCloseSidebar);
    };
  }, [isMobile]);

  // Close mobile menu when route changes
  useEffect(() => {
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [pathname, isMobile]);

  const toggleSidebar = () => {
    if (isMobile) {
      // For mobile, toggle the mobile menu
      const newState = !isMobileMenuOpen;
      setIsMobileMenuOpen(newState);
      setIsSidebarOpen(newState);
    } else {
      // For desktop, toggle collapsed state (sidebar is always visible)
      const newCollapsedState = !isCollapsed;
      setIsCollapsed(newCollapsedState);
      setUserManuallyToggled(true);
      
      // Dispatch proper collapse state event
      window.dispatchEvent(new CustomEvent('sidebarCollapse', {
        detail: { isCollapsed: newCollapsedState }
      }));
    }
  };

  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);
    setIsSidebarOpen(newState);
  };

  return (
    <>
      {/* Mobile menu button - Beautiful floating design */}
      {isMobile && (
        <button
          onClick={toggleMobileMenu}
          className="verotrade-mobile-menu-btn"
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileMenuOpen}
          style={{
            position: 'fixed',
            top: '86px', // 70px (nav height) + 16px spacing
            left: '16px',
            zIndex: 1041, // Above sidebar (1040)
            backgroundColor: 'rgba(18, 18, 18, 0.95)',
            border: '1px solid rgba(184, 155, 94, 0.4)',
            borderRadius: '12px',
            width: '48px',
            height: '48px',
            minWidth: '48px',
            minHeight: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#EAE6DD',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(184, 155, 94, 0.1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.borderColor = 'rgba(184, 155, 94, 0.6)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(184, 155, 94, 0.2), 0 0 0 1px rgba(184, 155, 94, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.borderColor = 'rgba(184, 155, 94, 0.4)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(184, 155, 94, 0.1)';
          }}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
      )}

      {/* Desktop overlay - Beautiful backdrop */}
      {!isMobile && isSidebarOpen && !isCollapsed && (
        <div
          className="verotrade-desktop-overlay"
          onClick={toggleSidebar}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 1039, // Below sidebar (1040)
            opacity: 1,
            visibility: 'visible',
            transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      )}

      {/* Mobile overlay - Enhanced backdrop */}
      {isMobile && (
        <div
          className={`verotrade-mobile-overlay ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={toggleMobileMenu}
          aria-hidden={!isMobileMenuOpen}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1039, // Below sidebar (1040)
            opacity: isMobileMenuOpen ? 1 : 0,
            visibility: isMobileMenuOpen ? 'visible' : 'hidden',
            transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
        />
      )}

      {/* Beautiful Sidebar Overlay */}
      <aside
        ref={ref}
        className={cn(
          'verotrade-sidebar-overlay',
          isMobile ? (isMobileMenuOpen ? 'mobile-visible' : 'mobile-hidden') : '',
          !isMobile && isCollapsed ? 'collapsed' : '',
          className
        )}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: isCollapsed ? '80px' : '280px',
          zIndex: 1040, // Above top navigation bar (1035)
          backgroundColor: 'rgba(18, 18, 18, 0.98)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(184, 155, 94, 0.2)',
          borderLeft: 'none',
          borderBottom: 'none',
          boxShadow: isMobile || isSidebarOpen
            ? '0 0 60px rgba(184, 155, 94, 0.15), 0 0 120px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(184, 155, 94, 0.1)'
            : '0 0 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(184, 155, 94, 0.05)',
          transform: isMobile
            ? (isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)')
            : 'translateX(0)', /* FIXED: Always visible on desktop, collapsed state only affects width */
          transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'transform, box-shadow',
        }}
      >
        <div className="flex flex-col h-full" style={{ height: '100vh' }}>
          {/* Enhanced Logo area with gradient */}
          <div
            className="verotrade-sidebar-header"
            style={{
              padding: '20px',
              borderBottom: '1px solid rgba(184, 155, 94, 0.15)',
              background: 'linear-gradient(135deg, rgba(184, 155, 94, 0.08) 0%, rgba(184, 155, 94, 0.02) 100%)',
              minHeight: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div className="verotrade-logo" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                className="verotrade-logo-icon"
                style={{
                  width: '42px',
                  height: '42px',
                  background: 'linear-gradient(135deg, #B89B5E 0%, #D6C7B2 50%, #B89B5E 100%)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '16px',
                  color: '#121212',
                  flexShrink: 0,
                  boxShadow: '0 4px 16px rgba(184, 155, 94, 0.3)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <span style={{ position: 'relative', zIndex: 1 }}>VT</span>
                <div
                  style={{
                    position: 'absolute',
                    top: '-50%',
                    left: '-50%',
                    width: '200%',
                    height: '200%',
                    background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)',
                    animation: 'shimmer 3s infinite',
                  }}
                />
              </div>
              <div
                className="verotrade-logo-text"
                style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#EAE6DD',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  opacity: isCollapsed ? 0 : 1,
                  transition: 'opacity 0.3s ease',
                }}
              >
                VeroTrades
              </div>
            </div>
            
            {/* Desktop toggle button */}
            {!isMobile && (
              <button
                onClick={toggleSidebar}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(184, 155, 94, 0.1)',
                  border: '1px solid rgba(184, 155, 94, 0.2)',
                  color: '#B89B5E',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(184, 155, 94, 0.2)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(184, 155, 94, 0.1)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </button>
            )}
          </div>

          {/* Enhanced Navigation items */}
          <nav
            className="verotrade-sidebar-nav"
            style={{
              padding: '16px',
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
          >
            {navigationItems.map((item, index) => {
              const isActive = pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'verotrade-nav-item',
                    isActive && 'active'
                  )}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isCollapsed ? '0' : '12px',
                    padding: isCollapsed ? '16px 8px' : '16px',
                    marginBottom: '8px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: isActive ? '#B89B5E' : '#EAE6DD',
                    textDecoration: 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    backgroundColor: isActive ? 'rgba(184, 155, 94, 0.15)' : 'transparent',
                    border: isActive ? '1px solid rgba(184, 155, 94, 0.3)' : '1px solid transparent',
                    height: '52px',
                    minHeight: '52px',
                    minWidth: '44px',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    overflow: 'hidden',
                  }}
                  onClick={(e) => {
                    // Close mobile menu after navigation
                    if (isMobile) {
                      setIsMobileMenuOpen(false);
                      setIsSidebarOpen(false);
                    }
                       
                    // Force navigation using window.location if Next.js Link doesn't work
                    if (item.href !== pathname) {
                      setTimeout(() => {
                        if (window.location.pathname !== item.href) {
                          window.location.href = item.href;
                        }
                      }, 100);
                    }
                  }}
                  onTouchEnd={(e) => {
                    // Ensure mobile menu closes on touch
                    if (isMobile) {
                      setIsMobileMenuOpen(false);
                      setIsSidebarOpen(false);
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'rgba(184, 155, 94, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(184, 155, 94, 0.2)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = 'transparent';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }
                  }}
                >
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Icon
                      className="verotrade-nav-icon"
                    />
                    {item.badge && !isCollapsed && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          backgroundColor: '#B89B5E',
                          color: '#121212',
                          fontSize: '10px',
                          fontWeight: '700',
                          padding: '2px 6px',
                          borderRadius: '10px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      opacity: isCollapsed ? 0 : 1,
                      transition: 'opacity 0.3s ease',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.name}
                  </span>
                  {isActive && !isCollapsed && (
                    <div
                      style={{
                        position: 'absolute',
                        left: '0',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '3px',
                        height: '24px',
                        backgroundColor: '#B89B5E',
                        borderRadius: '0 3px 3px 0',
                        boxShadow: '0 0 12px rgba(184, 155, 94, 0.6)',
                      }}
                    />
                  )}
                </Link>
              );
            })}
            
            {/* Enhanced Logout button */}
            <button
              onClick={logout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isCollapsed ? '0' : '12px',
                padding: isCollapsed ? '16px 8px' : '16px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#A7352D',
                textDecoration: 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                backgroundColor: 'transparent',
                border: '1px solid transparent',
                height: '52px',
                minHeight: '52px',
                minWidth: '44px',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                cursor: 'pointer',
                marginTop: 'auto',
                width: '100%',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(167, 53, 45, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(167, 53, 45, 0.3)';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <LogOut
                className="verotrade-nav-icon"
              />
              <span
                style={{
                  opacity: isCollapsed ? 0 : 1,
                  transition: 'opacity 0.3s ease',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Logout
              </span>
            </button>
          </nav>

          {/* Enhanced User area at bottom */}
          <div
            className="verotrade-sidebar-footer"
            style={{
              background: 'linear-gradient(135deg, rgba(184, 155, 94, 0.08) 0%, rgba(184, 155, 94, 0.02) 100%)',
              padding: '20px',
              borderTop: '1px solid rgba(184, 155, 94, 0.15)',
              marginTop: 'auto',
            }}
          >
            <div className="verotrade-user-area" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                className="verotrade-user-avatar"
                style={{
                  width: '42px',
                  height: '42px',
                  background: 'linear-gradient(135deg, #B89B5E 0%, #D6C7B2 50%, #B89B5E 100%)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '16px',
                  color: '#121212',
                  flexShrink: 0,
                  boxShadow: '0 4px 16px rgba(184, 155, 94, 0.3)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <span style={{ position: 'relative', zIndex: 1 }}>U</span>
                <div
                  style={{
                    position: 'absolute',
                    top: '-50%',
                    left: '-50%',
                    width: '200%',
                    height: '200%',
                    background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)',
                    animation: 'shimmer 3s infinite',
                  }}
                />
              </div>
              <div
                className="verotrade-user-info"
                style={{
                  flex: 1,
                  minWidth: 0,
                  opacity: isCollapsed ? 0 : 1,
                  transition: 'opacity 0.3s ease',
                }}
              >
                <div
                  className="verotrade-user-name"
                  style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#EAE6DD',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  User
                </div>
                <div
                  className="verotrade-user-role"
                  style={{
                    fontSize: '12px',
                    fontWeight: '400',
                    color: '#9A9A9A',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  Professional Trader
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Add shimmer animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%) translateY(-100%) rotate(45deg);
          }
          100% {
            transform: translateX(100%) translateY(100%) rotate(45deg);
          }
        }
      `}</style>
    </>
  );
});

export default UnifiedSidebar;