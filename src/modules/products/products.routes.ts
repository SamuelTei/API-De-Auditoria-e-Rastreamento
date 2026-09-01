import { Router } from 'express';
import { Role } from '@prisma/client';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import {
  createProductSchema,
  productIdParamSchema,
  updateProductSchema,
} from './products.schema';
import {
  createProductHandler,
  deleteProductHandler,
  getProductHandler,
  listProductsHandler,
  updateProductHandler,
} from './products.controller';

export const productsRouter = Router();

productsRouter.get('/', asyncHandler(listProductsHandler));
productsRouter.get(
  '/:id',
  validate({ params: productIdParamSchema }),
  asyncHandler(getProductHandler),
);
productsRouter.post(
  '/',
  authenticate,
  authorize(Role.ADMIN, Role.USER),
  validate({ body: createProductSchema }),
  asyncHandler(createProductHandler),
);
productsRouter.patch(
  '/:id',
  authenticate,
  authorize(Role.ADMIN, Role.USER),
  validate({ params: productIdParamSchema, body: updateProductSchema }),
  asyncHandler(updateProductHandler),
);
productsRouter.delete(
  '/:id',
  authenticate,
  authorize(Role.ADMIN),
  validate({ params: productIdParamSchema }),
  asyncHandler(deleteProductHandler),
);
