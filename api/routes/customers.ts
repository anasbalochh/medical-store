import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { auth } from '../middleware/auth';
import { containsCI } from '../lib/search';

const router = Router();
router.use(auth);

const schema = z.object({
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
  cnic: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

router.get('/', async (req, res, next) => {
  try {
    const q = (req.query.q as string) || '';
    const customers = await prisma.customer.findMany({
      where: q ? {
        OR: [
          { name: containsCI(q) },
          { phone: { contains: q } },
        ],
      } : undefined,
      orderBy: { name: 'asc' },
      take: 200,
    });
    res.json(customers);
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const c = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        sales: { orderBy: { date: 'desc' }, take: 20 },
        ledgerEntries: { orderBy: { date: 'desc' }, take: 50 },
      },
    });
    if (!c) return res.status(404).json({ error: 'Not found' });
    res.json(c);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const data = schema.parse(req.body);
    const c = await prisma.customer.create({ data });
    res.status(201).json(c);
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const data = schema.partial().parse(req.body);
    const c = await prisma.customer.update({ where: { id: req.params.id }, data });
    res.json(c);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.customer.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.post('/:id/payment', async (req, res, next) => {
  try {
    const { amount, notes } = z.object({
      amount: z.number().positive(),
      notes: z.string().optional(),
    }).parse(req.body);
    const result = await prisma.$transaction(async (tx) => {
      const cust = await tx.customer.update({
        where: { id: req.params.id },
        data: { balance: { decrement: amount } },
      });
      await tx.customerLedger.create({
        data: {
          customerId: cust.id,
          type: 'PAYMENT',
          credit: amount,
          notes: notes ?? 'Payment received',
        },
      });
      return cust;
    });
    res.json(result);
  } catch (e) { next(e); }
});

export default router;
