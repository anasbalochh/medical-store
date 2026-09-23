const BASE = '/api';

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function setToken(t: string | null) {
  if (t) localStorage.setItem('token', t);
  else localStorage.removeItem('token');
}

export async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (res.status === 401) {
    setToken(null);
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    let msg = 'Request failed';
    try { const j = await res.json(); msg = j.error || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export const get = <T,>(p: string) => api<T>(p);
export const post = <T,>(p: string, body: any) => api<T>(p, { method: 'POST', body: JSON.stringify(body) });
export const put = <T,>(p: string, body: any) => api<T>(p, { method: 'PUT', body: JSON.stringify(body) });
export const del = <T,>(p: string) => api<T>(p, { method: 'DELETE' });
