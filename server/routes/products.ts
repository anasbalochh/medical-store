import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { auth } from '../middleware/auth';
import { containsCI } from '../lib/search';

const router = Router();
router.use(auth);

const productSchema = z.object({
  name: z.string().min(1),
  genericName: z.string().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  unit: z.string().default('pcs'),
  packSize: z.number().int().positive().default(1),
  taxable: z.boolean().default(false),
  taxRate: z.number().min(0).max(100).default(0),
  minStock: z.number().int().nonnegative().default(10),
  scheduleG: z.boolean().default(false),
});

router.get('/', async (req, res, next) => {
  try {
    const q = (req.query.q as string) || '';
    const products = await prisma.product.findMany({
      where: {
        active: true,
        OR: q ? [
          { name: containsCI(q) },
          { genericName: containsCI(q) },
          { barcode: { equals: q } },
        ] : undefined,
      },
      include: {
        category: true,
        batches: { where: { quantity: { gt: 0 } }, orderBy: { expiry: 'asc' } },
      },
      orderBy: { name: 'asc' },
      take: 200,
    });
    const enriched = products.map(p => ({
      ...p,
      stock: p.batches.reduce((s, b) => s + b.quantity, 0),
      nextExpiry: p.batches[0]?.expiry ?? null,
    }));
    res.json(enriched);
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const p = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { category: true, batches: { orderBy: { expiry: 'asc' } } },
    });
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json(p);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const data = productSchema.parse(req.body);
    const p = await prisma.product.create({ data });
    res.status(201).json(p);
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const data = productSchema.partial().parse(req.body);
    const p = await prisma.product.update({ where: { id: req.params.id }, data });
    res.json(p);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.product.update({ where: { id: req.params.id }, data: { active: false } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
