import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { auth } from '../middleware/auth';

const router = Router();
router.use(auth);

router.get('/batches', async (req, res, next) => {
  try {
    const productId = req.query.productId as string | undefined;
    const batches = await prisma.batch.findMany({
      where: { quantity: { gt: 0 }, productId },
      include: { product: true },
      orderBy: [{ expiry: 'asc' }, { createdAt: 'asc' }],
      take: 500,
    });
    res.json(batches);
  } catch (e) { next(e); }
});

router.get('/low-stock', async (_req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      include: { batches: true },
    });
    const low = products
      .map((p) => ({
        ...p,
        stock: p.batches.reduce((s, b) => s + b.quantity, 0),
      }))
      .filter((p) => p.stock <= p.minStock)
      .map(({ batches, ...rest }) => rest);
    res.json(low);
  } catch (e) { next(e); }
});

router.get('/expiring', async (req, res, next) => {
  try {
    const days = parseInt((req.query.days as string) || '90', 10);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    const batches = await prisma.batch.findMany({
      where: { expiry: { lte: cutoff }, quantity: { gt: 0 } },
      include: { product: true },
      orderBy: { expiry: 'asc' },
    });
    res.json(batches);
  } catch (e) { next(e); }
});

router.post('/adjust', async (req, res, next) => {
  try {
    const { batchId, quantity, notes, type } = z.object({
      batchId: z.string(),
      quantity: z.number().int(),
      notes: z.string().optional(),
      type: z.enum(['ADJUSTMENT', 'EXPIRY']).default('ADJUSTMENT'),
    }).parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const b = await tx.batch.update({
        where: { id: batchId },
        data: { quantity: { increment: quantity } },
      });
      await tx.stockMove.create({
        data: { batchId, type, quantity, notes, userId: req.user?.sub },
      });
      return b;
    });
    res.json(result);
  } catch (e) { next(e); }
});

router.get('/moves', async (req, res, next) => {
  try {
    const batchId = req.query.batchId as string | undefined;
    const moves = await prisma.stockMove.findMany({
      where: { batchId },
      include: { batch: { include: { product: true } }, user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    res.json(moves);
  } catch (e) { next(e); }
});

export default router;
