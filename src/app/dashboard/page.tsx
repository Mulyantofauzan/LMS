import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardRoot() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  const role = (session.user as any).role;
  
  if (role === 'super-admin' || role === 'admin') {
    redirect('/dashboard/super-admin');
  } else if (role === 'site-admin') {
    redirect('/dashboard/site-admin');
  } else if (role === 'manager') {
    redirect('/dashboard/manager');
  } else if (role === 'trainer') {
    redirect('/dashboard/trainer');
  } else {
    redirect('/dashboard/trainee');
  }
}
