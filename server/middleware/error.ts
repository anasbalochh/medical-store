import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Validation failed', details: err.flatten() });
  }
  console.error(err);
  const isProd = process.env.NODE_ENV === 'production';
  const message = err instanceof Error ? err.message : 'Server error';
  const anyErr = err as any;
  // Known Prisma unique-constraint violation
  if (anyErr?.code === 'P2002') {
    return res.status(409).json({ error: 'Duplicate value: this record already exists' });
  }
  if (anyErr?.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found' });
  }
  res.status(500).json({ error: isProd ? 'Internal server error' : message });
}
