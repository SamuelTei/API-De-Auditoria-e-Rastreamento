import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './config/logger';
import { identify } from './middlewares/auth.middleware';
import { requestContextMiddleware } from './middlewares/requestContext.middleware';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { apiRouter } from './routes';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(pinoHttp({ logger, autoLogging: env.NODE_ENV !== 'test' }));
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      limit: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // `identify` decodifica o JWT (se houver) antes do contexto de auditoria
  // ser criado, para que `userId` já esteja disponível a quem consumir o
  // AsyncLocalStorage (ex.: a extensão de auditoria do Prisma).
  app.use(identify);
  app.use(requestContextMiddleware);

  const openapiPath = path.join(process.cwd(), 'docs', 'openapi.yaml');
  if (fs.existsSync(openapiPath)) {
    const openapiDocument = YAML.parse(fs.readFileSync(openapiPath, 'utf-8'));
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));
  }

  app.use('/api/v1', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
