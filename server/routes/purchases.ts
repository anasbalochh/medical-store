import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { auth } from '../middleware/auth';

const router = Router();
router.use(auth);

const itemSchema = z.object({
  productId: z.string(),
  batchNo: z.string().min(1),
  expiry: z.string(),
  quantity: z.number().int().positive(),
  costPrice: z.number().nonnegative(),
  salePrice: z.number().nonnegative(),
});

const purchaseSchema = z.object({
  supplierId: z.string(),
  invoiceNo: z.string().min(1),
  date: z.string().optional(),
  tax: z.number().nonnegative().default(0),
  paid: z.number().nonnegative().default(0),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1),
});

router.get('/', async (_req, res, next) => {
  try {
    const rows = await prisma.purchase.findMany({
      include: { supplier: true, items: true },
      orderBy: { date: 'desc' },
      take: 200,
    });
    res.json(rows);
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const p = await prisma.purchase.findUnique({
      where: { id: req.params.id },
      include: {
        supplier: true,
        items: { include: { batch: true } },
      },
    });
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json(p);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const body = purchaseSchema.parse(req.body);
    const subtotal = body.items.reduce((s, i) => s + i.costPrice * i.quantity, 0);
    const total = subtotal + body.tax;

    const purchase = await prisma.$transaction(async (tx) => {
      const p = await tx.purchase.create({
        data: {
          supplierId: body.supplierId,
          invoiceNo: body.invoiceNo,
          date: body.date ? new Date(body.date) : new Date(),
          subtotal,
          tax: body.tax,
          total,
          paid: body.paid,
          notes: body.notes,
        },
      });

      for (const item of body.items) {
        const pItem = await tx.purchaseItem.create({
          data: {
            purchaseId: p.id,
            productId: item.productId,
            batchNo: item.batchNo,
            expiry: new Date(item.expiry),
            quantity: item.quantity,
            costPrice: item.costPrice,
            salePrice: item.salePrice,
          },
        });
        const batch = await tx.batch.create({
          data: {
            productId: item.productId,
            batchNo: item.batchNo,
            expiry: new Date(item.expiry),
            costPrice: item.costPrice,
            salePrice: item.salePrice,
            quantity: item.quantity,
            purchaseItemId: pItem.id,
          },
        });
        await tx.stockMove.create({
          data: {
            batchId: batch.id,
            type: 'PURCHASE',
            quantity: item.quantity,
            refId: p.id,
            userId: req.user?.sub,
          },
        });
      }

      const owed = total - body.paid;
      if (owed > 0) {
        await tx.supplier.update({
          where: { id: body.supplierId },
          data: { balance: { increment: owed } },
        });
      }

      return p;
    });

    res.status(201).json(purchase);
  } catch (e) { next(e); }
});

router.post('/:id/pay', async (req, res, next) => {
  try {
    const { amount } = z.object({ amount: z.number().positive() }).parse(req.body);
    const result = await prisma.$transaction(async (tx) => {
      const p = await tx.purchase.update({
        where: { id: req.params.id },
        data: { paid: { increment: amount } },
      });
      await tx.supplier.update({
        where: { id: p.supplierId },
        data: { balance: { decrement: amount } },
      });
      return p;
    });
    res.json(result);
  } catch (e) { next(e); }
});

export default router;
