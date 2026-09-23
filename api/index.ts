import express from 'express';
import cors from 'cors';
import auth from './routes/auth';
import products from './routes/products';
import categories from './routes/categories';
import suppliers from './routes/suppliers';
import customers from './routes/customers';
import purchases from './routes/purchases';
import inventory from './routes/inventory';
import sales from './routes/sales';
import reports from './routes/reports';
import settings from './routes/settings';
import { errorHandler } from './middleware/error';

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
