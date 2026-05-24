import { auth } from "@/auth";
import { db } from "@/db";
import { masterDepartments, masterPositions } from "@/db/schema";
import { createMasterDataForm, deleteMasterDataForm, updateMasterDataForm } from "@/lib/actions/master-data-actions";
import { Database, Plus, Trash2 } from "lucide-react";
import { redirect } from "next/navigation";

function MasterCard({
  type,
  title,
  items,
}: {
  type: 'department' | 'position';
  title: string;
  items: { id: number; name: string; isActive: boolean }[];
}) {
  return (
    <section className="border border-border bg-card rounded-xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-border">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          {title}
        </h2>
      </div>
      <form action={createMasterDataForm} className="p-5 border-b border-border flex flex-col sm:flex-row gap-3">
        <input type="hidden" name="type" value={type} />
        <input name="name" required placeholder={`Tambah ${title.toLowerCase()}`} className="h-10 flex-1 px-3 rounded-md border border-border bg-background text-sm outline-none focus:ring-1 focus:ring-primary" />
        <button type="submit" className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Tambah
        </button>
      </form>
      <div className="divide-y divide-border">
        {items.map((item) => (
          <form key={item.id} action={updateMasterDataForm} className="p-4 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="id" value={item.id} />
            <input name="name" defaultValue={item.name} required className="h-10 px-3 rounded-md border border-border bg-background text-sm outline-none focus:ring-1 focus:ring-primary" />
            <label className="inline-flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" name="isActive" defaultChecked={item.isActive} className="h-4 w-4 rounded border-border" />
              Aktif
            </label>
            <div className="flex justify-end gap-2">
              <button type="submit" className="px-3 py-2 rounded-md border border-border text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800">
                Simpan
              </button>
              <button formAction={deleteMasterDataForm} type="submit" className="px-3 py-2 rounded-md border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </form>
        ))}
      </div>
    </section>
  );
}

export default async function MasterDataPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== 'super-admin' && role !== 'admin') redirect('/dashboard');

  const departments = await db.select().from(masterDepartments).orderBy(masterDepartments.name);
  const positions = await db.select().from(masterPositions).orderBy(masterPositions.name);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Master Data</h1>
        <p className="text-gray-500 dark:text-gray-400">Kelola pilihan departemen dan jabatan untuk data karyawan.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <MasterCard type="department" title="Departemen" items={departments} />
        <MasterCard type="position" title="Jabatan" items={positions} />
      </div>
    </div>
  );
}
