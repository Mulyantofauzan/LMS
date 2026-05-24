'use client';

import { createTraining } from "./actions";
import { useTransition, useRef } from "react";

export default function TrainingForm() {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form 
      ref={formRef}
      action={(data) => startTransition(async () => {
        await createTraining(data);
        formRef.current?.reset();
      })} 
      className="space-y-4 mt-4"
    >
      <div>
        <label className="block text-sm font-medium mb-1">Judul Pelatihan</label>
        <input 
          type="text" 
          name="title" 
          required
          className="w-full rounded-md border border-border px-3 py-2 bg-background text-foreground text-sm focus:ring-1 focus:ring-primary outline-none"
          placeholder="Contoh: Safety Alat Berat"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Kategori</label>
        <select 
          name="category"
          className="w-full rounded-md border border-border px-3 py-2 bg-background text-foreground text-sm focus:ring-1 focus:ring-primary outline-none"
        >
          <option value="Safety">Safety</option>
          <option value="Compliance">Compliance</option>
          <option value="Technical">Technical</option>
          <option value="Leadership">Leadership</option>
          <option value="General">General</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Deskripsi</label>
        <textarea 
          name="description" 
          required
          rows={3}
          className="w-full rounded-md border border-border px-3 py-2 bg-background text-foreground text-sm focus:ring-1 focus:ring-primary outline-none"
          placeholder="Jelaskan materi dan tujuan pelatihan..."
        />
      </div>
      <button type="submit" disabled={isPending} className="w-full bg-primary text-primary-foreground px-4 py-2.5 rounded-md hover:bg-primary/90 font-medium disabled:opacity-50 text-sm transition-colors">
        {isPending ? 'Membuat...' : 'Buat Pelatihan'}
      </button>
    </form>
  );
}
