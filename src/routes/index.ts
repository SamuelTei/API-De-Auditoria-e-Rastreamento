import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';
import { productsRouter } from '../modules/products/products.routes';
import { auditRouter } from '../modules/audit/audit.routes';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => res.json({ status: 'ok' }));
apiRouter.use('/auth', authRouter);
apiRouter.use('/products', productsRouter);
apiRouter.use('/audit-logs', auditRouter);
