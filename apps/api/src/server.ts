import 'dotenv/config';
import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import { env } from './config/env.js';
import { corsPlugin } from './plugins/cors.js';
import { rateLimitPlugin } from './plugins/rate-limit.js';
import { authPlugin } from './plugins/auth.js';
import { authRoutes } from './routes/auth.routes.js';
import { usuarioRoutes } from './routes/usuario.routes.js';
import { produtoRoutes } from './routes/produto.routes.js';
import { vendaRoutes } from './routes/venda.routes.js';
import { dashboardRoutes } from './routes/dashboard.routes.js';
import { movimentacaoRoutes } from './routes/movimentacao.routes.js';
import { fornecedorRoutes } from './routes/fornecedor.routes.js';
import { relatorioRoutes } from './routes/relatorio.routes.js';
import { healthRoutes } from './routes/health.routes.js';
import { ZodError } from 'zod';

const app = Fastify({
  logger: {
    level: env.NODE_ENV === 'production' ? 'warn' : 'info',
    transport:
      env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  },
});

// ─── Handler global de erros ──────────────────────────────────────────────────
app.setErrorHandler((error, _request, reply) => {
  if (reply.sent) return;

  // Erros de domínio — narrowing via marker property
  if ((error as any).isDomainError === true) {
    const e = error as { statusCode: number; code: string; message: string; details?: unknown };
    return reply.code(e.statusCode).send({
      error: {
        code: e.code,
        message: e.message,
        ...(e.details !== undefined ? { details: e.details } : {}),
      },
    });
  }

  // Erros Fastify nativos com statusCode + code (ex: rate-limit, jwt)
  const fe = error as { statusCode?: number; code?: string };
  if (fe.statusCode && fe.code) {
    return reply.code(fe.statusCode).send({
      error: { code: fe.code, message: error.message },
    });
  }

  // Erros de validação Zod
  if (error instanceof ZodError) {
    return reply.code(400).send({
      error: {
        code: 'VALIDACAO',
        message: 'Dados inválidos na requisição',
        details: error.flatten().fieldErrors,
      },
    });
  }

  // Rate limit
  if (error.statusCode === 429) {
    return reply.code(429).send({
      error: { code: 'RATE_LIMIT_EXCEDIDO', message: error.message },
    });
  }

  // Erro genérico
  app.log.error(error);
  return reply.code(500).send({
    error: {
      code: 'ERRO_INTERNO',
      message: env.NODE_ENV === 'production' ? 'Erro interno do servidor' : error.message,
    },
  });
});

// ─── Plugins ──────────────────────────────────────────────────────────────────
await app.register(corsPlugin);
await app.register(rateLimitPlugin);
await app.register(authPlugin);
await app.register(multipart, { limits: { fileSize: 2 * 1024 * 1024 } });

// ─── Rotas ────────────────────────────────────────────────────────────────────
await app.register(healthRoutes);
await app.register(
  async (api) => {
    await api.register(healthRoutes);
    await api.register(authRoutes);
    await api.register(usuarioRoutes);
    await api.register(produtoRoutes);
    await api.register(vendaRoutes);
    await api.register(dashboardRoutes);
    await api.register(movimentacaoRoutes);
    await api.register(fornecedorRoutes);
    await api.register(relatorioRoutes);
  },
  { prefix: '/api/v1' },
);

// ─── Start ────────────────────────────────────────────────────────────────────
try {
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
  app.log.info(`API rodando em http://localhost:${env.PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
