ha'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

console.log('🔍 [WEBPACK_DEBUG] Simple page module loading started');

function SimpleHomePage() {
  console.log('🔍 [WEBPACK_DEBUG] SimpleHomePage component rendering');
  const router = useRouter();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#121212',
      color: 'white',
      padding: '2rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '600',
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, #B89B5E, #D4AF37)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem'
        }}>
          VeroTrade
        </h1>
        <p style={{ fontSize: '1.1rem', opacity: 0.8, marginTop: '1rem' }}>
          Professional Trading Journal Platform
        </p>
        
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={() => router.push('/login')}
            style={{
              backgroundColor: '#B89B5E',
              color: '#121212',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Login
          </button>
          <button
            onClick={() => router.push('/register')}
            style={{
              backgroundColor: 'transparent',
              color: '#B89B5E',
              border: '1px solid #B89B5E',
              borderRadius: '0.5rem',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  console.log('🔍 [WEBPACK_DEBUG] HomePage wrapper rendering');
  return <SimpleHomePage />;
}