import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { auth } from '../middleware/auth';

const router = Router();
router.use(auth);

const schema = z.object({
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
  ntn: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

router.get('/', async (_req, res, next) => {
  try {
    res.json(await prisma.supplier.findMany({ orderBy: { name: 'asc' } }));
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const s = await prisma.supplier.findUnique({
      where: { id: req.params.id },
      include: { purchases: { orderBy: { date: 'desc' }, take: 50 } },
    });
    if (!s) return res.status(404).json({ error: 'Not found' });
    res.json(s);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const data = schema.parse(req.body);
    const s = await prisma.supplier.create({ data });
    res.status(201).json(s);
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const data = schema.partial().parse(req.body);
    const s = await prisma.supplier.update({ where: { id: req.params.id }, data });
    res.json(s);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.supplier.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
