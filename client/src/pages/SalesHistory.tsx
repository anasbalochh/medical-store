import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { rs, fmtDateTime } from '@/lib/format';

export default function SalesHistory() {
  const { data = [] } = useQuery({ queryKey: ['sales'], queryFn: () => get<any[]>('/sales') });

  return (
    <div className="p-8">
      <PageHeader title="Sales History" subtitle="All completed invoices" />
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead><tr>
            <th className="th">Date</th><th className="th">Invoice</th><th className="th">Customer</th>
            <th className="th">Cashier</th><th className="th">Items</th><th className="th">Total</th><th className="th">Paid</th>
            <th className="th text-right">Actions</th>
          </tr></thead>
          <tbody>
            {data.map((s: any) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="td">{fmtDateTime(s.date)}</td>
                <td className="td font-medium">{s.invoiceNo}</td>
                <td className="td">{s.customer?.name ?? 'Walk-in'}</td>
                <td className="td">{s.cashier.name}</td>
                <td className="td">{s.items.length}</td>
                <td className="td">{rs(s.total)}</td>
                <td className="td">{rs(s.paid)}</td>
                <td className="td text-right">
                  <Link className="text-brand-600 hover:underline text-sm" to={`/receipt/${s.id}`}>View</Link>
                </td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={8} className="td text-center text-slate-500 py-8">No sales yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
