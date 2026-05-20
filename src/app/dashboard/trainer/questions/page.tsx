import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { FileCheck, Plus } from "lucide-react";

export default async function QuestionBankPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'trainer') redirect('/dashboard');

  const questions = [
    { training: "Basic Safety Induction", count: 25, types: "15 MCQ, 10 Essay" },
    { training: "Working at Heights", count: 20, types: "20 MCQ" },
    { training: "Hazmat Handling", count: 30, types: "20 MCQ, 10 Essay" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Question Bank</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage exam questions for your training programs.</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-sm hover:bg-primary/90 text-sm font-medium transition-colors flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Questions
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {questions.map((q, i) => (
          <div key={i} className="p-6 border border-border rounded-xl bg-card shadow-sm card-hover">
            <div className="flex items-start justify-between mb-3">
              <FileCheck className="h-8 w-8 text-primary" />
              <span className="text-[10px] uppercase tracking-wider font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{q.count} questions</span>
            </div>
            <h3 className="font-bold text-lg mb-1">{q.training}</h3>
            <p className="text-sm text-gray-500 mb-4">{q.types}</p>
            <div className="flex gap-2">
              <button className="flex-1 bg-background border border-border text-foreground px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Edit</button>
              <button className="flex-1 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">Preview</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
