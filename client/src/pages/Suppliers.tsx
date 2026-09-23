import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, put, del } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import toast from 'react-hot-toast';
import { rs } from '@/lib/format';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function Suppliers() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({ name: '', phone: '', ntn: '', address: '' });

  const { data = [] } = useQuery({ queryKey: ['suppliers'], queryFn: () => get<any[]>('/suppliers') });

  const save = useMutation({
    mutationFn: () => editing ? put(`/suppliers/${editing.id}`, form) : post('/suppliers', form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); setOpen(false); toast.success('Saved'); },
    onError: (e: any) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => del(`/suppliers/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); toast.success('Removed'); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="p-8">
      <PageHeader title="Suppliers" actions={
        <button className="btn-primary" onClick={() => { setEditing(null); setForm({ name: '', phone: '', ntn: '', address: '' }); setOpen(true); }}>
          <Plus size={16} /> New Supplier
        </button>
      } />

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="th">Name</th><th className="th">Phone</th><th className="th">NTN</th>
              <th className="th">Balance Owed</th><th className="th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((s: any) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="td font-medium">{s.name}</td>
                <td className="td">{s.phone || '-'}</td>
                <td className="td">{s.ntn || '-'}</td>
                <td className="td">{rs(s.balance)}</td>
                <td className="td text-right">
                  <button className="text-brand-600 p-1" onClick={() => { setEditing(s); setForm(s); setOpen(true); }}><Pencil size={16} /></button>
                  <button className="text-red-600 p-1 ml-2" onClick={() => confirm('Delete?') && remove.mutate(s.id)}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Supplier' : 'New Supplier'}>
        <div className="space-y-3">
          <div><label className="label">Name*</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className="label">NTN</label><input className="input" value={form.ntn || ''} onChange={(e) => setForm({ ...form, ntn: e.target.value })} /></div>
          <div><label className="label">Address</label><textarea className="input" rows={2} value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={() => save.mutate()}>Save</button>
        </div>
      </Modal>
    </div>
  );
}
