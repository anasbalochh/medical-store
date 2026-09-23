import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, put, del } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import toast from 'react-hot-toast';
import { rs, fmtDate } from '@/lib/format';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

export default function Products() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data: products = [] } = useQuery({
    queryKey: ['products', q],
    queryFn: () => get<any[]>(`/products?q=${encodeURIComponent(q)}`),
  });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => get<any[]>('/categories') });

  const [form, setForm] = useState<any>({
    name: '', genericName: '', manufacturer: '', barcode: '',
    categoryId: '', unit: 'pcs', packSize: 1, taxable: false, taxRate: 17,
    minStock: 10, scheduleG: false,
  });

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', genericName: '', manufacturer: '', barcode: '', categoryId: '', unit: 'pcs', packSize: 1, taxable: false, taxRate: 17, minStock: 10, scheduleG: false });
    setOpen(true);
  };
  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ ...p, categoryId: p.categoryId ?? '' });
    setOpen(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form, packSize: Number(form.packSize), taxRate: Number(form.taxRate), minStock: Number(form.minStock), categoryId: form.categoryId || null };
      return editing ? put(`/products/${editing.id}`, payload) : post('/products', payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setOpen(false); toast.success('Saved'); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => del(`/products/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Removed'); },
  });

  return (
    <div className="p-8">
      <PageHeader
        title="Products"
        subtitle="Medicines and general items in your catalog"
        actions={<button className="btn-primary" onClick={openNew}><Plus size={16} /> New Product</button>}
      />

      <div className="card">
        <div className="p-4 border-b flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input className="input pl-10" placeholder="Search by name, generic, or barcode..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">Name</th>
                <th className="th">Category</th>
                <th className="th">Stock</th>
                <th className="th">Next Expiry</th>
                <th className="th">Price</th>
                <th className="th">Tax</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="td">
                    <div className="font-medium">{p.name}</div>
                    {p.genericName && <div className="text-xs text-slate-500">{p.genericName}</div>}
                  </td>
                  <td className="td">{p.category?.name ?? '-'}</td>
                  <td className="td">
                    <span className={`badge ${p.stock <= p.minStock ? 'bg-red-100 text-red-700' : 'bg-brand-100 text-brand-700'}`}>
                      {p.stock} {p.unit}
                    </span>
                  </td>
                  <td className="td text-xs">{fmtDate(p.nextExpiry)}</td>
                  <td className="td">{p.batches[0] ? rs(p.batches[0].salePrice) : '-'}</td>
                  <td className="td">{p.taxable ? `${p.taxRate}%` : '—'}</td>
                  <td className="td text-right">
                    <button className="text-brand-600 hover:text-brand-800 p-1" onClick={() => openEdit(p)}><Pencil size={16} /></button>
                    <button className="text-red-600 hover:text-red-800 p-1 ml-2" onClick={() => confirm('Deactivate this product?') && remove.mutate(p.id)}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && <tr><td colSpan={7} className="td text-center text-slate-500 py-8">No products yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Product' : 'New Product'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Name*</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Generic Name</label><input className="input" value={form.genericName || ''} onChange={(e) => setForm({ ...form, genericName: e.target.value })} /></div>
          <div><label className="label">Manufacturer</label><input className="input" value={form.manufacturer || ''} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} /></div>
          <div><label className="label">Barcode</label><input className="input" value={form.barcode || ''} onChange={(e) => setForm({ ...form, barcode: e.target.value })} /></div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">-- None --</option>
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><label className="label">Unit</label><input className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
          <div><label className="label">Pack Size</label><input type="number" className="input" value={form.packSize} onChange={(e) => setForm({ ...form, packSize: e.target.value })} /></div>
          <div><label className="label">Min Stock Alert</label><input type="number" className="input" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} /></div>
          <div className="flex items-center gap-2 mt-6">
            <input type="checkbox" id="tax" checked={form.taxable} onChange={(e) => setForm({ ...form, taxable: e.target.checked })} />
            <label htmlFor="tax">Taxable</label>
          </div>
          <div><label className="label">Tax Rate %</label><input type="number" className="input" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} disabled={!form.taxable} /></div>
          <div className="flex items-center gap-2 mt-6">
            <input type="checkbox" id="sg" checked={form.scheduleG} onChange={(e) => setForm({ ...form, scheduleG: e.target.checked })} />
            <label htmlFor="sg">Schedule G (controlled drug)</label>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? 'Saving...' : 'Save'}</button>
        </div>
      </Modal>
    </div>
  );
}
