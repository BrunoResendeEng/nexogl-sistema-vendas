import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';
import {
  listarFornecedores,
  buscarFornecedorPorId,
  criarFornecedor,
  atualizarFornecedor,
  toggleFornecedor,
} from '../services/fornecedor.service.js';
import {
  criarFornecedorSchema,
  atualizarFornecedorSchema,
  listarFornecedoresSchema,
} from '../schemas/fornecedor.schema.js';
import { ValidacaoError } from '../errors/domain-errors.js';

export async function fornecedorRoutes(app: FastifyInstance): Promise<void> {
  const authenticate = async (req: FastifyRequest, rep: FastifyReply) =>
    app.authenticate(req, rep);
  const soAdminOuOperador = async (req: FastifyRequest, rep: FastifyReply) =>
    app.requirePerfil(['ADMIN', 'OPERADOR'])(req, rep);
  const soAdmin = async (req: FastifyRequest, rep: FastifyReply) =>
    app.requirePerfil(['ADMIN'])(req, rep);
  const authAny = [authenticate, soAdminOuOperador];
  const authAdmin = [authenticate, soAdmin];

  // GET /fornecedores
  app.get('/fornecedores', { preHandler: authAny }, async (request) => {
    const parse = listarFornecedoresSchema.safeParse(request.query);
    if (!parse.success) throw new ValidacaoError('Parâmetros inválidos', parse.error.flatten().fieldErrors);
    const { data, total } = await listarFornecedores(prisma, parse.data);
    return { data, meta: { total, page: parse.data.page, pageSize: parse.data.pageSize } };
  });

  // GET /fornecedores/:id
  app.get('/fornecedores/:id', { preHandler: authAny }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const fornecedor = await buscarFornecedorPorId(prisma, Number(id));
    if (!fornecedor) return reply.status(404).send({ message: 'Fornecedor não encontrado' });
    return fornecedor;
  });

  // POST /fornecedores
  app.post('/fornecedores', { preHandler: authAdmin }, async (request, reply) => {
    const parse = criarFornecedorSchema.safeParse(request.body);
    if (!parse.success) throw new ValidacaoError('Dados inválidos', parse.error.flatten().fieldErrors);
    const fornecedor = await criarFornecedor(prisma, parse.data);
    return reply.status(201).send(fornecedor);
  });

  // PATCH /fornecedores/:id
  app.patch('/fornecedores/:id', { preHandler: authAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parse = atualizarFornecedorSchema.safeParse(request.body);
    if (!parse.success) throw new ValidacaoError('Dados inválidos', parse.error.flatten().fieldErrors);
    const fornecedor = await atualizarFornecedor(prisma, Number(id), parse.data);
    return fornecedor;
  });

  // PATCH /fornecedores/:id/toggle
  app.patch('/fornecedores/:id/toggle', { preHandler: authAdmin }, async (request) => {
    const { id } = request.params as { id: string };
    const { ativo } = request.body as { ativo: boolean };
    return toggleFornecedor(prisma, Number(id), ativo);
  });
}
