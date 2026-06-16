import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { CertificateCards } from '@/components/certificates/CertificateCards';
import { getPersonalCertificateCards } from '@/lib/certificate-data';

type SessionUser = {
  id?: string | number | null;
};

export default async function MyCertificatesPage() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (!user?.id) redirect('/login');

  const certs = await getPersonalCertificateCards(Number(user.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Sertifikat Saya</h1>
        <p className="text-gray-500 dark:text-gray-400">Unduh dan cek masa berlaku sertifikat training Anda.</p>
      </div>

      <CertificateCards certs={certs} />
    </div>
  );
}
