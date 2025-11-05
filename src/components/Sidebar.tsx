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
      <button onClick={() => setOpen(true)} className="fixed top-4 left-4 z-50 p-2 rounded-full bg-white/10 text-white lg:hidden">
        <Menu className="w-5 h-5" />
      </button>

      {open && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setOpen(false)} />}

      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 glass border-r border-white/10 transform transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">Menu</h2>
          <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-white/10 lg:hidden">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        <nav className="p-4 space-y-2">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                ${pathname.startsWith(href) ? 'bg-white/10 text-primary' : 'text-white/80 hover:bg-white/10'}
              `}
              onClick={() => setOpen(false)}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-red-400 hover:bg-red-500/10">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </nav>
      </aside>
    </>
  );
}
