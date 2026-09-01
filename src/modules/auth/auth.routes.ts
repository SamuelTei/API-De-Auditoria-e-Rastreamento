import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middlewares/validate.middleware';
import { loginSchema, registerSchema } from './auth.schema';
import { loginHandler, registerHandler } from './auth.controller';

export const authRouter = Router();

authRouter.post('/register', validate({ body: registerSchema }), asyncHandler(registerHandler));
authRouter.post('/login', validate({ body: loginSchema }), asyncHandler(loginHandler));
