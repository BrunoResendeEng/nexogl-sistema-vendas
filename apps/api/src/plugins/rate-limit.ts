import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import fastifyRateLimit from '@fastify/rate-limit';

async function rateLimitPluginFn(app: FastifyInstance): Promise<void> {
  await app.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      error: {
        code: 'RATE_LIMIT_EXCEDIDO',
        message: 'Muitas requisições. Tente novamente em 1 minuto.',
      },
    }),
  });
}

export const rateLimitPlugin = fp(rateLimitPluginFn);
