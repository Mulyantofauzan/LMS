'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getNavigationLinks } from "./navigation-links";

interface SidebarProps {
  role: string;
}

export function EnterpriseSidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const links = getNavigationLinks(role);

  return (
    <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col shadow-sm z-10">
      <div className="h-14 flex items-center px-4 border-b border-border bg-background">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 overflow-hidden rounded-md border border-border bg-white shadow-sm">
            <img src="/brand/pst-logo.png" alt="PST" className="h-full w-full object-contain" />
          </div>
          <span className="font-bold text-[15px] tracking-tight leading-tight">PST Learning Management</span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-3">Main Menu</div>
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link 
              key={link.name} 
              href={link.href}
              prefetch={false}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50"
              )}
            >
              <Icon className="h-4 w-4" />
              {link.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
