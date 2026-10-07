import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import { AcessoNegadoError, TokenExpiradoError } from '../errors/domain-errors.js';
import { env } from '../config/env.js';

async function authPluginFn(app: FastifyInstance): Promise<void> {
  await app.register(fastifyCookie);

  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    cookie: {
      cookieName: 'accessToken',
      signed: false,
    },
  });

  app.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch {
        const error = new TokenExpiradoError();
        return reply.status(error.statusCode).send({
          error: { code: error.code, message: error.message },
        });
      }
    },
  );

  app.decorate(
    'requirePerfil',
    (perfisPermitidos: import('@repo/types').Perfil[]) =>
      async (request: FastifyRequest, reply: FastifyReply) => {
        const perfil = request.user?.perfil;
        // MASTER tem acesso a tudo
        if (perfil === 'MASTER') return;
        if (!perfil || !perfisPermitidos.includes(perfil)) {
          const error = new AcessoNegadoError();
          return reply.status(error.statusCode).send({
            error: { code: error.code, message: error.message },
          });
        }
      },
  );
}

export const authPlugin = fp(authPluginFn);
