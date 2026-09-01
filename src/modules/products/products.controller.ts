import { Request, Response } from 'express';
import { paginationSchema } from '../../utils/pagination';
import * as productsService from './products.service';

export async function listProductsHandler(req: Request, res: Response) {
  const pagination = paginationSchema.parse(req.query);
  const result = await productsService.listProducts(pagination);
  res.json(result);
}

export async function getProductHandler(req: Request, res: Response) {
  const product = await productsService.getProduct(req.params.id);
  res.json(product);
}

export async function createProductHandler(req: Request, res: Response) {
  const product = await productsService.createProduct(req.body);
  res.status(201).json(product);
}

export async function updateProductHandler(req: Request, res: Response) {
  const product = await productsService.updateProduct(req.params.id, req.body);
  res.json(product);
}

export async function deleteProductHandler(req: Request, res: Response) {
  await productsService.deleteProduct(req.params.id);
  res.status(204).send();
}
