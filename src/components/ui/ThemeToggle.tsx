'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // Only access localStorage and window on client side
    if (typeof window !== 'undefined') {
      const isDark = localStorage.getItem('theme') === 'dark' || window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDark(isDark);
      document.documentElement.classList.toggle('dark', isDark);
    }
  }, []);

  const toggle = () => {
    const newDark = !dark;
    setDark(newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newDark);
  };

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg hover:bg-[rgba(184,155,94,0.1)] transition-colors duration-200"
      style={{
        backgroundColor: 'var(--soft-graphite)',
        border: '0.8px solid var(--border-primary)',
        borderRadius: 'var(--radius-button)',
        color: 'var(--warm-off-white)',
        transition: 'var(--transition-fast)',
        minWidth: '44px',
        minHeight: '44px'
      }}
    >
      {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
