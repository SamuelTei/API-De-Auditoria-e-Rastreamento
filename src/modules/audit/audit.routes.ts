import { Router } from 'express';
import { Role } from '@prisma/client';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import {
  auditLogFilterSchema,
  auditLogIdParamSchema,
  entityTimelineParamSchema,
} from './audit.schema';
import {
  exportAuditLogsHandler,
  getAuditLogHandler,
  getEntityTimelineHandler,
  listAuditLogsHandler,
} from './audit.controller';

export const auditRouter = Router();

auditRouter.use(authenticate, authorize(Role.ADMIN));

auditRouter.get('/', validate({ query: auditLogFilterSchema }), asyncHandler(listAuditLogsHandler));
auditRouter.get('/export', asyncHandler(exportAuditLogsHandler));
auditRouter.get(
  '/entity/:entityType/:entityId',
  validate({ params: entityTimelineParamSchema }),
  asyncHandler(getEntityTimelineHandler),
);
auditRouter.get(
  '/:id',
  validate({ params: auditLogIdParamSchema }),
  asyncHandler(getAuditLogHandler),
);
