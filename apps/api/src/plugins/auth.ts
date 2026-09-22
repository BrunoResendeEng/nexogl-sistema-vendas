import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import { AcessoNegadoError, TokenExpiradoError } from '../errors/domain-errors.js';
import type { Perfil } from '@repo/types';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; perfil: Perfil };
    user: { sub: string; perfil: Perfil };
  }
}

export async function authPlugin(app: FastifyInstance): Promise<void> {
  // Registra cookie parser
  await app.register(fastifyCookie);

  // Registra JWT — lê accessToken do cookie HttpOnly
  await app.register(fastifyJwt, {
    secret: process.env['JWT_SECRET'] ?? 'dev-secret',
    cookie: {
      cookieName: 'accessToken',
      signed: false,
    },
  });

  // Decorator: valida accessToken e injeta request.user
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

  // Decorator: exige perfil específico (usa após authenticate)
  app.decorate(
    'requirePerfil',
    (perfisPermitidos: Perfil[]) =>
      async (request: FastifyRequest, reply: FastifyReply) => {
        const perfil = request.user?.perfil;
        if (!perfil || !perfisPermitidos.includes(perfil)) {
          const error = new AcessoNegadoError();
          return reply.status(error.statusCode).send({
            error: { code: error.code, message: error.message },
          });
        }
      },
  );
}

// Augment FastifyInstance com os decorators
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requirePerfil: (
      perfis: Perfil[],
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
