'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, Users, BookOpen, FileCheck, 
  Award, ShieldAlert, FileBarChart, Settings, 
  Briefcase, ClipboardCheck, Globe
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
          { name: 'Global Overview', href: '/dashboard/super-admin', icon: LayoutDashboard },
          { name: 'Jobsites', href: '/dashboard/super-admin/jobsites', icon: Briefcase },
          { name: 'All Users', href: '/dashboard/super-admin/users', icon: Users },
          { name: 'Compliance Matrix', href: '/dashboard/super-admin/compliance', icon: ShieldAlert },
          { name: 'Audit Logs', href: '/dashboard/super-admin/audit', icon: FileCheck },
          { name: 'Landing Page', href: '/dashboard/super-admin/landing', icon: Globe },
          { name: 'Settings', href: '/dashboard/super-admin/settings', icon: Settings },
        ];
      case 'site-admin':
        return [
          { name: 'Site Dashboard', href: '/dashboard/site-admin', icon: LayoutDashboard },
          { name: 'Employees', href: '/dashboard/site-admin/users', icon: Users },
          { name: 'Trainings', href: '/dashboard/site-admin/trainings', icon: BookOpen },
          { name: 'Certificates', href: '/dashboard/site-admin/certificates', icon: Award },
          { name: 'Reports', href: '/dashboard/site-admin/reports', icon: FileBarChart },
        ];
      case 'manager':
        return [
          { name: 'Team Dashboard', href: '/dashboard/manager', icon: LayoutDashboard },
          { name: 'Pending Approvals', href: '/dashboard/manager/approvals', icon: ClipboardCheck },
          { name: 'Team Compliance', href: '/dashboard/manager/compliance', icon: ShieldAlert },
        ];
      case 'trainer':
        return [
          { name: 'Trainer Dashboard', href: '/dashboard/trainer', icon: LayoutDashboard },
          { name: 'My Classes', href: '/dashboard/trainer/classes', icon: BookOpen },
          { name: 'Attendance', href: '/dashboard/trainer/attendance', icon: Users },
          { name: 'Question Bank', href: '/dashboard/trainer/questions', icon: FileCheck },
        ];
      case 'trainee':
        return [
          { name: 'My Learning', href: '/dashboard/trainee', icon: LayoutDashboard },
          { name: 'Training Passport', href: '/dashboard/trainee/passport', icon: Briefcase },
          { name: 'My Certificates', href: '/dashboard/trainee/certificates', icon: Award },
        ];
      // Map old roles for fallback
      case 'admin':
        return [
          { name: 'Global Overview', href: '/dashboard/super-admin', icon: LayoutDashboard },
          { name: 'Settings', href: '/dashboard/admin', icon: Settings },
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
          <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">PST</span>
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
