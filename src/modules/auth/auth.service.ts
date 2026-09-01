import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { AuditAction } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { ApiError } from '../../utils/apiError';
import { recordAuditEvent } from '../../core/audit/recordAuditEvent';
import { LoginInput, RegisterInput } from './auth.schema';

const SALT_ROUNDS = 10;

function signToken(user: { id: string; email: string; role: string }) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as SignOptions);
}

function toPublicUser<T extends { passwordHash: string }>(user: T) {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw ApiError.conflict('Já existe um usuário com este e-mail');

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash },
  });

  await recordAuditEvent({
    action: AuditAction.CREATE,
    entityType: 'User',
    entityId: user.id,
    userId: user.id,
    metadata: { self: true },
  });

  const token = signToken(user);
  return { user: toPublicUser(user), token };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    await recordAuditEvent({
      action: AuditAction.LOGIN_FAILED,
      entityType: 'User',
      entityId: user?.id ?? null,
      userId: null,
      metadata: { email: input.email },
    });
    throw ApiError.unauthorized('E-mail ou senha inválidos');
  }

  await recordAuditEvent({
    action: AuditAction.LOGIN,
    entityType: 'User',
    entityId: user.id,
    userId: user.id,
  });

  const token = signToken(user);
  return { user: toPublicUser(user), token };
}
