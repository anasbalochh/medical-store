import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { auth } from '../middleware/auth';

const router = Router();
router.use(auth);

function todayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return { start, end };
}

router.get('/dashboard', async (_req, res, next) => {
  try {
    const { start, end } = todayRange();
    const [todaySales, monthSales, productCount, customerCount, lowStock, expiring] = await Promise.all([
      prisma.sale.aggregate({
        _sum: { total: true },
        _count: true,
        where: { date: { gte: start, lt: end } },
      }),
      prisma.sale.aggregate({
        _sum: { total: true },
        _count: true,
        where: { date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
      }),
      prisma.product.count({ where: { active: true } }),
      prisma.customer.count(),
      prisma.product.findMany({
        where: { active: true },
        include: { batches: true },
      }),
      prisma.batch.findMany({
        where: {
          quantity: { gt: 0 },
          expiry: { lte: new Date(Date.now() + 90 * 86400000) },
        },
        include: { product: true },
        orderBy: { expiry: 'asc' },
        take: 10,
      }),
    ]);

    const lowStockList = lowStock
      .map((p) => ({ ...p, stock: p.batches.reduce((s, b) => s + b.quantity, 0) }))
      .filter((p) => p.stock <= p.minStock)
      .slice(0, 10)
      .map(({ batches, ...r }) => r);

    res.json({
      today: {
        revenue: Number(todaySales._sum.total ?? 0),
        count: todaySales._count,
      },
      month: {
        revenue: Number(monthSales._sum.total ?? 0),
        count: monthSales._count,
      },
      productCount,
      customerCount,
      lowStock: lowStockList,
      expiringSoon: expiring,
    });
  } catch (e) { next(e); }
});

router.get('/sales-daily', async (req, res, next) => {
  try {
    const days = parseInt((req.query.days as string) || '30', 10);
    const from = new Date();
    from.setDate(from.getDate() - days);
    const sales = await prisma.sale.findMany({
      where: { date: { gte: from } },
      select: { date: true, total: true },
    });
    const map = new Map<string, number>();
    for (const s of sales) {
      const k = s.date.toISOString().slice(0, 10);
      map.set(k, (map.get(k) ?? 0) + Number(s.total));
    }
    const rows = Array.from(map.entries()).map(([date, total]) => ({ date, total })).sort((a, b) => a.date.localeCompare(b.date));
    res.json(rows);
  } catch (e) { next(e); }
});

router.get('/top-products', async (req, res, next) => {
  try {
    const days = parseInt((req.query.days as string) || '30', 10);
    const from = new Date();
    from.setDate(from.getDate() - days);
    const items = await prisma.saleItem.findMany({
      where: { sale: { date: { gte: from } } },
      include: { batch: { include: { product: true } } },
    });
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const it of items) {
      const key = it.batch.productId;
      const name = it.batch.product.name;
      const prev = map.get(key) ?? { name, qty: 0, revenue: 0 };
      prev.qty += it.quantity;
      prev.revenue += Number(it.total);
      map.set(key, prev);
    }
    const rows = Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 20);
    res.json(rows);
  } catch (e) { next(e); }
});

router.get('/profit', async (req, res, next) => {
  try {
    const days = parseInt((req.query.days as string) || '30', 10);
    const from = new Date();
    from.setDate(from.getDate() - days);
    const items = await prisma.saleItem.findMany({
      where: { sale: { date: { gte: from } } },
      include: { batch: true },
    });
    let revenue = 0;
    let cost = 0;
    for (const it of items) {
      revenue += Number(it.price) * it.quantity;
      cost += Number(it.batch.costPrice) * it.quantity;
    }
    res.json({ revenue, cost, profit: revenue - cost, margin: revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0 });
  } catch (e) { next(e); }
});

export default router;
