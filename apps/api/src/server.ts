import 'dotenv/config';
import Fastify from 'fastify';
import { corsPlugin } from './plugins/cors.js';
import { rateLimitPlugin } from './plugins/rate-limit.js';
import { authPlugin } from './plugins/auth.js';
import { healthRoutes } from './routes/health.routes.js';
import { DomainError } from './errors/domain-errors.js';
import { ZodError } from 'zod';

const app = Fastify({
  logger: {
    level: process.env['NODE_ENV'] === 'production' ? 'warn' : 'info',
    transport:
      process.env['NODE_ENV'] !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  },
});

// ─── Plugins ──────────────────────────────────────────────────────────────────
await app.register(corsPlugin);
await app.register(rateLimitPlugin);
await app.register(authPlugin);

// ─── Rotas ────────────────────────────────────────────────────────────────────
await app.register(healthRoutes);
await app.register(
  async (api) => {
    await api.register(healthRoutes);
    // Demais rotas serão registradas aqui nas fases seguintes
  },
  { prefix: '/api/v1' },
);

// ─── Handler global de erros ──────────────────────────────────────────────────
app.setErrorHandler((error, _request, reply) => {
  // Erros de domínio: formato padrão { error: { code, message } }
  if (error instanceof DomainError) {
    return reply.status(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message,
        ...('details' in error && error.details !== undefined
          ? { details: error.details }
          : {}),
      },
    });
  }

  // Erros de validação Zod
  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: {
        code: 'VALIDACAO',
        message: 'Dados inválidos na requisição',
        details: error.flatten().fieldErrors,
      },
    });
  }

  // Rate limit (já formatado pelo plugin)
  if (error.statusCode === 429) {
    return reply.status(429).send(error);
  }

  // Erro genérico — não vaza stack em produção
  app.log.error(error);
  return reply.status(500).send({
    error: {
      code: 'ERRO_INTERNO',
      message:
        process.env['NODE_ENV'] === 'production'
          ? 'Erro interno do servidor'
          : error.message,
    },
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const port = parseInt(process.env['PORT'] ?? '3001', 10);

try {
  await app.listen({ port, host: '0.0.0.0' });
  app.log.info(`API rodando em http://localhost:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
