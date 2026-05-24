import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Upload } from "lucide-react";
import { importJobsitesForm, importTrainingsForm, importUsersForm } from "./actions";

const textareaClass = "w-full min-h-32 rounded-md border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary";

export default async function ImportDataPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== 'super-admin' && role !== 'admin') redirect('/dashboard');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Impor Data</h1>
        <p className="text-gray-500 dark:text-gray-400">Tambahkan data awal dari CSV sederhana.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <form action={importJobsitesForm} className="border border-border rounded-xl bg-card p-6 shadow-sm space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><Upload className="h-4 w-4 text-primary" /> Lokasi Kerja</h2>
          <textarea name="csv" required className={textareaClass} placeholder={"Tambang Gamma,Sulawesi Selatan\nPabrik Delta,Jawa Timur"} />
          <button type="submit" className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90">Impor Lokasi</button>
        </form>

        <form action={importUsersForm} className="border border-border rounded-xl bg-card p-6 shadow-sm space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><Upload className="h-4 w-4 text-primary" /> Pengguna</h2>
          <textarea name="csv" required className={textareaClass} placeholder={"Nama,email@domain.com,trainee,1,Operations,Operator\nTrainer Baru,trainerbaru@domain.com,trainer,1,HSE,Trainer"} />
          <input name="defaultPassword" defaultValue="password123" minLength={6} className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm" />
          <button type="submit" className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90">Impor Pengguna</button>
        </form>

        <form action={importTrainingsForm} className="border border-border rounded-xl bg-card p-6 shadow-sm space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><Upload className="h-4 w-4 text-primary" /> Pelatihan</h2>
          <textarea name="csv" required className={textareaClass} placeholder={"Safety Induction,HSE,offline,1\nCyber Security Awareness,Compliance,online,1"} />
          <button type="submit" className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90">Impor Pelatihan</button>
        </form>
      </div>
    </div>
  );
}
