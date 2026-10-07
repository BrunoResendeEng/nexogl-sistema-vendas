import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { login, refreshTokens, logout, recuperarSenha, alterarSenha } from '../services/auth.service.js';
import { loginSchema, recuperarSenhaSchema, alterarSenhaSchema } from '../schemas/auth.schema.js';
import { ValidacaoError } from '../errors/domain-errors.js';
import { env } from '../config/env.js';
import type { Perfil } from '@repo/types';

const COOKIE_OPTS_BASE = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.NODE_ENV === 'production',
  path: '/',
};

const ACCESS_COOKIE_OPTS = {
  httpOnly: false,
  sameSite: 'lax' as const,
  secure: env.NODE_ENV === 'production',
  path: '/',
};

const ACCESS_TOKEN_MAX_AGE  = 15 * 60;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

function makeGerarTokens(server: FastifyInstance) {
  return ({ sub, perfil }: { sub: string; perfil: Perfil }) => ({
    accessToken: server.jwt.sign(
      { sub, perfil },
      { expiresIn: '15m' },
    ),
    refreshToken: server.jwt.sign(
      { sub, perfil },
      { key: env.JWT_REFRESH_SECRET, expiresIn: '7d' },
    ),
  });
}

export async function authRoutes(app: FastifyInstance): Promise<void> {

  // ─── POST /auth/login ─────────────────────────────────────────────────────
  app.post('/auth/login', async (request, reply) => {
    const parse = loginSchema.safeParse(request.body);
    if (!parse.success) {
      throw new ValidacaoError('Dados inválidos', parse.error.flatten().fieldErrors);
    }

    const { email, senha } = parse.data;

    const { usuario, tokens } = await login(
      prisma,
      email,
      senha,
      makeGerarTokens(request.server),
    );

    reply
      .setCookie('accessToken', tokens.accessToken, {
        ...ACCESS_COOKIE_OPTS,
        maxAge: ACCESS_TOKEN_MAX_AGE,
      })
      .setCookie('refreshToken', tokens.refreshToken, {
        ...COOKIE_OPTS_BASE,
        maxAge: REFRESH_TOKEN_MAX_AGE,
      });

    return reply.status(200).send({ data: usuario });
  });

  // ─── POST /auth/refresh

  // ─── POST /auth/refresh ───────────────────────────────────────────────────
  app.post('/auth/refresh', async (request, reply) => {
    const refreshToken = request.cookies['refreshToken'];
    if (!refreshToken) {
      return reply.status(401).send({
        error: { code: 'TOKEN_EXPIRADO', message: 'Refresh token ausente' },
      });
    }

    const tokens = await refreshTokens(
      prisma,
      refreshToken,
      makeGerarTokens(request.server),
    );

    reply
      .setCookie('accessToken', tokens.accessToken, {
        ...ACCESS_COOKIE_OPTS,
        maxAge: ACCESS_TOKEN_MAX_AGE,
      })
      .setCookie('refreshToken', tokens.refreshToken, {
        ...COOKIE_OPTS_BASE,
        maxAge: REFRESH_TOKEN_MAX_AGE,
      });

    return reply.status(200).send({ data: { ok: true } });
  });

  // ─── POST /auth/logout ────────────────────────────────────────────────────
  app.post(
    '/auth/logout',
    {
      preHandler: async (request, reply) => {
        await app.authenticate(request, reply);
      },
    },
    async (request, reply) => {
      const refreshToken = request.cookies['refreshToken'];
      if (refreshToken) {
        await logout(prisma, refreshToken);
      }

      reply
        .clearCookie('accessToken', { path: '/' })
        .clearCookie('refreshToken', { path: '/' });

      return reply.status(204).send();
    },
  );

  // ─── POST /auth/recuperar-senha ───────────────────────────────────────────
  app.post('/auth/recuperar-senha', async (request, reply) => {
    const parse = recuperarSenhaSchema.safeParse(request.body);
    if (!parse.success) {
      throw new ValidacaoError('Dados inválidos', parse.error.flatten().fieldErrors);
    }

    const { senhaTemporaria } = await recuperarSenha(prisma, parse.data.email);
    return reply.status(200).send({ data: { senhaTemporaria } });
  });

  // ─── POST /auth/alterar-senha ─────────────────────────────────────────────
  app.post(
    '/auth/alterar-senha',
    { preHandler: async (request, reply) => { await app.authenticate(request, reply); } },
    async (request, reply) => {
      const parse = alterarSenhaSchema.safeParse(request.body);
      if (!parse.success) {
        throw new ValidacaoError('Dados inválidos', parse.error.flatten().fieldErrors);
      }

      const usuarioId = Number(request.user.sub);
      await alterarSenha(prisma, usuarioId, parse.data.senhaAtual, parse.data.novaSenha);
      return reply.status(200).send({ data: { ok: true } });
    },
  );
}
