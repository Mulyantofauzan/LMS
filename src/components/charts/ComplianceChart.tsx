'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export type ComplianceChartRow = {
  name: string;
  compliance: number;
  missing: number;
};

export function ComplianceChart({ data }: { data: ComplianceChartRow[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-gray-500">
        Belum ada jobsite untuk dibandingkan.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} />
        <YAxis axisLine={false} tickLine={false} />
        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
        <Legend />
        <Bar dataKey="compliance" name="Terpenuhi (%)" stackId="a" fill="#0284c7" radius={[0, 0, 4, 4]} />
        <Bar dataKey="missing" name="Gap (%)" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
