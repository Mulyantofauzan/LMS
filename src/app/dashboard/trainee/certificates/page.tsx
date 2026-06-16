import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { CertificateCards } from '@/components/certificates/CertificateCards';
import { getPersonalCertificateCards } from '@/lib/certificate-data';

type SessionUser = {
  id?: string | number | null;
  role?: string | null;
};

export default async function TraineeCertificatesPage() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (user?.role !== 'trainee' || !user.id) redirect('/dashboard');

  const certs = await getPersonalCertificateCards(Number(user.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Sertifikat Saya</h1>
        <p className="text-gray-500 dark:text-gray-400">Unduh dan verifikasi sertifikat training Anda.</p>
      </div>

      <CertificateCards certs={certs} />
    </div>
  );
}
