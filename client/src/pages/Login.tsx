import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { post } from '@/lib/api';
import { useAuth } from '@/store/auth';
import toast from 'react-hot-toast';
import { Pill } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('owner@store.pk');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const login = useAuth((s) => s.login);
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { token, user } = await post<any>('/auth/login', { email, password });
      login(token, user);
      toast.success(`Welcome ${user.name}`);
      nav('/');
    } catch (e: any) {
      toast.error(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 p-4">
      <form onSubmit={submit} className="card p-8 w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-brand-100 rounded-lg"><Pill className="text-brand-600" /></div>
          <div>
            <h1 className="text-xl font-bold">MedStore</h1>
            <p className="text-sm text-slate-500">Pharmacy management</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn-primary w-full justify-center" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
          <p className="text-xs text-slate-500 text-center">Default: owner@store.pk / admin123</p>
        </div>
      </form>
    </div>
  );
}
