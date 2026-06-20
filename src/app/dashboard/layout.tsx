import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { EnterpriseSidebar } from "@/components/layout/EnterpriseSidebar";
import { EnterpriseHeader } from "@/components/layout/EnterpriseHeader";
import { getSessionUser } from "@/lib/session-user";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || (session.user as typeof session.user & { isActive?: boolean }).isActive === false) {
    redirect('/login');
  }
  
  const role = getSessionUser(session.user)?.role || 'trainee';
  const name = session.user.name || 'User';

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <EnterpriseSidebar role={role} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <EnterpriseHeader role={role} name={name} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#fbfbfb] dark:bg-[#020817]">
          {children}
        </main>
      </div>
    </div>
  );
}
