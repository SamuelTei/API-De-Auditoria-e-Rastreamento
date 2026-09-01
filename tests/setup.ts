import { prisma } from '../src/lib/prisma';

beforeEach(async () => {
  await prisma.auditLog.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
