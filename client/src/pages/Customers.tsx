import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, put, del } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import toast from 'react-hot-toast';
import { rs, fmtDate } from '@/lib/format';
import { Plus, Pencil, Trash2, Wallet } from 'lucide-react';

export default function Customers() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [form, setForm] = useState<any>({ name: '', phone: '', cnic: '', address: '' });
  const [payAmt, setPayAmt] = useState<number>(0);

  const { data = [] } = useQuery({ queryKey: ['customers'], queryFn: () => get<any[]>('/customers') });

  const save = useMutation({
    mutationFn: () => editing ? put(`/customers/${editing.id}`, form) : post('/customers', form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); setOpen(false); toast.success('Saved'); },
    onError: (e: any) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => del(`/customers/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); toast.success('Removed'); },
    onError: (e: any) => toast.error(e.message),
  });
  const pay = useMutation({
    mutationFn: () => post(`/customers/${detail.id}/payment`, { amount: Number(payAmt) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); setPayOpen(false); toast.success('Payment recorded'); },
    onError: (e: any) => toast.error(e.message),
  });

  const showLedger = async (c: any) => {
    const full = await get<any>(`/customers/${c.id}`);
    setDetail(full);
  };

  return (
    <div className="p-8">
      <PageHeader title="Customers" subtitle="Manage buyers and their credit ledger (khata)" actions={
        <button className="btn-primary" onClick={() => { setEditing(null); setForm({ name: '', phone: '', cnic: '', address: '' }); setOpen(true); }}>
          <Plus size={16} /> New Customer
        </button>
      } />

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead><tr>
            <th className="th">Name</th><th className="th">Phone</th><th className="th">CNIC</th>
            <th className="th">Balance</th><th className="th text-right">Actions</th>
          </tr></thead>
          <tbody>
            {data.map((c: any) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="td font-medium">
                  <button className="text-brand-700 hover:underline" onClick={() => showLedger(c)}>{c.name}</button>
                </td>
                <td className="td">{c.phone || '-'}</td>
                <td className="td">{c.cnic || '-'}</td>
                <td className="td">
                  <span className={Number(c.balance) > 0 ? 'text-red-600 font-medium' : 'text-slate-600'}>{rs(c.balance)}</span>
                </td>
                <td className="td text-right">
                  <button className="text-brand-600 p-1" onClick={() => { setEditing(c); setForm(c); setOpen(true); }}><Pencil size={16} /></button>
                  <button className="text-red-600 p-1 ml-2" onClick={() => confirm('Delete?') && remove.mutate(c.id)}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Customer' : 'New Customer'}>
        <div className="space-y-3">
          <div><label className="label">Name*</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className="label">CNIC</label><input className="input" value={form.cnic || ''} onChange={(e) => setForm({ ...form, cnic: e.target.value })} /></div>
          <div><label className="label">Address</label><textarea className="input" rows={2} value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={() => save.mutate()}>Save</button>
        </div>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name ?? ''} size="lg">
        {detail && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="card p-3"><div className="text-xs text-slate-500">Balance</div><div className="text-lg font-bold">{rs(detail.balance)}</div></div>
              <div className="card p-3"><div className="text-xs text-slate-500">Phone</div><div>{detail.phone || '-'}</div></div>
              <div className="card p-3">
                <button className="btn-primary w-full justify-center" onClick={() => { setPayAmt(Number(detail.balance)); setPayOpen(true); }}>
                  <Wallet size={16} /> Record Payment
                </button>
              </div>
            </div>
            <h3 className="font-semibold mb-2">Ledger</h3>
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full">
                <thead><tr><th className="th">Date</th><th className="th">Type</th><th className="th">Debit</th><th className="th">Credit</th><th className="th">Notes</th></tr></thead>
                <tbody>
                  {detail.ledgerEntries.map((l: any) => (
                    <tr key={l.id}><td className="td text-xs">{fmtDate(l.date)}</td><td className="td">{l.type}</td><td className="td">{rs(l.debit)}</td><td className="td">{rs(l.credit)}</td><td className="td text-xs">{l.notes}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Modal>

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Record Payment" size="sm">
        <div><label className="label">Amount (Rs.)</label><input type="number" className="input" value={payAmt} onChange={(e) => setPayAmt(Number(e.target.value))} /></div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setPayOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={() => pay.mutate()}>Record</button>
        </div>
      </Modal>
    </div>
  );
}
