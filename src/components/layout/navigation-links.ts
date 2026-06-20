import type { LucideIcon } from "lucide-react";
import {
  Award,
  BookOpen,
  Briefcase,
  ClipboardCheck,
  Database,
  FileBarChart,
  FileCheck,
  Globe,
  History,
  LayoutDashboard,
  Settings,
  ShieldAlert,
  Upload,
  Users,
} from "lucide-react";

export type NavigationLink = {
  name: string;
  href: string;
  icon: LucideIcon;
};

const personalLinks: NavigationLink[] = [
  { name: 'Paspor Saya', href: '/dashboard/passport', icon: Briefcase },
  { name: 'Sertifikat Saya', href: '/dashboard/certificates', icon: Award },
];

export function getNavigationLinks(role: string): NavigationLink[] {
  switch (role) {
    case 'super-admin':
      return [
        { name: 'Ringkasan Global', href: '/dashboard/super-admin', icon: LayoutDashboard },
        { name: 'Lokasi Kerja', href: '/dashboard/super-admin/jobsites', icon: Briefcase },
        { name: 'Semua Pengguna', href: '/dashboard/super-admin/users', icon: Users },
        { name: 'Master Data', href: '/dashboard/super-admin/master', icon: Database },
        { name: 'Sertifikasi Eksternal', href: '/dashboard/super-admin/external-certifications', icon: Award },
        { name: 'Training Need Analysis', href: '/dashboard/super-admin/tna', icon: ClipboardCheck },
        { name: 'Matriks Kepatuhan', href: '/dashboard/super-admin/compliance', icon: ShieldAlert },
        { name: 'Log Audit', href: '/dashboard/super-admin/audit', icon: FileCheck },
        { name: 'Halaman Utama', href: '/dashboard/super-admin/landing', icon: Globe },
        { name: 'Pengaturan', href: '/dashboard/super-admin/settings', icon: Settings },
        { name: 'Impor Data', href: '/dashboard/super-admin/import', icon: Upload },
        ...personalLinks,
      ];
    case 'site-admin':
      return [
        { name: 'Dasbor Lokasi', href: '/dashboard/site-admin', icon: LayoutDashboard },
        { name: 'Karyawan', href: '/dashboard/site-admin/users', icon: Users },
        { name: 'Pelatihan', href: '/dashboard/site-admin/trainings', icon: BookOpen },
        { name: 'Sertifikat', href: '/dashboard/site-admin/certificates', icon: Award },
        { name: 'Sertifikasi Eksternal', href: '/dashboard/site-admin/external-certificates', icon: Award },
        { name: 'TNA Site', href: '/dashboard/site-admin/tna', icon: ClipboardCheck },
        { name: 'Laporan', href: '/dashboard/site-admin/reports', icon: FileBarChart },
        ...personalLinks,
      ];
    case 'manager':
      return [
        { name: 'Dasbor Tim', href: '/dashboard/manager', icon: LayoutDashboard },
        { name: 'Menunggu Persetujuan', href: '/dashboard/manager/approvals', icon: ClipboardCheck },
        { name: 'Kepatuhan Tim', href: '/dashboard/manager/compliance', icon: ShieldAlert },
        ...personalLinks,
      ];
    case 'trainer':
      return [
        { name: 'Dasbor Pelatih', href: '/dashboard/trainer', icon: LayoutDashboard },
        { name: 'Kelas Saya', href: '/dashboard/trainer/classes', icon: BookOpen },
        { name: 'Kehadiran', href: '/dashboard/trainer/attendance', icon: Users },
        { name: 'Riwayat Training', href: '/dashboard/trainer/history', icon: History },
        { name: 'Bank Soal', href: '/dashboard/trainer/questions', icon: FileCheck },
        ...personalLinks,
      ];
    case 'trainee':
      return [
        { name: 'Pembelajaran Saya', href: '/dashboard/trainee', icon: LayoutDashboard },
        { name: 'Paspor Pelatihan', href: '/dashboard/passport', icon: Briefcase },
        { name: 'Sertifikat Saya', href: '/dashboard/certificates', icon: Award },
      ];
    case 'admin':
      return [
        { name: 'Ringkasan Global', href: '/dashboard/super-admin', icon: LayoutDashboard },
        { name: 'Monitoring Sertifikat', href: '/dashboard/site-admin/certificates', icon: Award },
        { name: 'Pengaturan', href: '/dashboard/admin', icon: Settings },
        ...personalLinks,
      ];
    default:
      return [];
  }
}
