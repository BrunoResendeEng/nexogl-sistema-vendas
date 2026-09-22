import type { FastifyInstance } from 'fastify';
import fastifyRateLimit from '@fastify/rate-limit';

export async function rateLimitPlugin(app: FastifyInstance): Promise<void> {
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
