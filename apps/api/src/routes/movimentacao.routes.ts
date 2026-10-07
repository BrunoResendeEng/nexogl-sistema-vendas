import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { criarMovimentacao, listarMovimentacoes } from '../services/movimentacao.service.js';
import { criarMovimentacaoSchema, listarMovimentacoesSchema } from '../schemas/movimentacao.schema.js';
import { ValidacaoError } from '../errors/domain-errors.js';

export async function movimentacaoRoutes(app: FastifyInstance): Promise<void> {
  const authenticate = async (req: FastifyRequest, rep: FastifyReply) =>
    app.authenticate(req, rep);
  const soAdminOuOperador = async (req: FastifyRequest, rep: FastifyReply) =>
    app.requirePerfil(['ADMIN', 'OPERADOR'])(req, rep);
  const soAdmin = async (req: FastifyRequest, rep: FastifyReply) =>
    app.requirePerfil(['ADMIN'])(req, rep);
  const authAny = [authenticate, soAdminOuOperador];
  const authAdmin = [authenticate, soAdmin];

  // GET /movimentacoes
  app.get('/movimentacoes', { preHandler: authAny }, async (request) => {
    const parse = listarMovimentacoesSchema.safeParse(request.query);
    if (!parse.success) throw new ValidacaoError('Parâmetros inválidos', parse.error.flatten().fieldErrors);
    const { data, total } = await listarMovimentacoes(prisma, parse.data);
    return { data, meta: { total, page: parse.data.page, pageSize: parse.data.pageSize } };
  });

  // POST /movimentacoes — DEVOLUCAO: ADMIN+OPERADOR / AJUSTE+PERDA: só ADMIN
  app.post('/movimentacoes', { preHandler: authAny }, async (request, reply) => {
    const parse = criarMovimentacaoSchema.safeParse(request.body);
    if (!parse.success) throw new ValidacaoError('Dados inválidos', parse.error.flatten().fieldErrors);

    const { tipo } = parse.data;
    if (tipo === 'AJUSTE' || tipo === 'PERDA') {
      await soAdmin(request, reply);
      if (reply.sent) return;
    }

    const mov = await criarMovimentacao(prisma, parse.data, Number(request.user.sub));
    return reply.status(201).send(mov);
  });
}
