'use client';

import { useState } from 'react';
import { Menu, X, Home, PlusCircle, Calendar, BarChart3, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Props {
  onLogout: () => void;
}

export default function Sidebar({ onLogout }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/log-trade', label: 'Log Trade', icon: PlusCircle },
    { href: '/calendar', label: 'Calendar', icon: Calendar },
    { href: '/strategies', label: 'Strategies', icon: BarChart3 },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="verotrade-mobile-menu-btn lg:hidden"
      >
        <Menu className="w-5 h-5" />
      </button>

      {open && <div className="verotrade-mobile-overlay" onClick={() => setOpen(false)} />}

      <aside className={`
        verotrade-sidebar
        ${open ? 'mobile-visible' : 'mobile-hidden'} lg:translate-x-0
      `}>
        <div className="verotrade-sidebar-header">
          <div className="verotrade-logo">
            <div className="verotrade-logo-icon">V</div>
            <span className="verotrade-logo-text">VeroTrade</span>
          </div>
          <button onClick={() => setOpen(false)} className="unified-toggle-btn lg:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="verotrade-sidebar-nav">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`
                verotrade-nav-item
                ${pathname === href ? 'active' : ''}
              `}
              onClick={() => setOpen(false)}
            >
              <Icon className="verotrade-nav-icon" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="verotrade-sidebar-footer">
          <div className="verotrade-user-area">
            <div className="verotrade-user-avatar">U</div>
            <div className="verotrade-user-info">
              <div className="verotrade-user-name">User</div>
              <div className="verotrade-user-role">Trader</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
