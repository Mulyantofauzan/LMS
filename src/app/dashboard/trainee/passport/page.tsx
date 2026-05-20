import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Briefcase, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

export default async function TrainingPassportPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'trainee') redirect('/dashboard');

  const passport = [
    { training: "Basic Safety Induction", status: "completed", date: "Jan 15, 2026", expiry: "Jan 15, 2027", score: "92%" },
    { training: "Working at Heights — Level 1", status: "completed", date: "Feb 20, 2026", expiry: "Feb 20, 2027", score: "88%" },
    { training: "Hazardous Materials Handling", status: "completed", date: "Mar 10, 2026", expiry: "Mar 10, 2027", score: "95%" },
    { training: "First Aid & CPR", status: "in-progress", date: "In Progress", expiry: "—", score: "—" },
    { training: "Electrical Safety", status: "required", date: "Not Started", expiry: "—", score: "—" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Training Passport</h1>
        <p className="text-gray-500 dark:text-gray-400">Your complete training history and qualification records.</p>
      </div>

      <div className="p-6 border border-border rounded-xl bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 uppercase border-b border-border">
              <tr>
                <th className="px-6 py-3 font-medium">Training</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Expiry</th>
                <th className="px-6 py-3 font-medium">Score</th>
              </tr>
            </thead>
            <tbody>
              {passport.map((p, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{p.training}</td>
                  <td className="px-6 py-4">
                    {p.status === 'completed' ? (
                      <span className="flex items-center gap-1 text-green-600 text-xs font-semibold"><CheckCircle2 className="h-3.5 w-3.5" /> Completed</span>
                    ) : p.status === 'in-progress' ? (
                      <span className="flex items-center gap-1 text-blue-600 text-xs font-semibold"><Clock className="h-3.5 w-3.5" /> In Progress</span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600 text-xs font-semibold"><AlertTriangle className="h-3.5 w-3.5" /> Required</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{p.date}</td>
                  <td className="px-6 py-4 text-gray-500">{p.expiry}</td>
                  <td className="px-6 py-4 font-medium">{p.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
