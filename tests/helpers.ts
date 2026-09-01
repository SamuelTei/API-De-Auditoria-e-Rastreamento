import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { prisma } from '../src/lib/prisma';
import { createApp } from '../src/app';

export const app = createApp();

export async function createAdmin() {
  const passwordHash = await bcrypt.hash('admin12345', 4);
  return prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@test.com',
      passwordHash,
      role: Role.ADMIN,
    },
  });
}
