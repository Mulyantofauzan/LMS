'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, Users, BookOpen, FileCheck, 
  Award, ShieldAlert, FileBarChart, Settings, 
  Briefcase, ClipboardCheck, Globe, Upload, Database, History
} from "lucide-react";

interface SidebarProps {
  role: string;
}

export function EnterpriseSidebar({ role }: SidebarProps) {
  const pathname = usePathname();

    const getLinks = () => {
      switch(role) {
        case 'super-admin':
          return [
            { name: 'Ringkasan Global', href: '/dashboard/super-admin', icon: LayoutDashboard },
            { name: 'Lokasi Kerja', href: '/dashboard/super-admin/jobsites', icon: Briefcase },
            { name: 'Semua Pengguna', href: '/dashboard/super-admin/users', icon: Users },
            { name: 'Master Data', href: '/dashboard/super-admin/master', icon: Database },
            { name: 'Matriks Kepatuhan', href: '/dashboard/super-admin/compliance', icon: ShieldAlert },
            { name: 'Log Audit', href: '/dashboard/super-admin/audit', icon: FileCheck },
            { name: 'Halaman Utama', href: '/dashboard/super-admin/landing', icon: Globe },
            { name: 'Pengaturan', href: '/dashboard/super-admin/settings', icon: Settings },
            { name: 'Impor Data', href: '/dashboard/super-admin/import', icon: Upload },
          ];
        case 'site-admin':
          return [
            { name: 'Dasbor Lokasi', href: '/dashboard/site-admin', icon: LayoutDashboard },
            { name: 'Karyawan', href: '/dashboard/site-admin/users', icon: Users },
            { name: 'Pelatihan', href: '/dashboard/site-admin/trainings', icon: BookOpen },
            { name: 'Sertifikat', href: '/dashboard/site-admin/certificates', icon: Award },
            { name: 'Laporan', href: '/dashboard/site-admin/reports', icon: FileBarChart },
          ];
        case 'manager':
          return [
            { name: 'Dasbor Tim', href: '/dashboard/manager', icon: LayoutDashboard },
            { name: 'Menunggu Persetujuan', href: '/dashboard/manager/approvals', icon: ClipboardCheck },
            { name: 'Kepatuhan Tim', href: '/dashboard/manager/compliance', icon: ShieldAlert },
          ];
        case 'trainer':
          return [
            { name: 'Dasbor Pelatih', href: '/dashboard/trainer', icon: LayoutDashboard },
            { name: 'Kelas Saya', href: '/dashboard/trainer/classes', icon: BookOpen },
            { name: 'Kehadiran', href: '/dashboard/trainer/attendance', icon: Users },
            { name: 'Riwayat Training', href: '/dashboard/trainer/history', icon: History },
            { name: 'Bank Soal', href: '/dashboard/trainer/questions', icon: FileCheck },
          ];
        case 'trainee':
          return [
            { name: 'Pembelajaran Saya', href: '/dashboard/trainee', icon: LayoutDashboard },
            { name: 'Paspor Pelatihan', href: '/dashboard/trainee/passport', icon: Briefcase },
            { name: 'Sertifikat Saya', href: '/dashboard/trainee/certificates', icon: Award },
          ];
        // Map old roles for fallback
        case 'admin':
          return [
            { name: 'Ringkasan Global', href: '/dashboard/super-admin', icon: LayoutDashboard },
            { name: 'Pengaturan', href: '/dashboard/admin', icon: Settings },
          ];
        default:
          return [];
      }
    };

  const links = getLinks();

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
