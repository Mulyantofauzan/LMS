import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { importCertificatesForm, importUsersForm } from "./actions";
import { ImportUploadForm } from "./import-upload-form";

export default async function ImportDataPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== 'super-admin' && role !== 'admin') redirect('/dashboard');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Impor Data</h1>
        <p className="text-gray-500 dark:text-gray-400">Upload CSV atau Excel untuk karyawan, sertifikasi, dan akun.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ImportUploadForm
          title="Karyawan"
          description="Kolom: nrp, name, email, role, jobsiteId, department, position."
          action={importUsersForm}
          templateType="employees"
          defaultPassword
        />
        <ImportUploadForm
          title="Sertifikasi"
          description="Kolom: userEmail, trainingTitle, certNumber, issueDate, expiryDate, url."
          action={importCertificatesForm}
          templateType="certifications"
        />
        <ImportUploadForm
          title="Akun"
          description="Kolom: nrp, name, email, role, jobsiteId, department, position, password."
          action={importUsersForm}
          templateType="accounts"
          defaultPassword
        />
      </div>
    </div>
  );
}
