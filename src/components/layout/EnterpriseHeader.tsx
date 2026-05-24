'use client';

import { Bell, Search, User, LogOut } from "lucide-react";

interface HeaderProps {
  role: string;
  name?: string;
}

export function EnterpriseHeader({ role, name }: HeaderProps) {
  const handleLogout = async () => {
    // Use fetch to call the signout endpoint directly, then redirect
    await fetch('/api/auth/signout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csrfToken: '' }),
    });
    window.location.href = '/login';
  };

  return (
    <header className="h-14 border-b border-border bg-background/95 backdrop-blur flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center flex-1">
        <div className="relative w-full max-w-md hidden sm:flex items-center">
          <Search className="absolute left-2.5 h-4 w-4 text-gray-500" />
          <input 
            type="search" 
            placeholder="Cari pelatihan, pengguna, sertifikat..." 
            className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-4 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full dark:hover:bg-gray-800 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500"></span>
        </button>
        <div className="flex items-center gap-2 border-l border-border pl-4 ml-2">
          <div className="hidden md:flex flex-col items-end mr-1">
            <span className="text-sm font-medium leading-none">{name || 'Pengguna'}</span>
            <span className="text-xs text-gray-500 capitalize leading-none mt-1">{role.replace('-', ' ')}</span>
          </div>
          <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden">
            {name ? name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 px-3 py-1.5 rounded-md transition-colors ml-1"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
}
