'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search, User, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getNavigationLinks } from "./navigation-links";

interface HeaderProps {
  role: string;
  name?: string;
}

export function EnterpriseHeader({ role, name }: HeaderProps) {
  const pathname = usePathname();
  const links = getNavigationLinks(role);
  const notificationHref = role === 'manager'
    ? '/dashboard/manager/approvals'
    : role === 'super-admin'
      ? '/dashboard/super-admin/audit'
      : '/dashboard';

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
    <>
      <header className="h-14 border-b border-border bg-background/95 backdrop-blur flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center flex-1 gap-2">
          <a
            href="#mobile-dashboard-menu"
            role="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-gray-700 shadow-sm transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/40 md:hidden"
            aria-label="Buka menu"
            aria-controls="mobile-dashboard-menu"
          >
            <Menu className="h-5 w-5" />
          </a>
          <form action="/dashboard/search" className="relative w-full max-w-md hidden sm:flex items-center">
            <Search className="absolute left-2.5 h-4 w-4 text-gray-500" />
            <input 
              type="search" 
              name="q"
              placeholder="Cari pelatihan, pengguna, sertifikat..." 
              className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-4 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
          </form>
        </div>
        <div className="flex items-center gap-4">
          <Link href={notificationHref} prefetch={false} className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full dark:hover:bg-gray-800 transition-colors" aria-label="Notifikasi">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500"></span>
          </Link>
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
      <div
        id="mobile-dashboard-menu"
        className="fixed inset-0 z-50 hidden target:block md:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Menu navigasi"
      >
        <a
          href="#"
          className="absolute inset-0 h-full w-full bg-black/40"
          aria-label="Tutup menu"
        />
        <aside
          className="relative flex h-full w-[min(21rem,86vw)] flex-col border-r border-border bg-card shadow-2xl"
        >
          <div className="h-14 flex items-center justify-between gap-3 px-4 border-b border-border bg-background">
            <div className="flex min-w-0 items-center gap-2">
              <div className="h-8 w-8 shrink-0 overflow-hidden rounded-md border border-border bg-white shadow-sm">
                <img src="/brand/pst-logo.png" alt="PST" className="h-full w-full object-contain" />
              </div>
              <span className="truncate font-bold text-[15px] leading-tight tracking-tight">
                PST Learning Management
              </span>
            </div>
            <a
              href="#"
              role="button"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/40"
              aria-label="Tutup menu"
            >
              <X className="h-5 w-5" />
            </a>
          </div>
          <div className="border-b border-border px-4 py-3">
            <div className="text-sm font-semibold text-gray-900">{name || 'Pengguna'}</div>
            <div className="mt-1 text-xs capitalize text-gray-500">{role.replace('-', ' ')}</div>
          </div>
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-3">
              Main Menu
            </div>
            {links.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  prefetch={false}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
      </div>
    </>
  );
}
