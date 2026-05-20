import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { BookOpen, Award, CheckCircle2 } from "lucide-react";

export default async function TraineeDashboard() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'trainee') {
    redirect('/dashboard');
  }

  const certIdMock = "CERT-98234-2026";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">My Learning</h1>
          <p className="text-gray-500 dark:text-gray-400">Access your enrolled classes and download certificates.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="p-6 border border-border rounded-xl shadow-sm bg-card">
          <h3 className="font-semibold mb-4 text-xl flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary"/> Enrolled Trainings</h3>
          <div className="space-y-4">
            <div className="p-4 border border-border rounded-lg bg-background hover:border-gray-300 transition-colors">
              <h4 className="font-bold text-lg mb-1">Advanced Working at Heights</h4>
              <p className="text-xs text-primary font-medium mb-3">Trainer: Sarah Johnson</p>
              <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 mb-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
              <p className="text-xs text-gray-500 text-right">45% Completed</p>
              <button className="mt-4 w-full text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 font-medium transition-colors">Continue Learning</button>
            </div>
            
            <div className="p-4 border border-border rounded-lg bg-background hover:border-gray-300 transition-colors">
              <h4 className="font-bold text-lg mb-1">Hazardous Materials Handling</h4>
              <p className="text-xs text-primary font-medium mb-3">Trainer: External Vendor</p>
              <div className="flex items-center gap-2 mt-4 text-sm font-medium text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>Passed - {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border border-border rounded-xl shadow-sm bg-card h-fit">
          <h3 className="font-semibold mb-4 text-xl flex items-center gap-2"><Award className="h-5 w-5 text-amber-500"/> My Certificates</h3>
          <div className="space-y-3">
            <div className="p-4 border border-border rounded-lg bg-background flex flex-col gap-3 hover:border-gray-300 transition-colors">
              <div>
                <h4 className="font-bold text-md text-foreground">Hazardous Materials Handling</h4>
                <p className="text-xs text-gray-500 mt-1">Issued: {new Date().toLocaleDateString()}</p>
                <p className="text-xs text-gray-500">ID: {certIdMock}</p>
              </div>
              <a 
                href={`/api/certificate/${certIdMock}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-center w-full text-sm border border-primary text-primary px-4 py-2 rounded-md hover:bg-primary/10 font-medium transition-colors"
              >
                Download PDF Certificate
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
