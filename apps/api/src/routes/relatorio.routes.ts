import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';
import {
  relatorioVendas,
  relatorioMaisVendidos,
  relatorioProdutosParados,
  relatorioPosicaoEstoque,
} from '../services/relatorio.service.js';
import { ValidacaoError } from '../errors/domain-errors.js';
import { z } from 'zod';

const periodoSchema = z.object({
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato: YYYY-MM-DD'),
  dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato: YYYY-MM-DD'),
});

export async function relatorioRoutes(app: FastifyInstance): Promise<void> {
  const authenticate = async (req: FastifyRequest, rep: FastifyReply) =>
    app.authenticate(req, rep);
  const soAdminOuOperador = async (req: FastifyRequest, rep: FastifyReply) =>
    app.requirePerfil(['ADMIN', 'OPERADOR'])(req, rep);
  const authAny = [authenticate, soAdminOuOperador];

  // GET /relatorios/vendas?dataInicio=&dataFim=
  app.get('/relatorios/vendas', { preHandler: authAny }, async (request) => {
    const parse = periodoSchema.safeParse(request.query);
    if (!parse.success) throw new ValidacaoError('Parâmetros inválidos', parse.error.flatten().fieldErrors);
    return relatorioVendas(prisma, parse.data.dataInicio, parse.data.dataFim);
  });

  // GET /relatorios/mais-vendidos?dataInicio=&dataFim=
  app.get('/relatorios/mais-vendidos', { preHandler: authAny }, async (request) => {
    const parse = periodoSchema.safeParse(request.query);
    if (!parse.success) throw new ValidacaoError('Parâmetros inválidos', parse.error.flatten().fieldErrors);
    return relatorioMaisVendidos(prisma, parse.data.dataInicio, parse.data.dataFim);
  });

  // GET /relatorios/parados?dias=90
  app.get('/relatorios/parados', { preHandler: authAny }, async (request) => {
    const { dias } = request.query as { dias?: string };
    return relatorioProdutosParados(prisma, dias ? Number(dias) : 90);
  });

  // GET /relatorios/posicao-estoque
  app.get('/relatorios/posicao-estoque', { preHandler: authAny }, async () => {
    return relatorioPosicaoEstoque(prisma);
  });
}
