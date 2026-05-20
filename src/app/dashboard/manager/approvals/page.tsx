import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ClipboardCheck } from "lucide-react";

export default async function ApprovalsPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'manager') redirect('/dashboard');

  const requests = [
    { trainee: 'David Kim', training: 'Advanced Working at Heights', date: 'Oct 20, 2026', cost: '$450', urgency: 'high' },
    { trainee: 'Emily Chen', training: 'Electrical Safety Refresher', date: 'Oct 22, 2026', cost: '$0 (Internal)', urgency: 'medium' },
    { trainee: 'Mark Johnson', training: 'Leadership in Safety', date: 'Nov 01, 2026', cost: '$1,200', urgency: 'low' },
    { trainee: 'Lisa Wang', training: 'Hazmat Level 3 Certification', date: 'Nov 05, 2026', cost: '$800', urgency: 'high' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Pending Approvals</h1>
        <p className="text-gray-500 dark:text-gray-400">Review and approve training requests from your team members.</p>
      </div>
      <div className="space-y-4">
        {requests.map((req, i) => (
          <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border border-border rounded-xl bg-card shadow-sm hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-sm">{req.trainee}</p>
                <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${
                  req.urgency === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                  req.urgency === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                }`}>{req.urgency}</span>
              </div>
              <p className="font-bold text-primary">{req.training}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span>📅 {req.date}</span>
                <span>💰 {req.cost}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
              <button className="flex-1 sm:flex-none bg-white dark:bg-transparent border border-border text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 px-6 py-2 rounded-md shadow-sm text-sm font-medium transition-colors">Reject</button>
              <button className="flex-1 sm:flex-none bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-md shadow-sm text-sm font-medium transition-colors">Approve</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
