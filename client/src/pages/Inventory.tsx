import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import { rs, fmtDate, daysUntil } from '@/lib/format';

export default function Inventory() {
  const [tab, setTab] = useState<'batches' | 'low' | 'expiring'>('batches');
  const { data: batches = [] } = useQuery({ queryKey: ['batches'], queryFn: () => get<any[]>('/inventory/batches'), enabled: tab === 'batches' });
  const { data: low = [] } = useQuery({ queryKey: ['low-stock'], queryFn: () => get<any[]>('/inventory/low-stock'), enabled: tab === 'low' });
  const { data: exp = [] } = useQuery({ queryKey: ['expiring'], queryFn: () => get<any[]>('/inventory/expiring?days=180'), enabled: tab === 'expiring' });

  return (
    <div className="p-8">
      <PageHeader title="Inventory" subtitle="Batch-level stock, expiry, and low-stock tracking" />

      <div className="flex gap-2 mb-4">
        {(['batches', 'low', 'expiring'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`btn ${tab === t ? 'bg-brand-600 text-white' : 'btn-outline'}`}>
            {t === 'batches' ? 'All Batches' : t === 'low' ? 'Low Stock' : 'Expiring'}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        {tab === 'batches' && (
          <table className="w-full">
            <thead><tr>
              <th className="th">Product</th><th className="th">Batch</th><th className="th">Expiry</th>
              <th className="th">Qty</th><th className="th">Cost</th><th className="th">Sale</th>
            </tr></thead>
            <tbody>
              {batches.map((b: any) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="td font-medium">{b.product.name}</td>
                  <td className="td">{b.batchNo}</td>
                  <td className="td">{fmtDate(b.expiry)} <span className="text-xs text-slate-500">({daysUntil(b.expiry)}d)</span></td>
                  <td className="td">{b.quantity}</td>
                  <td className="td">{rs(b.costPrice)}</td>
                  <td className="td">{rs(b.salePrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'low' && (
          <table className="w-full">
            <thead><tr><th className="th">Product</th><th className="th">Current</th><th className="th">Min</th></tr></thead>
            <tbody>
              {low.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="td font-medium">{p.name}</td>
                  <td className="td text-red-600 font-bold">{p.stock}</td>
                  <td className="td">{p.minStock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'expiring' && (
          <table className="w-full">
            <thead><tr>
              <th className="th">Product</th><th className="th">Batch</th><th className="th">Expiry</th><th className="th">Days Left</th><th className="th">Qty</th>
            </tr></thead>
            <tbody>
              {exp.map((b: any) => {
                const d = daysUntil(b.expiry);
                return (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="td font-medium">{b.product.name}</td>
                    <td className="td">{b.batchNo}</td>
                    <td className="td">{fmtDate(b.expiry)}</td>
                    <td className="td"><span className={`badge ${d < 0 ? 'bg-red-200 text-red-800' : d < 30 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{d}d</span></td>
                    <td className="td">{b.quantity}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
