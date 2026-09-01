import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '../config/env';
import { ApiError } from '../utils/apiError';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

/**
 * Decodifica o Bearer token, se presente, e popula `req.user` — mas nunca
 * bloqueia a requisição. Deve rodar antes de `requestContextMiddleware` para
 * que o usuário autenticado entre no contexto de auditoria.
 */
export function identify(req: Request, _res: Response, next: NextFunction) {
  const header = req.get('authorization');
  if (!header?.startsWith('Bearer ')) return next();

  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
  } catch {
    // Token inválido/expirado: segue anônimo, rotas protegidas rejeitarão adiante.
  }
  next();
}

/** Exige um usuário autenticado válido. */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(ApiError.unauthorized());
  next();
}

/** Exige que o usuário autenticado tenha um dos papéis informados. */
export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
    next();
  };
}
