import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { useParams, useNavigate } from 'react-router-dom';
import { rs, fmtDateTime } from '@/lib/format';
import { Printer, ArrowLeft } from 'lucide-react';

export default function Receipt() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: sale } = useQuery({ queryKey: ['sale', id], queryFn: () => get<any>(`/sales/${id}`), enabled: !!id });
  const { data: store } = useQuery({ queryKey: ['store'], queryFn: () => get<any>('/settings/store') });

  if (!sale) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between mb-4 print:hidden">
          <button className="btn-outline" onClick={() => nav('/pos')}><ArrowLeft size={16} /> New Sale</button>
          <button className="btn-primary" onClick={() => window.print()}><Printer size={16} /> Print</button>
        </div>

        <div className="bg-white p-6 shadow-lg font-mono text-sm print:shadow-none print:p-2" id="receipt">
          <div className="text-center border-b pb-3 mb-3">
            <h1 className="text-xl font-bold">{store?.name ?? 'Medical Store'}</h1>
            <div className="text-xs">{store?.address}</div>
            <div className="text-xs">Ph: {store?.phone} · NTN: {store?.ntn}</div>
          </div>
          <div className="mb-3">
            <div className="flex justify-between"><span>Invoice:</span><b>{sale.invoiceNo}</b></div>
            <div className="flex justify-between"><span>Date:</span><span>{fmtDateTime(sale.date)}</span></div>
            <div className="flex justify-between"><span>Cashier:</span><span>{sale.cashier.name}</span></div>
            {sale.customer && <div className="flex justify-between"><span>Customer:</span><span>{sale.customer.name}</span></div>}
          </div>
          <table className="w-full text-xs mb-3">
            <thead className="border-y">
              <tr>
                <th className="text-left py-1">Item</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Price</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((i: any) => (
                <tr key={i.id}>
                  <td className="py-1">{i.batch.product.name}<div className="text-[10px] text-slate-500">B: {i.batch.batchNo}</div></td>
                  <td className="text-right">{i.quantity}</td>
                  <td className="text-right">{rs(i.price)}</td>
                  <td className="text-right">{rs(i.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t pt-2 space-y-1">
            <div className="flex justify-between"><span>Subtotal</span><span>{rs(sale.subtotal)}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>{rs(sale.tax)}</span></div>
            <div className="flex justify-between"><span>Discount</span><span>{rs(sale.discount)}</span></div>
            <div className="flex justify-between font-bold text-base border-t pt-1"><span>Total</span><span>{rs(sale.total)}</span></div>
            <div className="flex justify-between"><span>Paid ({sale.paymentMode})</span><span>{rs(sale.paid)}</span></div>
            {Number(sale.total) !== Number(sale.paid) && (
              <div className="flex justify-between text-red-600"><span>Balance</span><span>{rs(Number(sale.total) - Number(sale.paid))}</span></div>
            )}
          </div>
          <div className="text-center text-xs mt-4 border-t pt-3">
            {store?.receiptFooter ?? 'Thank you.'}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:p-2 { padding: 0.5rem !important; }
        }
      `}</style>
    </div>
  );
}
