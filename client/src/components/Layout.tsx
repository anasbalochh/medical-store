import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/store/auth';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Truck, ClipboardList,
  BarChart3, Settings, LogOut, Pill, ScrollText,
} from 'lucide-react';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/pos', label: 'POS / Sales', icon: ShoppingCart },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/purchases', label: 'Purchases', icon: Truck },
  { to: '/inventory', label: 'Inventory', icon: ClipboardList },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/suppliers', label: 'Suppliers', icon: Truck },
  { to: '/sales', label: 'Sales History', icon: ScrollText },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const nav2 = useNavigate();
  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col">
        <div className="p-4 flex items-center gap-2 border-b border-slate-800">
          <Pill className="text-brand-500" />
          <span className="font-bold text-lg">MedStore</span>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  isActive ? 'bg-brand-600 text-white' : 'hover:bg-slate-800 text-slate-300'
                }`
              }
            >
              <n.icon size={18} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-800">
          <div className="text-sm">
            <div className="font-medium truncate">{user?.name}</div>
            <div className="text-xs text-slate-400">{user?.role}</div>
          </div>
          <button
            className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-slate-800 text-slate-300"
            onClick={() => { logout(); nav2('/login'); }}
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
