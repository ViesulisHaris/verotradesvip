'use client';

import { useState } from 'react';
import { Menu, X, Home, PlusCircle, Calendar, BarChart3, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Props {
  onLogout: () => void;
}

export default function Sidebar({ onLogout }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/log-trade', label: 'Log Trade', icon: PlusCircle },
    { href: '/calendar', label: 'Calendar', icon: Calendar },
    { href: '/strategies', label: 'Strategies', icon: BarChart3 },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 p-3 bg-black/50 rounded-xl lg:hidden"
      >
        <Menu className="w-6 h-6 text-white" />
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 glass border-r border-white/10 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">VeroTrade</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded hover:bg-white/10 lg:hidden"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${pathname === href ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-white/70 hover:bg-white/10 hover:text-white'}
              `}
              onClick={() => setIsOpen(false)}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          ))}
          
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-red-400 hover:bg-red-900/30 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>
    </>
  );
}
