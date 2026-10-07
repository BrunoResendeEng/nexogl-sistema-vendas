import type { Perfil } from '@repo/types';
import type { FastifyRequest, FastifyReply } from 'fastify';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; perfil: Perfil };
    user: { sub: string; perfil: Perfil };
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requirePerfil: (
      perfis: Perfil[],
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
