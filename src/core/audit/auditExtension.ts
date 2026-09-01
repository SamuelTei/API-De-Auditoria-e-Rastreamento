import { Prisma, PrismaClient, AuditAction } from '@prisma/client';
import { getAuditContext } from './auditContext';

/**
 * Modelos que devem ter suas mutações (create/update/delete/upsert) capturadas
 * automaticamente na tabela de auditoria. Para auditar um novo modelo, basta
 * incluí-lo aqui — nenhuma mudança é necessária nos módulos de negócio.
 */
const AUDITED_MODELS = new Set<Prisma.ModelName>(['Product']);

const WRITE_OPERATIONS = new Set(['create', 'update', 'upsert', 'delete']);

function toDelegateName(model: string): string {
  return model.charAt(0).toLowerCase() + model.slice(1);
}

function toPlainJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === null || value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function operationToAction(operation: string): AuditAction {
  switch (operation) {
    case 'create':
      return AuditAction.CREATE;
    case 'update':
    case 'upsert':
      return AuditAction.UPDATE;
    case 'delete':
      return AuditAction.DELETE;
    default:
      throw new Error(`Operação não mapeada para ação de auditoria: ${operation}`);
  }
}

/**
 * Extensão do Prisma Client que intercepta operações de escrita nos modelos
 * listados em AUDITED_MODELS e grava um AuditLog com o estado anterior e
 * posterior do registro, além de quem fez a alteração (via AsyncLocalStorage).
 */
export function withAuditLog(prisma: PrismaClient) {
  return prisma.$extends({
    name: 'audit-log',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!model || !AUDITED_MODELS.has(model as Prisma.ModelName) || !WRITE_OPERATIONS.has(operation)) {
            return query(args);
          }

          const delegate = (prisma as unknown as Record<string, { findUnique: (a: unknown) => Promise<unknown> }>)[
            toDelegateName(model)
          ];

          let oldValue: unknown = null;
          const where = (args as { where?: unknown }).where;
          if ((operation === 'update' || operation === 'upsert' || operation === 'delete') && where) {
            oldValue = await delegate.findUnique({ where });
          }

          const result = await query(args);

          const context = getAuditContext();
          const entityId =
            (result as { id?: string } | null)?.id ?? (where as { id?: string } | undefined)?.id ?? null;

          await prisma.auditLog.create({
            data: {
              action: operationToAction(operation),
              entityType: model,
              entityId,
              oldValue: toPlainJson(oldValue),
              newValue: operation === 'delete' ? undefined : toPlainJson(result),
              metadata: context?.metadata ? toPlainJson(context.metadata) : undefined,
              ipAddress: context?.ipAddress ?? null,
              userAgent: context?.userAgent ?? null,
              userId: context?.userId ?? null,
            },
          });

          return result;
        },
      },
    },
  });
}
