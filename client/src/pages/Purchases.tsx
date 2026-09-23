import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import toast from 'react-hot-toast';
import { rs, fmtDate } from '@/lib/format';
import { Plus, Trash2 } from 'lucide-react';

interface Line { productId: string; batchNo: string; expiry: string; quantity: number; costPrice: number; salePrice: number; }

export default function Purchases() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [tax, setTax] = useState(0);
  const [paid, setPaid] = useState(0);
  const [lines, setLines] = useState<Line[]>([]);

  const { data: rows = [] } = useQuery({ queryKey: ['purchases'], queryFn: () => get<any[]>('/purchases') });
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: () => get<any[]>('/suppliers') });
  const { data: products = [] } = useQuery({ queryKey: ['products-all'], queryFn: () => get<any[]>('/products') });

  const addLine = () => setLines([...lines, { productId: '', batchNo: '', expiry: '', quantity: 1, costPrice: 0, salePrice: 0 }]);
  const removeLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i));
  const update = (i: number, patch: Partial<Line>) => setLines(lines.map((l, idx) => idx === i ? { ...l, ...patch } : l));

  const subtotal = lines.reduce((s, l) => s + l.costPrice * l.quantity, 0);
  const total = subtotal + tax;

  const save = useMutation({
    mutationFn: () => post('/purchases', {
      supplierId, invoiceNo, tax, paid, items: lines.map(l => ({
        ...l, quantity: Number(l.quantity), costPrice: Number(l.costPrice), salePrice: Number(l.salePrice),
      })),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchases'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      setOpen(false); setLines([]); setInvoiceNo(''); setSupplierId(''); setTax(0); setPaid(0);
      toast.success('Purchase recorded');
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="p-8">
      <PageHeader title="Purchases" subtitle="Record supplier invoices and stock-in batches" actions={
        <button className="btn-primary" onClick={() => { setOpen(true); setLines([{ productId: '', batchNo: '', expiry: '', quantity: 1, costPrice: 0, salePrice: 0 }]); }}>
          <Plus size={16} /> New Purchase
        </button>
      } />

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead><tr>
            <th className="th">Date</th><th className="th">Invoice #</th><th className="th">Supplier</th>
            <th className="th">Items</th><th className="th">Total</th><th className="th">Paid</th><th className="th">Balance</th>
          </tr></thead>
          <tbody>
            {rows.map((p: any) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="td">{fmtDate(p.date)}</td>
                <td className="td font-medium">{p.invoiceNo}</td>
                <td className="td">{p.supplier.name}</td>
                <td className="td">{p.items.length}</td>
                <td className="td">{rs(p.total)}</td>
                <td className="td">{rs(p.paid)}</td>
                <td className="td text-red-600">{rs(Number(p.total) - Number(p.paid))}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="td text-center text-slate-500 py-8">No purchases yet</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New Purchase" size="xl">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label className="label">Supplier*</label>
            <select className="input" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="">-- Select --</option>
              {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div><label className="label">Invoice No*</label><input className="input" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} /></div>
          <div><label className="label">Tax</label><input type="number" className="input" value={tax} onChange={(e) => setTax(Number(e.target.value))} /></div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr>
              <th className="th">Product</th><th className="th">Batch #</th><th className="th">Expiry</th>
              <th className="th">Qty</th><th className="th">Cost</th><th className="th">Sale</th><th className="th"></th>
            </tr></thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i}>
                  <td className="td">
                    <select className="input" value={l.productId} onChange={(e) => update(i, { productId: e.target.value })}>
                      <option value="">--</option>
                      {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </td>
                  <td className="td"><input className="input" value={l.batchNo} onChange={(e) => update(i, { batchNo: e.target.value })} /></td>
                  <td className="td"><input type="date" className="input" value={l.expiry} onChange={(e) => update(i, { expiry: e.target.value })} /></td>
                  <td className="td"><input type="number" className="input" value={l.quantity} onChange={(e) => update(i, { quantity: Number(e.target.value) })} /></td>
                  <td className="td"><input type="number" step="0.01" className="input" value={l.costPrice} onChange={(e) => update(i, { costPrice: Number(e.target.value) })} /></td>
                  <td className="td"><input type="number" step="0.01" className="input" value={l.salePrice} onChange={(e) => update(i, { salePrice: Number(e.target.value) })} /></td>
                  <td className="td"><button className="text-red-600" onClick={() => removeLine(i)}><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="btn-outline mt-2" onClick={addLine}><Plus size={14} /> Add line</button>

        <div className="mt-4 flex justify-between items-end">
          <div>
            <label className="label">Amount Paid Now</label>
            <input type="number" className="input" value={paid} onChange={(e) => setPaid(Number(e.target.value))} />
          </div>
          <div className="text-right space-y-1">
            <div>Subtotal: <b>{rs(subtotal)}</b></div>
            <div>Tax: <b>{rs(tax)}</b></div>
            <div className="text-lg">Total: <b className="text-brand-700">{rs(total)}</b></div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={() => save.mutate()} disabled={!supplierId || !invoiceNo || lines.length === 0}>Save Purchase</button>
        </div>
      </Modal>
    </div>
  );
}
