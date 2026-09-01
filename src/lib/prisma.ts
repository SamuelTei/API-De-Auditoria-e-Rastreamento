import { PrismaClient } from '@prisma/client';
import { withAuditLog } from '../core/audit/auditExtension';
import { isProduction } from '../config/env';

const basePrisma = new PrismaClient({
  log: isProduction ? ['error', 'warn'] : ['warn'],
});

export const prisma = withAuditLog(basePrisma);
export type ExtendedPrismaClient = typeof prisma;
