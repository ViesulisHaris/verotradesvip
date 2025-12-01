'use client';

import React from 'react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function notFound() {
  useEffect(() => {
    console.log('🔍 [404 Page] Not found page loaded', {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent
    });

    // Log to analytics if available
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', '404', {
        page_location: window.location.href
      });
    }
  }, []);

  const handleGoHome = () => {
    console.log('🏠 [404 Page] Navigating to home...');
  };

  const handleGoBack = () => {
    console.log('⬅️ [404 Page] Navigating back...');
    window.history.back();
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--deep-charcoal, #121212)',
      color: 'var(--warm-off-white, #EAE6DD)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'var(--font-family-primary, Inter, system-ui, sans-serif)'
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        backgroundColor: 'var(--soft-graphite, #202020)',
        border: '1px solid var(--border-primary, rgba(184, 155, 94, 0.3))',
        borderRadius: 'var(--radius-card, 0.75rem)',
        padding: '2rem',
        textAlign: 'center',
        boxShadow: 'var(--shadow-card, 0 4px 6px -1px rgba(0, 0, 0, 0.1))'
      }}>
        
        {/* 404 Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          backgroundColor: 'rgba(184, 155, 94, 0.2)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          position: 'relative'
        }}>
          <div style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: 'var(--dusty-gold, #B89B5E)'
          }}>
            404
          </div>
        </div>

        {/* Error Title */}
        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: '600',
          color: 'var(--warm-off-white, #EAE6DD)',
          marginBottom: '1rem',
          marginTop: '0'
        }}>
          Page Not Found
        </h1>

        {/* Error Message */}
        <p style={{
          fontSize: '1rem',
          color: 'var(--muted-gray, #9A9A9A)',
          marginBottom: '2rem',
          lineHeight: '1.5'
        }}>
          The page you're looking for doesn't exist or has been moved.
          <br />
          Let's get you back on track.
        </p>

        {/* Current URL Info */}
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '2rem',
          fontSize: '0.875rem',
          color: 'var(--muted-gray, #9A9A9A)',
          wordBreak: 'break-all'
        }}>
          <strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Unknown'}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          alignItems: 'center'
        }}>
          <Link
            href="/"
            onClick={handleGoHome}
            style={{
              backgroundColor: 'var(--dusty-gold, #B89B5E)',
              color: 'var(--deep-charcoal, #121212)',
              border: 'none',
              borderRadius: 'var(--radius-button, 0.5rem)',
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textDecoration: 'none',
              display: 'inline-block',
              width: '100%',
              maxWidth: '200px',
              textAlign: 'center'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--dusty-gold-hover, #9B8049)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--dusty-gold, #B89B5E)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Go to Homepage
          </Link>

          <div style={{
            display: 'flex',
            gap: '0.75rem',
            width: '100%',
            maxWidth: '300px'
          }}>
            <button
              onClick={handleGoBack}
              style={{
                backgroundColor: 'transparent',
                color: 'var(--dusty-gold, #B89B5E)',
                border: '1px solid var(--border-primary, rgba(184, 155, 94, 0.3))',
                borderRadius: 'var(--radius-button, 0.5rem)',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                flex: 1
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(184, 155, 94, 0.1)';
                e.currentTarget.style.borderColor = 'var(--dusty-gold, #B89B5E)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'var(--border-primary, rgba(184, 155, 94, 0.3))';
              }}
            >
              Go Back
            </button>

            <Link
              href="/dashboard"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--warm-off-white, #EAE6DD)',
                border: '1px solid var(--border-primary, rgba(184, 155, 94, 0.3))',
                borderRadius: 'var(--radius-button, 0.5rem)',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textDecoration: 'none',
                flex: 1,
                textAlign: 'center',
                display: 'inline-block'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(184, 155, 94, 0.1)';
                e.currentTarget.style.color = 'var(--dusty-gold, #B89B5E)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--warm-off-white, #EAE6DD)';
              }}
            >
              Dashboard
            </Link>
          </div>
        </div>

        {/* Helpful Links */}
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: 'rgba(184, 155, 94, 0.1)',
          borderRadius: '0.5rem',
          border: '1px solid rgba(184, 155, 94, 0.2)'
        }}>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--muted-gray, #9A9A9A)',
            marginBottom: '0.75rem',
            fontWeight: '500'
          }}>
            Popular Pages:
          </p>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <Link 
              href="/dashboard"
              style={{
                color: 'var(--dusty-gold, #B89B5E)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                transition: 'color 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = 'var(--warm-sand, #D6C7B2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = 'var(--dusty-gold, #B89B5E)';
              }}
            >
              → Trading Dashboard
            </Link>
            <Link 
              href="/trades"
              style={{
                color: 'var(--dusty-gold, #B89B5E)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                transition: 'color 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = 'var(--warm-sand, #D6C7B2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = 'var(--dusty-gold, #B89B5E)';
              }}
            >
              → View Trades
            </Link>
            <Link 
              href="/log-trade"
              style={{
                color: 'var(--dusty-gold, #B89B5E)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                transition: 'color 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = 'var(--warm-sand, #D6C7B2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = 'var(--dusty-gold, #B89B5E)';
              }}
            >
              → Log New Trade
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}