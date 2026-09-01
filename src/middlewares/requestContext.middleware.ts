import { NextFunction, Request, Response } from 'express';
import { runWithAuditContext } from '../core/audit/auditContext';

/**
 * Inicia, para cada requisição, um contexto de auditoria (usuário autenticado,
 * IP e User-Agent) acessível de forma implícita em qualquer ponto da call
 * stack via AsyncLocalStorage — inclusive dentro da extensão do Prisma.
 *
 * Deve ser registrado após o middleware de autenticação não obrigatória,
 * ou combinado com ele; aqui assumimos que `req.user` já pode estar populado
 * quando presente um Bearer token válido (ver auth.middleware `identify`).
 */
export function requestContextMiddleware(req: Request, _res: Response, next: NextFunction) {
  runWithAuditContext(
    {
      userId: req.user?.id ?? null,
      ipAddress: req.ip ?? null,
      userAgent: req.get('user-agent') ?? null,
      metadata: { method: req.method, path: req.originalUrl },
    },
    next,
  );
}
