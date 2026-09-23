import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import { rs, fmtDate, daysUntil } from '@/lib/format';
import { TrendingUp, ShoppingBag, Package, Users, AlertTriangle, Clock } from 'lucide-react';

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => get<any>('/reports/dashboard'),
  });

  if (isLoading) return <div className="p-8">Loading...</div>;

  const kpis = [
    { label: "Today's Sales", value: rs(data.today.revenue), sub: `${data.today.count} invoices`, icon: TrendingUp, color: 'bg-brand-100 text-brand-700' },
    { label: 'This Month', value: rs(data.month.revenue), sub: `${data.month.count} invoices`, icon: ShoppingBag, color: 'bg-blue-100 text-blue-700' },
    { label: 'Products', value: data.productCount, sub: 'active items', icon: Package, color: 'bg-purple-100 text-purple-700' },
    { label: 'Customers', value: data.customerCount, sub: 'total customers', icon: Users, color: 'bg-amber-100 text-amber-700' },
  ];

  return (
    <div className="p-8">
      <PageHeader title="Dashboard" subtitle="Overview of your store today" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="card p-4 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${k.color}`}><k.icon size={24} /></div>
            <div>
              <div className="text-sm text-slate-500">{k.label}</div>
              <div className="text-2xl font-bold">{k.value}</div>
              <div className="text-xs text-slate-400">{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="p-4 border-b flex items-center gap-2">
            <AlertTriangle className="text-orange-500" size={18} />
            <h2 className="font-semibold">Low Stock Alerts</h2>
          </div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {data.lowStock.length === 0 && <div className="p-4 text-sm text-slate-500">All good — nothing low.</div>}
            {data.lowStock.map((p: any) => (
              <div key={p.id} className="p-3 flex justify-between items-center">
                <div>
                  <div className="font-medium text-sm">{p.name}</div>
                  <div className="text-xs text-slate-500">Min: {p.minStock}</div>
                </div>
                <span className="badge bg-red-100 text-red-700">{p.stock} left</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="p-4 border-b flex items-center gap-2">
            <Clock className="text-amber-500" size={18} />
            <h2 className="font-semibold">Expiring within 90 days</h2>
          </div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {data.expiringSoon.length === 0 && <div className="p-4 text-sm text-slate-500">No expiring batches.</div>}
            {data.expiringSoon.map((b: any) => {
              const days = daysUntil(b.expiry);
              return (
                <div key={b.id} className="p-3 flex justify-between items-center">
                  <div>
                    <div className="font-medium text-sm">{b.product.name}</div>
                    <div className="text-xs text-slate-500">Batch {b.batchNo} · {b.quantity} pcs</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">{fmtDate(b.expiry)}</div>
                    <span className={`badge ${days < 30 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{days}d</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
