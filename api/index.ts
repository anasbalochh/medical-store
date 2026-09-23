import express from 'express';
import cors from 'cors';
import auth from '../server/routes/auth';
import products from '../server/routes/products';
import categories from '../server/routes/categories';
import suppliers from '../server/routes/suppliers';
import customers from '../server/routes/customers';
import purchases from '../server/routes/purchases';
import inventory from '../server/routes/inventory';
import sales from '../server/routes/sales';
import reports from '../server/routes/reports';
import settings from '../server/routes/settings';
import { errorHandler } from '../server/middleware/error';

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use('/api/auth', auth);
app.use('/api/products', products);
app.use('/api/categories', categories);
app.use('/api/suppliers', suppliers);
app.use('/api/customers', customers);
app.use('/api/purchases', purchases);
app.use('/api/inventory', inventory);
app.use('/api/sales', sales);
app.use('/api/reports', reports);
app.use('/api/settings', settings);

app.use(errorHandler);

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
}

export default app;
