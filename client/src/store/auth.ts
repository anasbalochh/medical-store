import { create } from 'zustand';
import { setToken, getToken } from '@/lib/api';

interface User { id: string; name: string; email: string; role: 'OWNER' | 'PHARMACIST' | 'CASHIER' }

interface AuthState {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  login: (token, user) => {
    setToken(token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    setToken(null);
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },
  hydrate: () => {
    const token = getToken();
    const rawUser = localStorage.getItem('user');
    if (token && rawUser) set({ token, user: JSON.parse(rawUser) });
  },
}));
