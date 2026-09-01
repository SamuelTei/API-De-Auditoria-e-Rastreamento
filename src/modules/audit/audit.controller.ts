import { Request, Response } from 'express';
import { auditLogFilterSchema } from './audit.schema';
import * as auditService from './audit.service';

export async function listAuditLogsHandler(req: Request, res: Response) {
  const filter = auditLogFilterSchema.parse(req.query);
  const result = await auditService.listAuditLogs(filter);
  res.json(result);
}

export async function getAuditLogHandler(req: Request, res: Response) {
  const log = await auditService.getAuditLog(req.params.id);
  res.json(log);
}

export async function getEntityTimelineHandler(req: Request, res: Response) {
  const { entityType, entityId } = req.params;
  const timeline = await auditService.getEntityTimeline(entityType, entityId);
  res.json({ entityType, entityId, events: timeline });
}

export async function exportAuditLogsHandler(req: Request, res: Response) {
  const filter = auditLogFilterSchema.omit({ page: true, pageSize: true }).parse(req.query);
  const csv = await auditService.exportAuditLogsCsv(filter);
  res.header('Content-Type', 'text/csv');
  res.attachment(`audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
  res.send(csv);
}
