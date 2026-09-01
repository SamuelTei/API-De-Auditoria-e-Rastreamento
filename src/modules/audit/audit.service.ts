import { ApiError } from '../../utils/apiError';
import { buildPageMeta } from '../../utils/pagination';
import * as auditRepository from './audit.repository';
import { AuditLogFilter } from './audit.schema';

export async function listAuditLogs(filter: AuditLogFilter) {
  const { items, total } = await auditRepository.findAuditLogs(filter);
  return { items, meta: buildPageMeta(filter, total) };
}

export async function getAuditLog(id: string) {
  const log = await auditRepository.findAuditLogById(id);
  if (!log) throw ApiError.notFound('Registro de auditoria não encontrado');
  return log;
}

export async function getEntityTimeline(entityType: string, entityId: string) {
  return auditRepository.findEntityTimeline(entityType, entityId);
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  return `"${str.replace(/"/g, '""')}"`;
}

export async function exportAuditLogsCsv(filter: Omit<AuditLogFilter, 'page' | 'pageSize'>) {
  const logs = await auditRepository.findAllForExport(filter);

  const header = [
    'id',
    'action',
    'entityType',
    'entityId',
    'userId',
    'userEmail',
    'ipAddress',
    'userAgent',
    'oldValue',
    'newValue',
    'createdAt',
  ];

  const rows = logs.map((log) =>
    [
      log.id,
      log.action,
      log.entityType,
      log.entityId,
      log.userId,
      log.user?.email,
      log.ipAddress,
      log.userAgent,
      log.oldValue,
      log.newValue,
      log.createdAt.toISOString(),
    ]
      .map(csvEscape)
      .join(','),
  );

  return [header.join(','), ...rows].join('\n');
}
