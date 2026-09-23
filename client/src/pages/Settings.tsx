import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, put, post } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import toast from 'react-hot-toast';
import { useAuth } from '@/store/auth';
import { Plus } from 'lucide-react';
import Modal from '@/components/Modal';

export default function SettingsPage() {
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const [form, setForm] = useState<any>({ name: '', address: '', phone: '', ntn: '', currency: 'PKR', gstRate: 17, receiptFooter: '' });
  const [userOpen, setUserOpen] = useState(false);
  const [uform, setUform] = useState<any>({ name: '', email: '', password: '', role: 'CASHIER' });

  const { data: store } = useQuery({ queryKey: ['store'], queryFn: () => get<any>('/settings/store') });
  const { data: users = [], refetch } = useQuery({
    queryKey: ['users'], queryFn: () => get<any[]>('/auth/users'), enabled: user?.role === 'OWNER',
  });

  useEffect(() => { if (store) setForm({ ...form, ...store }); /* eslint-disable-next-line */ }, [store]);

  const save = useMutation({
    mutationFn: () => put('/settings/store', { ...form, gstRate: Number(form.gstRate) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['store'] }); toast.success('Saved'); },
    onError: (e: any) => toast.error(e.message),
  });

  const createUser = useMutation({
    mutationFn: () => post('/auth/users', uform),
    onSuccess: () => { setUserOpen(false); refetch(); toast.success('User created'); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="p-8 max-w-4xl">
      <PageHeader title="Settings" subtitle="Store info, tax, receipt, and staff" />

      <div className="card p-6 mb-6">
        <h2 className="font-semibold mb-4">Store Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Store Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="col-span-2"><label className="label">Address</label><input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div><label className="label">NTN</label><input className="input" value={form.ntn} onChange={(e) => setForm({ ...form, ntn: e.target.value })} /></div>
          <div><label className="label">Currency</label><input className="input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
          <div><label className="label">Default GST Rate (%)</label><input type="number" className="input" value={form.gstRate} onChange={(e) => setForm({ ...form, gstRate: e.target.value })} /></div>
          <div className="col-span-2"><label className="label">Receipt Footer</label><input className="input" value={form.receiptFooter} onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })} /></div>
        </div>
        <div className="mt-4"><button className="btn-primary" onClick={() => save.mutate()}>Save</button></div>
      </div>

      {user?.role === 'OWNER' && (
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Staff Users</h2>
            <button className="btn-primary" onClick={() => { setUform({ name: '', email: '', password: '', role: 'CASHIER' }); setUserOpen(true); }}>
              <Plus size={16} /> Add User
            </button>
          </div>
          <table className="w-full">
            <thead><tr><th className="th">Name</th><th className="th">Email</th><th className="th">Role</th><th className="th">Status</th></tr></thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id}>
                  <td className="td font-medium">{u.name}</td>
                  <td className="td">{u.email}</td>
                  <td className="td">{u.role}</td>
                  <td className="td">{u.active ? <span className="badge bg-brand-100 text-brand-700">Active</span> : <span className="badge bg-slate-200">Inactive</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <Modal open={userOpen} onClose={() => setUserOpen(false)} title="Add User">
            <div className="space-y-3">
              <div><label className="label">Name*</label><input className="input" value={uform.name} onChange={(e) => setUform({ ...uform, name: e.target.value })} /></div>
              <div><label className="label">Email*</label><input className="input" type="email" value={uform.email} onChange={(e) => setUform({ ...uform, email: e.target.value })} /></div>
              <div><label className="label">Password*</label><input className="input" type="password" value={uform.password} onChange={(e) => setUform({ ...uform, password: e.target.value })} /></div>
              <div><label className="label">Role</label>
                <select className="input" value={uform.role} onChange={(e) => setUform({ ...uform, role: e.target.value })}>
                  <option value="CASHIER">Cashier</option>
                  <option value="PHARMACIST">Pharmacist</option>
                  <option value="OWNER">Owner</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn-outline" onClick={() => setUserOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={() => createUser.mutate()}>Create</button>
            </div>
          </Modal>
        </div>
      )}
    </div>
  );
}
