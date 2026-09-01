import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/apiError';
import { buildPageMeta, Pagination, toSkipTake } from '../../utils/pagination';
import { CreateProductInput, UpdateProductInput } from './products.schema';

export async function listProducts(pagination: Pagination) {
  const [items, total] = await Promise.all([
    prisma.product.findMany({ ...toSkipTake(pagination), orderBy: { createdAt: 'desc' } }),
    prisma.product.count(),
  ]);
  return { items, meta: buildPageMeta(pagination, total) };
}

export async function getProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw ApiError.notFound('Produto não encontrado');
  return product;
}

export async function createProduct(input: CreateProductInput) {
  return prisma.product.create({ data: input });
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  await getProduct(id);
  return prisma.product.update({ where: { id }, data: input });
}

export async function deleteProduct(id: string) {
  await getProduct(id);
  await prisma.product.delete({ where: { id } });
}
