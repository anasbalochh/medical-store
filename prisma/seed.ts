import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const daysFromNow = (d: number) => {
  const x = new Date();
  x.setDate(x.getDate() + d);
  return x;
};

const daysAgo = (d: number) => daysFromNow(-d);

async function main() {
  console.log('Cleaning existing data...');
  // wipe in reverse dependency order
  await prisma.stockMove.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.customerLedger.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();

  console.log('Users...');
  const ownerPass = await bcrypt.hash('admin123', 10);
  const pharmPass = await bcrypt.hash('pharm123', 10);
  const cashierPass = await bcrypt.hash('cash123', 10);
  const owner = await prisma.user.create({
    data: { name: 'Store Owner', email: 'owner@store.pk', passwordHash: ownerPass, role: 'OWNER' },
  });
  const pharm = await prisma.user.create({
    data: { name: 'Dr. Ahmed Raza', email: 'pharmacist@store.pk', passwordHash: pharmPass, role: 'PHARMACIST' },
  });
  const cashier = await prisma.user.create({
    data: { name: 'Ali Khan', email: 'cashier@store.pk', passwordHash: cashierPass, role: 'CASHIER' },
  });

  console.log('Store settings...');
  await prisma.setting.create({
    data: {
      key: 'store',
      value: JSON.stringify({
        name: 'Al-Shifa Medical Store',
        address: 'Shop 12, Main Bazaar Road, Gulberg III, Lahore',
        phone: '+92-42-3577-1234',
        ntn: '1234567-8',
        currency: 'PKR',
        gstRate: 17,
        receiptFooter: 'Thank you for your visit. Get well soon. Insha Allah.',
      }),
    },
  });

  console.log('Categories...');
  const catData = ['Tablet', 'Syrup', 'Injection', 'Capsule', 'Ointment', 'Drops', 'Inhaler', 'General', 'Baby Care', 'First Aid'];
  const cats: Record<string, string> = {};
  for (const name of catData) {
    const c = await prisma.category.create({ data: { name } });
    cats[name] = c.id;
  }

  console.log('Suppliers...');
  const suppliers = await Promise.all([
    prisma.supplier.create({ data: { name: 'GSK Pakistan', phone: '+92-21-111-475-475', ntn: '0710123-4', address: '35 Dockyard Rd, Karachi' } }),
    prisma.supplier.create({ data: { name: 'Getz Pharma', phone: '+92-21-111-111-511', ntn: '0710234-5', address: 'Plot 29-30/27, Karachi' } }),
    prisma.supplier.create({ data: { name: 'Sanofi Aventis Pakistan', phone: '+92-21-111-100-100', ntn: '0710345-6', address: 'D-135, KDA, Karachi' } }),
    prisma.supplier.create({ data: { name: 'Highnoon Laboratories', phone: '+92-42-111-000-462', ntn: '0710456-7', address: '17.5 KM Multan Road, Lahore' } }),
    prisma.supplier.create({ data: { name: 'Martin Dow Ltd', phone: '+92-21-111-771-771', ntn: '0710567-8', address: 'Karachi' } }),
    prisma.supplier.create({ data: { name: 'PharmEvo (Pvt.) Ltd', phone: '+92-21-111-750-750', ntn: '0710678-9', address: 'Karachi' } }),
    prisma.supplier.create({ data: { name: 'Local Wholesale Depot', phone: '+92-300-4567890', address: 'Urdu Bazaar, Lahore' } }),
  ]);

  console.log('Products...');
  type Prod = { name: string; generic?: string; mfr: string; cat: string; unit?: string; taxable?: boolean; taxRate?: number; scheduleG?: boolean; minStock?: number; barcode?: string };
  const prodList: Prod[] = [
    // Painkillers / antipyretics
    { name: 'Panadol 500mg', generic: 'Paracetamol', mfr: 'GSK', cat: 'Tablet', unit: 'strip', barcode: '8964000001010' },
    { name: 'Panadol Extra', generic: 'Paracetamol + Caffeine', mfr: 'GSK', cat: 'Tablet', unit: 'strip', barcode: '8964000001027' },
    { name: 'Brufen 400mg', generic: 'Ibuprofen', mfr: 'Abbott', cat: 'Tablet', unit: 'strip' },
    { name: 'Ponstan Forte 500mg', generic: 'Mefenamic Acid', mfr: 'Pfizer', cat: 'Tablet', unit: 'strip' },
    { name: 'Disprin 300mg', generic: 'Aspirin', mfr: 'Reckitt Benckiser', cat: 'Tablet', unit: 'strip' },

    // Antibiotics
    { name: 'Augmentin 625mg', generic: 'Amoxicillin + Clavulanate', mfr: 'GSK', cat: 'Tablet', unit: 'strip', minStock: 20 },
    { name: 'Ciproxin 500mg', generic: 'Ciprofloxacin', mfr: 'Bayer', cat: 'Tablet', unit: 'strip' },
    { name: 'Klaricid 500mg', generic: 'Clarithromycin', mfr: 'Abbott', cat: 'Tablet', unit: 'strip' },
    { name: 'Flagyl 400mg', generic: 'Metronidazole', mfr: 'Sanofi', cat: 'Tablet', unit: 'strip' },
    { name: 'Zithromax 500mg', generic: 'Azithromycin', mfr: 'Pfizer', cat: 'Tablet', unit: 'strip' },

    // Antacids / gastric
    { name: 'Nexum 40mg', generic: 'Esomeprazole', mfr: 'Getz Pharma', cat: 'Capsule', unit: 'strip' },
    { name: 'Risek 20mg', generic: 'Omeprazole', mfr: 'Getz Pharma', cat: 'Capsule', unit: 'strip' },
    { name: 'Gaviscon Suspension', generic: 'Sodium Alginate', mfr: 'RB', cat: 'Syrup', unit: 'bottle' },

    // Cardiac / BP
    { name: 'Norvasc 5mg', generic: 'Amlodipine', mfr: 'Pfizer', cat: 'Tablet', unit: 'strip', minStock: 15 },
    { name: 'Concor 5mg', generic: 'Bisoprolol', mfr: 'Merck', cat: 'Tablet', unit: 'strip' },
    { name: 'Cardura 4mg', generic: 'Doxazosin', mfr: 'Pfizer', cat: 'Tablet', unit: 'strip' },

    // Diabetes
    { name: 'Glucophage 500mg', generic: 'Metformin', mfr: 'Martin Dow', cat: 'Tablet', unit: 'strip', minStock: 30 },
    { name: 'Amaryl 2mg', generic: 'Glimepiride', mfr: 'Sanofi', cat: 'Tablet', unit: 'strip' },

    // Cold / cough
    { name: 'Hydryllin Syrup', generic: 'Diphenhydramine', mfr: 'Highnoon', cat: 'Syrup', unit: 'bottle' },
    { name: 'Coferb Syrup', generic: 'Dextromethorphan', mfr: 'Sami', cat: 'Syrup', unit: 'bottle' },
    { name: 'Actifed Syrup', generic: 'Triprolidine + Pseudoephedrine', mfr: 'GSK', cat: 'Syrup', unit: 'bottle' },

    // Vitamins / supplements — taxable general items
    { name: 'Centrum Advance', mfr: 'Pfizer', cat: 'General', unit: 'bottle', taxable: true, taxRate: 17 },
    { name: 'Surbex-Z', mfr: 'Abbott', cat: 'Tablet', unit: 'strip', taxable: true, taxRate: 17 },
    { name: 'CAC-1000 Plus', generic: 'Calcium + Vit D3', mfr: 'Novartis', cat: 'Tablet', unit: 'tube' },

    // Injections
    { name: 'Voren 75mg Injection', generic: 'Diclofenac', mfr: 'Novartis', cat: 'Injection', unit: 'amp' },
    { name: 'Cefspan Injection', generic: 'Cefixime', mfr: 'Fuji', cat: 'Injection', unit: 'vial' },

    // Baby / OTC
    { name: 'Calpol Syrup 120mg/5ml', generic: 'Paracetamol', mfr: 'GSK', cat: 'Baby Care', unit: 'bottle' },
    { name: 'ORS Sachet', generic: 'Rehydration Salt', mfr: 'Various', cat: 'General', unit: 'sachet' },
    { name: 'Dettol Antiseptic 250ml', mfr: 'RB', cat: 'First Aid', unit: 'bottle', taxable: true, taxRate: 17 },
    { name: 'Band-Aid Strips (Box of 100)', mfr: 'J&J', cat: 'First Aid', unit: 'box', taxable: true, taxRate: 17 },

    // Controlled drug (schedule G)
    { name: 'Xanax 0.5mg', generic: 'Alprazolam', mfr: 'Pfizer', cat: 'Tablet', unit: 'strip', scheduleG: true, minStock: 5 },
    { name: 'Lexotanil 3mg', generic: 'Bromazepam', mfr: 'Roche', cat: 'Tablet', unit: 'strip', scheduleG: true, minStock: 5 },
  ];

  const productsBySlug: Record<string, string> = {};
  for (const p of prodList) {
    const created = await prisma.product.create({
      data: {
        name: p.name,
        genericName: p.generic ?? null,
        manufacturer: p.mfr,
        barcode: p.barcode ?? null,
        categoryId: cats[p.cat],
        unit: p.unit ?? 'pcs',
        packSize: 10,
        taxable: !!p.taxable,
        taxRate: p.taxRate ?? 0,
        minStock: p.minStock ?? 10,
        scheduleG: !!p.scheduleG,
      },
    });
    productsBySlug[p.name] = created.id;
  }

  console.log('Customers...');
  const customers = await Promise.all([
    prisma.customer.create({ data: { name: 'Muhammad Bilal', phone: '+92-300-1234567', cnic: '35202-1234567-1', address: 'Model Town, Lahore' } }),
    prisma.customer.create({ data: { name: 'Fatima Sheikh', phone: '+92-301-2345678', cnic: '35202-2345678-2', address: 'Johar Town, Lahore' } }),
    prisma.customer.create({ data: { name: 'Ayesha Malik', phone: '+92-302-3456789', address: 'DHA Phase 5' } }),
    prisma.customer.create({ data: { name: 'Hassan Raza', phone: '+92-303-4567890' } }),
    prisma.customer.create({ data: { name: 'Zainab Ahmed', phone: '+92-304-5678901', cnic: '35202-5678901-3' } }),
    prisma.customer.create({ data: { name: 'Rehman Traders (B2B)', phone: '+92-42-3765-4321', cnic: '35202-9999999-9', address: 'Wholesale Market' } }),
  ]);

  console.log('Purchases (creates batches)...');
  // 5 purchases across suppliers with varied dates and expiries
  const purchases = [
    {
      supplier: suppliers[0], invoiceNo: 'GSK-2026-001', daysAgo: 60, tax: 0, paid: 0,
      lines: [
        { p: 'Panadol 500mg', qty: 500, cost: 8,  sale: 15, exp: 18 * 30 },
        { p: 'Panadol Extra', qty: 300, cost: 12, sale: 25, exp: 20 * 30 },
        { p: 'Augmentin 625mg', qty: 200, cost: 250, sale: 380, exp: 15 * 30 },
        { p: 'Actifed Syrup', qty: 100, cost: 120, sale: 195, exp: 12 * 30 },
        { p: 'Calpol Syrup 120mg/5ml', qty: 150, cost: 85, sale: 145, exp: 10 * 30 },
      ],
    },
    {
      supplier: suppliers[1], invoiceNo: 'GTZ-2026-045', daysAgo: 40, tax: 0, paid: 50000,
      lines: [
        { p: 'Nexum 40mg', qty: 300, cost: 180, sale: 285, exp: 22 * 30 },
        { p: 'Risek 20mg', qty: 400, cost: 95, sale: 165, exp: 18 * 30 },
      ],
    },
    {
      supplier: suppliers[2], invoiceNo: 'SNF-2026-112', daysAgo: 30, tax: 0, paid: 20000,
      lines: [
        { p: 'Flagyl 400mg', qty: 250, cost: 65, sale: 110, exp: 14 * 30 },
        { p: 'Amaryl 2mg', qty: 200, cost: 145, sale: 230, exp: 20 * 30 },
      ],
    },
    {
      supplier: suppliers[3], invoiceNo: 'HN-2026-089', daysAgo: 20, tax: 0, paid: 15000,
      lines: [
        { p: 'Hydryllin Syrup', qty: 80, cost: 90, sale: 150, exp: 8 * 30 }, // will show in expiring
        { p: 'Ponstan Forte 500mg', qty: 200, cost: 55, sale: 95, exp: 16 * 30 },
      ],
    },
    {
      supplier: suppliers[5], invoiceNo: 'PE-2026-200', daysAgo: 10, tax: 0, paid: 25000,
      lines: [
        { p: 'Glucophage 500mg', qty: 500, cost: 45, sale: 85, exp: 24 * 30 },
        { p: 'Norvasc 5mg', qty: 300, cost: 120, sale: 210, exp: 20 * 30 },
        { p: 'Concor 5mg', qty: 200, cost: 155, sale: 245, exp: 18 * 30 },
      ],
    },
    {
      supplier: suppliers[6], invoiceNo: 'LW-2026-450', daysAgo: 5, tax: 0, paid: 8000,
      lines: [
        { p: 'ORS Sachet', qty: 500, cost: 8, sale: 15, exp: 12 * 30 },
        { p: 'Dettol Antiseptic 250ml', qty: 60, cost: 210, sale: 320, exp: 24 * 30 },
        { p: 'Band-Aid Strips (Box of 100)', qty: 30, cost: 340, sale: 495, exp: 30 * 30 },
        { p: 'Xanax 0.5mg', qty: 50, cost: 250, sale: 395, exp: 22 * 30 },
        // near-expiry batch for the dashboard alert
        { p: 'Brufen 400mg', qty: 40, cost: 25, sale: 55, exp: 25 }, // 25 days
      ],
    },
    {
      supplier: suppliers[0], invoiceNo: 'GSK-2026-002', daysAgo: 2, tax: 0, paid: 30000,
      lines: [
        { p: 'Panadol 500mg', qty: 200, cost: 8.5, sale: 15, exp: 20 * 30 }, // second batch (FEFO test)
        { p: 'Zithromax 500mg', qty: 100, cost: 380, sale: 555, exp: 18 * 30 },
      ],
    },
  ];

  for (const pur of purchases) {
    const subtotal = pur.lines.reduce((s, l) => s + l.cost * l.qty, 0);
    const total = subtotal + pur.tax;
    const owed = total - pur.paid;
    const p = await prisma.purchase.create({
      data: {
        supplierId: pur.supplier.id,
        invoiceNo: pur.invoiceNo,
        date: daysAgo(pur.daysAgo),
        subtotal,
        tax: pur.tax,
        total,
        paid: pur.paid,
      },
    });
    for (const [i, line] of pur.lines.entries()) {
      const productId = productsBySlug[line.p];
      if (!productId) { console.warn(`skip ${line.p}`); continue; }
      const item = await prisma.purchaseItem.create({
        data: {
          purchaseId: p.id,
          productId,
          batchNo: `${pur.invoiceNo}-B${i + 1}`,
          expiry: daysFromNow(line.exp),
          quantity: line.qty,
          costPrice: line.cost,
          salePrice: line.sale,
        },
      });
      const batch = await prisma.batch.create({
        data: {
          productId,
          batchNo: `${pur.invoiceNo}-B${i + 1}`,
          expiry: daysFromNow(line.exp),
          costPrice: line.cost,
          salePrice: line.sale,
          quantity: line.qty,
          purchaseItemId: item.id,
        },
      });
      await prisma.stockMove.create({
        data: { batchId: batch.id, type: 'PURCHASE', quantity: line.qty, refId: p.id, userId: owner.id },
      });
    }
    if (owed > 0) await prisma.supplier.update({ where: { id: pur.supplier.id }, data: { balance: { increment: owed } } });
  }

  console.log('Sales (deducts stock via FEFO)...');
  const salesToMake = [
    { customer: customers[0], cashierId: cashier.id, daysAgo: 12, discount: 0, paymentMode: 'CASH' as const, items: [{ p: 'Panadol 500mg', qty: 2 }, { p: 'Nexum 40mg', qty: 1 }] },
    { customer: null,         cashierId: cashier.id, daysAgo: 12, discount: 0, paymentMode: 'CASH' as const, items: [{ p: 'ORS Sachet', qty: 5 }, { p: 'Calpol Syrup 120mg/5ml', qty: 1 }] },
    { customer: customers[1], cashierId: pharm.id,   daysAgo: 10, discount: 20, paymentMode: 'CARD' as const, items: [{ p: 'Augmentin 625mg', qty: 2 }, { p: 'Panadol Extra', qty: 1 }] },
    { customer: null,         cashierId: cashier.id, daysAgo: 8,  discount: 0, paymentMode: 'CASH' as const, items: [{ p: 'Brufen 400mg', qty: 3 }, { p: 'Dettol Antiseptic 250ml', qty: 1 }] },
    { customer: customers[2], cashierId: cashier.id, daysAgo: 6,  discount: 0, paymentMode: 'CASH' as const, items: [{ p: 'Glucophage 500mg', qty: 3 }, { p: 'Norvasc 5mg', qty: 2 }] },
    { customer: customers[3], cashierId: pharm.id,   daysAgo: 5,  discount: 50, paymentMode: 'CREDIT' as const, paid: 0, items: [{ p: 'Zithromax 500mg', qty: 1 }, { p: 'Ponstan Forte 500mg', qty: 2 }, { p: 'Nexum 40mg', qty: 2 }] },
    { customer: null,         cashierId: cashier.id, daysAgo: 4,  discount: 0, paymentMode: 'CASH' as const, items: [{ p: 'Panadol 500mg', qty: 5 }, { p: 'Actifed Syrup', qty: 2 }] },
    { customer: customers[4], cashierId: cashier.id, daysAgo: 3,  discount: 0, paymentMode: 'CARD' as const, items: [{ p: 'Centrum Advance', qty: 1 }, { p: 'CAC-1000 Plus', qty: 1 }] },
    { customer: customers[5], cashierId: pharm.id,   daysAgo: 2,  discount: 200, paymentMode: 'CREDIT' as const, paid: 5000, items: [{ p: 'Panadol 500mg', qty: 20 }, { p: 'Augmentin 625mg', qty: 5 }, { p: 'Nexum 40mg', qty: 10 }, { p: 'Glucophage 500mg', qty: 15 }] },
    { customer: null,         cashierId: cashier.id, daysAgo: 1,  discount: 0, paymentMode: 'CASH' as const, items: [{ p: 'Panadol 500mg', qty: 1 }, { p: 'Hydryllin Syrup', qty: 1 }] },
    { customer: customers[0], cashierId: cashier.id, daysAgo: 0,  discount: 0, paymentMode: 'CASH' as const, items: [{ p: 'Panadol Extra', qty: 2 }, { p: 'Surbex-Z', qty: 1 }] },
    { customer: null,         cashierId: pharm.id,   daysAgo: 0,  discount: 0, paymentMode: 'CASH' as const, items: [{ p: 'Ciproxin 500mg', qty: 2 }, { p: 'Flagyl 400mg', qty: 2 }] },
  ];

  let invSeq = 1;
  for (const s of salesToMake) {
    const products = await prisma.product.findMany({
      where: { id: { in: s.items.map(i => productsBySlug[i.p]) } },
      include: { batches: { where: { quantity: { gt: 0 } }, orderBy: { expiry: 'asc' } } },
    });
    const pmap = new Map(products.map(p => [p.id, p]));

    let subtotal = 0, tax = 0;
    const allocs: { batchId: string; qty: number; price: number; taxAmt: number; total: number }[] = [];
    for (const line of s.items) {
      const pid = productsBySlug[line.p];
      const prod = pmap.get(pid)!;
      let need = line.qty;
      for (const b of prod.batches) {
        if (need <= 0) break;
        const take = Math.min(need, b.quantity);
        const price = Number(b.salePrice);
        const lineSub = price * take;
        const taxAmt = prod.taxable ? lineSub * Number(prod.taxRate) / 100 : 0;
        allocs.push({ batchId: b.id, qty: take, price, taxAmt, total: lineSub + taxAmt });
        subtotal += lineSub;
        tax += taxAmt;
        need -= take;
        b.quantity -= take;
      }
    }
    const total = subtotal + tax - s.discount;
    const paid = (s as any).paid ?? total;
    const date = daysAgo(s.daysAgo);
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const invoiceNo = `INV-${dateStr}-${String(invSeq++).padStart(4, '0')}`;

    const sale = await prisma.sale.create({
      data: {
        invoiceNo,
        customerId: s.customer?.id,
        cashierId: s.cashierId,
        date,
        subtotal,
        discount: s.discount,
        tax,
        total,
        paid,
        paymentMode: s.paymentMode,
      },
    });

    for (const a of allocs) {
      await prisma.saleItem.create({
        data: { saleId: sale.id, batchId: a.batchId, quantity: a.qty, price: a.price, taxAmt: a.taxAmt, total: a.total },
      });
      await prisma.batch.update({ where: { id: a.batchId }, data: { quantity: { decrement: a.qty } } });
      await prisma.stockMove.create({
        data: { batchId: a.batchId, type: 'SALE', quantity: -a.qty, refId: sale.id, userId: s.cashierId },
      });
    }

    if (s.customer) {
      const outstanding = total - paid;
      await prisma.customerLedger.create({
        data: {
          customerId: s.customer.id,
          saleId: sale.id,
          type: 'SALE',
          debit: total,
          credit: paid,
          notes: `Invoice ${invoiceNo}`,
          date,
        },
      });
      if (outstanding !== 0) {
        await prisma.customer.update({ where: { id: s.customer.id }, data: { balance: { increment: outstanding } } });
      }
    }
  }

  console.log('Prescription example...');
  const lastCreditSale = await prisma.sale.findFirst({ where: { paymentMode: 'CREDIT' }, orderBy: { date: 'desc' } });
  if (lastCreditSale) {
    await prisma.prescription.create({
      data: {
        saleId: lastCreditSale.id,
        doctorName: 'Dr. Farhan Ahmed (Sheikh Zayed Hospital)',
        notes: 'Take Augmentin 1 tab BD × 7 days after meals. Nexum 1 cap OD before breakfast.',
      },
    });
  }

  const summary = {
    users: await prisma.user.count(),
    products: await prisma.product.count(),
    suppliers: await prisma.supplier.count(),
    customers: await prisma.customer.count(),
    purchases: await prisma.purchase.count(),
    batches: await prisma.batch.count(),
    sales: await prisma.sale.count(),
    saleItems: await prisma.saleItem.count(),
  };
  console.log('\nSeed complete:');
  console.table(summary);
  console.log('\nLogins:');
  console.log('  owner@store.pk / admin123');
  console.log('  pharmacist@store.pk / pharm123');
  console.log('  cashier@store.pk / cash123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
