import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { get, post } from '@/lib/api';
import { rs } from '@/lib/format';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Search, Trash2, Plus, Minus, ShoppingCart, User } from 'lucide-react';

interface CartLine { productId: string; name: string; quantity: number; price: number; taxRate: number; taxable: boolean; stock: number; }

export default function POS() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paid, setPaid] = useState(0);
  const [mode, setMode] = useState<'CASH' | 'CARD' | 'CREDIT'>('CASH');
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: products = [] } = useQuery({
    queryKey: ['pos-products', q],
    queryFn: () => get<any[]>(`/products?q=${encodeURIComponent(q)}`),
    enabled: q.length > 0,
  });
  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: () => get<any[]>('/customers') });

  useEffect(() => { searchRef.current?.focus(); }, []);

  const totals = useMemo(() => {
    let subtotal = 0, tax = 0;
    for (const c of cart) {
      const lineSub = c.price * c.quantity;
      subtotal += lineSub;
      if (c.taxable) tax += lineSub * c.taxRate / 100;
    }
    const total = Math.max(0, subtotal + tax - discount);
    return { subtotal, tax, total };
  }, [cart, discount]);

  useEffect(() => { setPaid(totals.total); }, [totals.total]);

  const addProduct = (p: any) => {
    if (p.stock <= 0) return toast.error('Out of stock');
    const price = Number(p.batches[0]?.salePrice ?? 0);
    setCart((prev) => {
      const found = prev.find((c) => c.productId === p.id);
      if (found) {
        if (found.quantity + 1 > p.stock) { toast.error('Not enough stock'); return prev; }
        return prev.map((c) => c.productId === p.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { productId: p.id, name: p.name, quantity: 1, price, taxRate: Number(p.taxRate), taxable: p.taxable, stock: p.stock }];
    });
    setQ('');
    searchRef.current?.focus();
  };

  const changeQty = (id: string, delta: number) => {
    setCart((prev) => prev.map((c) => {
      if (c.productId !== id) return c;
      const q2 = c.quantity + delta;
      if (q2 <= 0) return c;
      if (q2 > c.stock) { toast.error('Not enough stock'); return c; }
      return { ...c, quantity: q2 };
    }));
  };
  const remove = (id: string) => setCart((prev) => prev.filter((c) => c.productId !== id));

  const submit = useMutation({
    mutationFn: async () => post<any>('/sales', {
      customerId: customerId || null,
      discount,
      paid,
      paymentMode: mode,
      items: cart.map((c) => ({ productId: c.productId, quantity: c.quantity, price: c.price })),
    }),
    onSuccess: (sale: any) => {
      toast.success(`Invoice ${sale.invoiceNo} saved`);
      nav(`/receipt/${sale.id}`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && products.length === 1) {
      addProduct(products[0]);
    }
  };

  return (
    <div className="h-full flex">
      <div className="flex-1 p-6 flex flex-col">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
          <input
            ref={searchRef}
            className="input pl-10 py-3 text-lg"
            placeholder="Search medicine by name or scan barcode..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={handleSearchKey}
            autoFocus
          />
        </div>

        {q && (
          <div className="card mb-4 max-h-64 overflow-y-auto">
            {products.length === 0 && <div className="p-4 text-sm text-slate-500">No products found for "{q}"</div>}
            {products.map((p: any) => (
              <button
                key={p.id}
                onClick={() => addProduct(p)}
                disabled={p.stock <= 0}
                className="w-full text-left p-3 hover:bg-brand-50 border-b flex justify-between disabled:opacity-40"
              >
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.genericName} · Stock: {p.stock} {p.unit}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-brand-700">{rs(p.batches[0]?.salePrice ?? 0)}</div>
                  {p.taxable && <div className="text-xs text-slate-500">+{p.taxRate}% tax</div>}
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="card flex-1 overflow-hidden flex flex-col">
          <div className="p-3 border-b flex items-center gap-2">
            <ShoppingCart size={18} />
            <span className="font-semibold">Cart ({cart.length})</span>
            {cart.length > 0 && <button className="ml-auto text-xs text-red-600" onClick={() => setCart([])}>Clear</button>}
          </div>
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 && <div className="p-8 text-center text-slate-400">Search and add products to start a sale</div>}
            {cart.map((c) => (
              <div key={c.productId} className="p-3 border-b flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-slate-500">{rs(c.price)} × {c.quantity} {c.taxable && `(+${c.taxRate}% tax)`}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="btn-outline !px-2 !py-1" onClick={() => changeQty(c.productId, -1)}><Minus size={14} /></button>
                  <span className="w-10 text-center font-medium">{c.quantity}</span>
                  <button className="btn-outline !px-2 !py-1" onClick={() => changeQty(c.productId, 1)}><Plus size={14} /></button>
                </div>
                <div className="font-bold w-24 text-right">{rs(c.price * c.quantity)}</div>
                <button className="text-red-600 p-1" onClick={() => remove(c.productId)}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="w-96 bg-white border-l p-6 flex flex-col">
        <div className="mb-4">
          <label className="label"><User size={14} className="inline mr-1" /> Customer (optional for credit)</label>
          <select className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Walk-in customer</option>
            {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
          </select>
        </div>

        <div className="flex-1 space-y-2 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{rs(totals.subtotal)}</span></div>
          <div className="flex justify-between"><span>Tax (GST)</span><span>{rs(totals.tax)}</span></div>
          <div className="flex justify-between items-center">
            <span>Discount</span>
            <input type="number" className="input !w-32 !py-1 text-right" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
          </div>
          <div className="border-t pt-2 mt-2 flex justify-between text-lg font-bold">
            <span>Total</span><span className="text-brand-700">{rs(totals.total)}</span>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="label">Payment Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {(['CASH', 'CARD', 'CREDIT'] as const).map((m) => (
                <button key={m} className={`btn ${mode === m ? 'bg-brand-600 text-white' : 'btn-outline'}`} onClick={() => setMode(m)}>{m}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Amount Paid</label>
            <input type="number" className="input" value={paid} onChange={(e) => setPaid(Number(e.target.value))} />
          </div>
          {paid < totals.total && customerId === '' && mode !== 'CREDIT' && (
            <p className="text-xs text-orange-600">Underpayment without customer selection may not be recorded.</p>
          )}
          <button
            className="btn-primary w-full justify-center py-3 text-base"
            disabled={cart.length === 0 || submit.isPending}
            onClick={() => submit.mutate()}
          >
            {submit.isPending ? 'Saving...' : `Complete Sale · ${rs(totals.total)}`}
          </button>
        </div>
      </aside>
    </div>
  );
}
