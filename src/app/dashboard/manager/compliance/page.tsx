import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ShieldAlert, CheckCircle2, XCircle } from "lucide-react";

export default async function TeamCompliancePage() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'manager') redirect('/dashboard');

  const teamMembers = [
    { name: "David Kim", position: "Field Operator", trainings: 5, completed: 5, status: "compliant" },
    { name: "Emily Chen", position: "Lab Technician", trainings: 4, completed: 4, status: "compliant" },
    { name: "Mark Johnson", position: "Supervisor", trainings: 6, completed: 5, status: "non-compliant" },
    { name: "Lisa Wang", position: "Safety Officer", trainings: 8, completed: 8, status: "compliant" },
    { name: "James Lee", position: "Heavy Equipment Operator", trainings: 5, completed: 3, status: "non-compliant" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Team Compliance</h1>
        <p className="text-gray-500 dark:text-gray-400">Monitor training compliance status for all your team members.</p>
      </div>
      <div className="p-6 border border-border rounded-xl bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 uppercase border-b border-border">
              <tr>
                <th className="px-6 py-3 font-medium">Member</th>
                <th className="px-6 py-3 font-medium">Position</th>
                <th className="px-6 py-3 font-medium">Required</th>
                <th className="px-6 py-3 font-medium">Completed</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((m, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">{m.name.charAt(0)}</div>
                    {m.name}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{m.position}</td>
                  <td className="px-6 py-4">{m.trainings}</td>
                  <td className="px-6 py-4">{m.completed}</td>
                  <td className="px-6 py-4">
                    {m.status === 'compliant' ? (
                      <span className="flex items-center gap-1 text-green-600 text-xs font-semibold"><CheckCircle2 className="h-3.5 w-3.5" /> Compliant</span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600 text-xs font-semibold"><XCircle className="h-3.5 w-3.5" /> Non-Compliant</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
