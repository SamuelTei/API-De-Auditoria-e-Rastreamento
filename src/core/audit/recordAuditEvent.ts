import { AuditAction, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { getAuditContext } from './auditContext';

interface RecordAuditEventInput {
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  /** Sobrescreve o usuário do contexto (ex.: login mal-sucedido antes de autenticar). */
  userId?: string | null;
}

/**
 * Grava manualmente um evento de auditoria que não decorre de uma mutação de
 * modelo Prisma (ex.: LOGIN, LOGIN_FAILED, LOGOUT).
 */
export async function recordAuditEvent(input: RecordAuditEventInput) {
  const context = getAuditContext();

  await prisma.auditLog.create({
    data: {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadata: (input.metadata as Prisma.InputJsonValue) ?? undefined,
      ipAddress: context?.ipAddress ?? null,
      userAgent: context?.userAgent ?? null,
      userId: input.userId !== undefined ? input.userId : (context?.userId ?? null),
    },
  });
}
