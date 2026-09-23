import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import { rs } from '@/lib/format';

export default function Reports() {
  const { data: daily = [] } = useQuery({ queryKey: ['sales-daily'], queryFn: () => get<any[]>('/reports/sales-daily?days=30') });
  const { data: top = [] } = useQuery({ queryKey: ['top-products'], queryFn: () => get<any[]>('/reports/top-products?days=30') });
  const { data: profit } = useQuery({ queryKey: ['profit'], queryFn: () => get<any>('/reports/profit?days=30') });

  const max = Math.max(...daily.map((d: any) => d.total), 1);

  return (
    <div className="p-8">
      <PageHeader title="Reports" subtitle="Last 30 days performance" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-4"><div className="text-sm text-slate-500">Revenue (30d)</div><div className="text-2xl font-bold">{rs(profit?.revenue ?? 0)}</div></div>
        <div className="card p-4"><div className="text-sm text-slate-500">Cost of Goods Sold</div><div className="text-2xl font-bold">{rs(profit?.cost ?? 0)}</div></div>
        <div className="card p-4"><div className="text-sm text-slate-500">Gross Profit</div>
          <div className="text-2xl font-bold text-brand-700">{rs(profit?.profit ?? 0)}</div>
          <div className="text-xs text-slate-500">{profit ? profit.margin.toFixed(1) : 0}% margin</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-4">
          <h2 className="font-semibold mb-3">Daily Sales</h2>
          <div className="space-y-1">
            {daily.map((d: any) => (
              <div key={d.date} className="flex items-center gap-2">
                <div className="text-xs w-20">{d.date}</div>
                <div className="flex-1 bg-slate-100 h-6 rounded overflow-hidden">
                  <div className="h-full bg-brand-500" style={{ width: `${(d.total / max) * 100}%` }} />
                </div>
                <div className="text-xs w-24 text-right">{rs(d.total)}</div>
              </div>
            ))}
            {daily.length === 0 && <div className="text-slate-500 text-sm">No sales in this window.</div>}
          </div>
        </div>

        <div className="card p-4">
          <h2 className="font-semibold mb-3">Top Products</h2>
          <table className="w-full text-sm">
            <thead><tr><th className="th">Product</th><th className="th">Qty</th><th className="th">Revenue</th></tr></thead>
            <tbody>
              {top.map((r: any, i: number) => (
                <tr key={i}><td className="td">{r.name}</td><td className="td">{r.qty}</td><td className="td">{rs(r.revenue)}</td></tr>
              ))}
              {top.length === 0 && <tr><td colSpan={3} className="td text-center text-slate-500">No data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
