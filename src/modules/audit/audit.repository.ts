import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AuditLogFilter } from './audit.schema';

function buildWhere(filter: Omit<AuditLogFilter, 'page' | 'pageSize'>): Prisma.AuditLogWhereInput {
  return {
    userId: filter.userId,
    entityType: filter.entityType,
    entityId: filter.entityId,
    action: filter.action,
    createdAt:
      filter.dateFrom || filter.dateTo
        ? { gte: filter.dateFrom, lte: filter.dateTo }
        : undefined,
  };
}

const includeUser = {
  user: { select: { id: true, name: true, email: true, role: true } },
} satisfies Prisma.AuditLogInclude;

export async function findAuditLogs(filter: AuditLogFilter) {
  const where = buildWhere(filter);
  const skip = (filter.page - 1) * filter.pageSize;

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: includeUser,
      orderBy: { createdAt: 'desc' },
      skip,
      take: filter.pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { items, total };
}

export async function findAuditLogById(id: string) {
  return prisma.auditLog.findUnique({ where: { id }, include: includeUser });
}

export async function findEntityTimeline(entityType: string, entityId: string) {
  return prisma.auditLog.findMany({
    where: { entityType, entityId },
    include: includeUser,
    orderBy: { createdAt: 'asc' },
  });
}

export async function findAllForExport(filter: Omit<AuditLogFilter, 'page' | 'pageSize'>) {
  const where = buildWhere(filter);
  return prisma.auditLog.findMany({ where, include: includeUser, orderBy: { createdAt: 'desc' } });
}
