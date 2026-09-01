import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './lib/prisma';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`Servidor rodando na porta ${env.PORT} (${env.NODE_ENV})`);
  logger.info(`Documentação disponível em http://localhost:${env.PORT}/docs`);
});

async function shutdown(signal: string) {
  logger.info(`Recebido ${signal}, encerrando servidor...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
