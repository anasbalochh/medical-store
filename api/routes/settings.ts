import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { auth } from '../middleware/auth';

const router = Router();
router.use(auth);

router.get('/store', async (_req, res, next) => {
  try {
    const s = await prisma.setting.findUnique({ where: { key: 'store' } });
    res.json(s ? JSON.parse(s.value) : {});
  } catch (e) { next(e); }
});

router.put('/store', async (req, res, next) => {
  try {
    const data = z.object({
      name: z.string().optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
      ntn: z.string().optional(),
      currency: z.string().default('PKR'),
      gstRate: z.number().min(0).max(100).default(17),
      receiptFooter: z.string().optional(),
    }).parse(req.body);
    await prisma.setting.upsert({
      where: { key: 'store' },
      update: { value: JSON.stringify(data) },
      create: { key: 'store', value: JSON.stringify(data) },
    });
    res.json(data);
  } catch (e) { next(e); }
});

export default router;
