'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext-simple';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();
  
  const { user, loading } = useAuth();

  // Add client-side rendering detection
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Simplified redirect logic
  useEffect(() => {
    console.log('🔍 [LOGIN_DEBUG] Login page useEffect checking redirect', {
      hasUser: !!user,
      userEmail: user?.email,
      loading,
      shouldRedirect: !!(user && !loading),
      timestamp: new Date().toISOString()
    });
    
    if (user && !loading) {
      console.log('🔍 [LOGIN_DEBUG] Redirecting to dashboard from useEffect', {
        userEmail: user?.email,
        reason: 'user && !loading'
      });
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // CRITICAL FIX: Listen for auth state changes to ensure proper synchronization
  useEffect(() => {
    console.log('🔍 [LOGIN_DEBUG] Setting up auth state change listener', {
      timestamp: new Date().toISOString()
    });

    const handleAuthChange = (event: string, session: any) => {
      console.log('🔍 [LOGIN_DEBUG] Auth state change detected', {
        event,
        hasSession: !!session,
        userEmail: session?.user?.email,
        timestamp: new Date().toISOString()
      });

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('🔍 [LOGIN_DEBUG] User signed in, redirecting to dashboard', {
          userEmail: session.user.email,
          reason: 'SIGNED_IN event with session'
        });
        router.push('/dashboard');
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);
    
    return () => {
      subscription?.unsubscribe();
    };
  }, [router]); // Only depend on router to prevent re-setup

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    setShowError(false);
    setErrorMessage('');
    
    try {
      // Validate input before attempting authentication
      if (!email || !password) {
        setErrorMessage('Please enter both email and password');
        setShowError(true);
        setIsSubmitting(false);
        return;
      }

      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        // Handle specific error cases with user-friendly messages
        let userFriendlyMessage = error.message;
        
        if (error.message.includes('Invalid login credentials')) {
          userFriendlyMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('Email not confirmed')) {
          userFriendlyMessage = 'Please confirm your email address before signing in.';
        } else if (error.message.includes('Too many requests')) {
          userFriendlyMessage = 'Too many login attempts. Please try again later.';
        } else if (error.message.includes('Network')) {
          userFriendlyMessage = 'Network error. Please check your connection and try again.';
        }
        
        setErrorMessage(userFriendlyMessage);
        setShowError(true);
      } else if (data?.user) {
        console.log('🔍 [LOGIN_DEBUG] Login successful, auth state change will handle redirect', {
          userEmail: data.user.email,
          hasData: !!data,
          hasUser: !!data.user,
          timestamp: new Date().toISOString()
        });
        
        // CRITICAL FIX: Don't use setTimeout anymore - let auth state change listener handle redirect
        // This prevents race condition where AuthGuard checks auth state before it's updated
        console.log('🔍 [LOGIN_DEBUG] Auth state listener will handle redirect automatically', {
          userEmail: data.user.email,
          reason: 'Auth state change listener will handle SIGNED_IN event'
        });
      } else {
        setErrorMessage('Authentication failed. Please try again.');
        setShowError(true);
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      
      // Handle unexpected errors gracefully
      let errorMessage = 'An unexpected error occurred during authentication.';
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Network connection failed. Please check your internet connection.';
      } else if (error.name === 'AbortError') {
        errorMessage = 'Authentication request timed out. Please try again.';
      }
      
      setErrorMessage(errorMessage);
      setShowError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prevent gray screen with client-side detection
  if (!isClient) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a'
      }}>
        <div style={{
          color: '#ffffff',
          fontSize: '18px'
        }}>Loading...</div>
      </div>
    );
  }

  // Simplified loading state - only show brief loading for very short time
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a'
      }}>
        <div style={{
          color: '#ffffff',
          fontSize: '18px'
        }}>Loading authentication...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      backgroundImage: 'linear-gradient(to bottom right, #0f172a, #1e3a8a, #0f172a)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '448px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '30px',
            fontWeight: 'bold',
            color: '#ffffff',
            marginTop: '24px',
            marginBottom: '8px'
          }}>Welcome to VeroTrade</h2>
          <p style={{
            color: '#d1d5db',
            fontSize: '14px'
          }}>Professional Trading Journal</p>
        </div>

        {/* Login Form */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(16px)',
          borderRadius: '8px',
          padding: '32px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <form onSubmit={handleLogin}
            style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            {/* Error Message */}
            {showError && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fca5a5',
                color: '#dc2626',
                padding: '12px 16px',
                borderRadius: '6px',
                fontSize: '14px'
              }}>
                {errorMessage}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#ffffff',
                marginBottom: '8px'
              }}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  outline: 'none'
                }}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#ffffff',
                marginBottom: '8px'
              }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  outline: 'none'
                }}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '12px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#ffffff',
                  backgroundColor: isSubmitting ? '#9ca3af' : '#2563eb',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
                data-testid="login-submit-button"
              >
                {isSubmitting ? (
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <svg style={{
                      animation: 'spin 1s linear infinite',
                      marginRight: '12px',
                      height: '20px',
                      width: '20px'
                    }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle style={{ opacity: '0.25' }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path style={{ opacity: '0.75' }} fill="currentColor" d="M4 12a8 8 0 018 8V8a8 8 0 00-4.58-4.58A8 8 0 004 12z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>

          {/* Footer Links */}
          <div style={{
            marginTop: '24px',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '14px',
              color: '#9ca3af'
            }}>
              Don't have an account?{' '}
              <Link href="/register" style={{
                fontWeight: '500',
                color: '#2563eb',
                textDecoration: 'none'
              }}>
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
