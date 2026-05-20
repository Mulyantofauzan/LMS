'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const data = [
  { name: 'Site A', compliance: 92, missing: 8 },
  { name: 'Site B', compliance: 78, missing: 22 },
  { name: 'Site C', compliance: 85, missing: 15 },
  { name: 'Site D', compliance: 98, missing: 2 },
  { name: 'Site E', compliance: 65, missing: 35 },
];

export function ComplianceChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} />
        <YAxis axisLine={false} tickLine={false} />
        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
        <Legend />
        <Bar dataKey="compliance" name="Compliant (%)" stackId="a" fill="#0284c7" radius={[0, 0, 4, 4]} />
        <Bar dataKey="missing" name="Non-Compliant (%)" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
