import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { auth } from '../middleware/auth';

const router = Router();
router.use(auth);

const lineSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative().optional(),
});

const saleSchema = z.object({
  customerId: z.string().optional().nullable(),
  discount: z.number().nonnegative().default(0),
  paid: z.number().nonnegative(),
  paymentMode: z.enum(['CASH', 'CARD', 'CREDIT', 'MIXED']).default('CASH'),
  notes: z.string().optional(),
  prescription: z.object({
    imageUrl: z.string().optional(),
    doctorName: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
  items: z.array(lineSchema).min(1),
});

async function nextInvoiceNo(): Promise<string> {
  const today = new Date();
  const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, '');
  const count = await prisma.sale.count({
    where: {
      date: {
        gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      },
    },
  });
  return `INV-${yyyymmdd}-${String(count + 1).padStart(4, '0')}`;
}

router.get('/', async (req, res, next) => {
  try {
    const from = req.query.from ? new Date(req.query.from as string) : undefined;
    const to = req.query.to ? new Date(req.query.to as string) : undefined;
    const sales = await prisma.sale.findMany({
      where: { date: { gte: from, lte: to } },
      include: {
        customer: true,
        cashier: { select: { name: true } },
        items: true,
      },
      orderBy: { date: 'desc' },
      take: 500,
    });
    res.json(sales);
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const s = await prisma.sale.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        cashier: { select: { name: true } },
        items: { include: { batch: { include: { product: true } } } },
        prescription: true,
      },
    });
    if (!s) return res.status(404).json({ error: 'Not found' });
    res.json(s);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const body = saleSchema.parse(req.body);
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const products = await prisma.product.findMany({
      where: { id: { in: body.items.map(i => i.productId) } },
      include: { batches: { where: { quantity: { gt: 0 } }, orderBy: { expiry: 'asc' } } },
    });
    const productMap = new Map(products.map(p => [p.id, p]));

    type Allocation = { batchId: string; qty: number; price: number; taxAmt: number; total: number };
    const allocations: Allocation[] = [];
    let subtotal = 0;
    let taxTotal = 0;

    for (const line of body.items) {
      const p = productMap.get(line.productId);
      if (!p) return res.status(400).json({ error: `Product not found: ${line.productId}` });
      const stock = p.batches.reduce((s, b) => s + b.quantity, 0);
      if (stock < line.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${p.name} (have ${stock}, need ${line.quantity})` });
      }
      let needed = line.quantity;
      for (const b of p.batches) {
        if (needed === 0) break;
        const take = Math.min(needed, b.quantity);
        const price = line.price ?? Number(b.salePrice);
        const lineSubtotal = price * take;
        const taxAmt = p.taxable ? lineSubtotal * Number(p.taxRate) / 100 : 0;
        allocations.push({
          batchId: b.id,
          qty: take,
          price,
          taxAmt,
          total: lineSubtotal + taxAmt,
        });
        subtotal += lineSubtotal;
        taxTotal += taxAmt;
        needed -= take;
      }
    }

    const total = subtotal + taxTotal - body.discount;
    const invoiceNo = await nextInvoiceNo();

    const sale = await prisma.$transaction(async (tx) => {
      const s = await tx.sale.create({
        data: {
          invoiceNo,
          customerId: body.customerId || undefined,
          cashierId: req.user!.sub,
          subtotal,
          discount: body.discount,
          tax: taxTotal,
          total,
          paid: body.paid,
          paymentMode: body.paymentMode,
          notes: body.notes,
        },
      });

      for (const a of allocations) {
        await tx.saleItem.create({
          data: {
            saleId: s.id,
            batchId: a.batchId,
            quantity: a.qty,
            price: a.price,
            taxAmt: a.taxAmt,
            total: a.total,
          },
        });
        await tx.batch.update({
          where: { id: a.batchId },
          data: { quantity: { decrement: a.qty } },
        });
        await tx.stockMove.create({
          data: {
            batchId: a.batchId,
            type: 'SALE',
            quantity: -a.qty,
            refId: s.id,
            userId: req.user!.sub,
          },
        });
      }

      if (body.prescription) {
        await tx.prescription.create({
          data: { saleId: s.id, ...body.prescription },
        });
      }

      const outstanding = total - body.paid;
      if (body.customerId) {
        await tx.customerLedger.create({
          data: {
            customerId: body.customerId,
            saleId: s.id,
            type: 'SALE',
            debit: total,
            credit: body.paid,
            notes: `Invoice ${invoiceNo}`,
          },
        });
        if (outstanding !== 0) {
          await tx.customer.update({
            where: { id: body.customerId },
            data: { balance: { increment: outstanding } },
          });
        }
      }

      return s;
    });

    const full = await prisma.sale.findUnique({
      where: { id: sale.id },
      include: {
        customer: true,
        cashier: { select: { name: true } },
        items: { include: { batch: { include: { product: true } } } },
      },
    });
    res.status(201).json(full);
  } catch (e) { next(e); }
});

export default router;
