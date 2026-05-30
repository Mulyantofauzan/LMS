import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/db";
import { trainings, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { normalizeCertificateTemplateConfig } from "@/lib/certificate-template";
import { CertificateTemplateEditor } from "./template-editor";

type SessionUser = {
  id?: string | number | null;
  role?: string | null;
};

export default async function CertificateTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  const role = user?.role;
  if (role !== 'site-admin' && role !== 'super-admin') redirect('/dashboard');

  const { id } = await params;
  const trainingId = Number(id);
  if (!trainingId) notFound();

  const training = await db.select({
    id: trainings.id,
    title: trainings.title,
    jobsiteId: trainings.jobsiteId,
    certificateTemplateUrl: trainings.certificateTemplateUrl,
    certificateTemplateConfig: trainings.certificateTemplateConfig,
  })
    .from(trainings)
    .where(eq(trainings.id, trainingId))
    .get();

  if (!training) notFound();

  if (role === 'site-admin') {
    const currentUser = await db.select({ jobsiteId: users.jobsiteId })
      .from(users)
      .where(eq(users.id, Number(user?.id)))
      .get();
    if (currentUser?.jobsiteId && training.jobsiteId !== currentUser.jobsiteId) {
      redirect('/dashboard/site-admin/trainings');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/dashboard/site-admin/trainings" className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Editor Template Sertifikat</h1>
          <p className="text-gray-500 dark:text-gray-400">{training.title}</p>
        </div>
      </div>

      <CertificateTemplateEditor
        trainingId={training.id}
        trainingTitle={training.title}
        templateUrl={training.certificateTemplateUrl}
        initialConfig={normalizeCertificateTemplateConfig(training.certificateTemplateConfig)}
      />
    </div>
  );
}
