import pino from 'pino';
import { env, isProduction, isTest } from './env';

export const logger = pino({
  level: isTest ? 'silent' : 'info',
  transport:
    !isProduction && !isTest
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
      : undefined,
  base: { env: env.NODE_ENV },
});
