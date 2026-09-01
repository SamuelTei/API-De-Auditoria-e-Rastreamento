import { AsyncLocalStorage } from 'node:async_hooks';

export interface AuditContext {
  userId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  /** Ação de negócio explícita para a próxima operação auditada (ex.: "LOGIN"). */
  actionOverride?: string;
  /** Metadados extras para anexar ao registro de auditoria (ex.: rota, método HTTP). */
  metadata?: Record<string, unknown>;
}

const storage = new AsyncLocalStorage<AuditContext>();

export function runWithAuditContext<T>(context: AuditContext, callback: () => T): T {
  return storage.run(context, callback);
}

export function getAuditContext(): AuditContext | undefined {
  return storage.getStore();
}
