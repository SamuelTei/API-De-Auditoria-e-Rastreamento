import { z } from 'zod';
import { AuditAction } from '@prisma/client';
import { paginationSchema } from '../../utils/pagination';

export const auditLogFilterSchema = paginationSchema.extend({
  userId: z.string().uuid().optional(),
  entityType: z.string().min(1).optional(),
  entityId: z.string().min(1).optional(),
  action: z.nativeEnum(AuditAction).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export const auditLogIdParamSchema = z.object({
  id: z.string().uuid('id inválido'),
});

export const entityTimelineParamSchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
});

export type AuditLogFilter = z.infer<typeof auditLogFilterSchema>;
