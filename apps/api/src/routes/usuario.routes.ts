import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';
import {
  listarUsuarios,
  criarUsuario,
  editarUsuario,
  alterarStatusUsuario,
  excluirUsuario,
} from '../services/auth.service.js';
import {
  criarUsuarioSchema,
  editarUsuarioSchema,
  statusUsuarioSchema,
} from '../schemas/auth.schema.js';
import { ValidacaoError } from '../errors/domain-errors.js';

export async function usuarioRoutes(app: FastifyInstance): Promise<void> {
  const authenticate = async (req: FastifyRequest, rep: FastifyReply) =>
    app.authenticate(req, rep);
  const soAdmin = async (req: FastifyRequest, rep: FastifyReply) =>
    app.requirePerfil(['ADMIN'])(req, rep);
  const adminOnly = [authenticate, soAdmin];

  // GET /usuarios
  app.get('/usuarios', { preHandler: adminOnly }, async (request) => {
    const query = request.query as Record<string, string>;
    const page = Math.max(1, parseInt(query['page'] ?? '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(query['pageSize'] ?? '20', 10)));
    const { data, total } = await listarUsuarios(prisma, page, pageSize);
    return { data, meta: { total, page, pageSize } };
  });

  // POST /usuarios
  app.post('/usuarios', { preHandler: adminOnly }, async (request, reply) => {
    const parse = criarUsuarioSchema.safeParse(request.body);
    if (!parse.success) {
      throw new ValidacaoError('Dados inválidos', parse.error.flatten().fieldErrors);
    }
    const usuario = await criarUsuario(prisma, parse.data);
    return reply.status(201).send({ data: usuario });
  });

  // PATCH /usuarios/:id
  app.patch('/usuarios/:id', { preHandler: adminOnly }, async (request) => {
    const { id } = request.params as { id: string };
    const parse = editarUsuarioSchema.safeParse(request.body);
    if (!parse.success) {
      throw new ValidacaoError('Dados inválidos', parse.error.flatten().fieldErrors);
    }
    const usuario = await editarUsuario(prisma, Number(id), parse.data);
    return { data: usuario };
  });

  // PATCH /usuarios/:id/status
  app.patch('/usuarios/:id/status', { preHandler: adminOnly }, async (request) => {
    const { id } = request.params as { id: string };
    const parse = statusUsuarioSchema.safeParse(request.body);
    if (!parse.success) {
      throw new ValidacaoError('Dados inválidos', parse.error.flatten().fieldErrors);
    }
    const resultado = await alterarStatusUsuario(
      prisma,
      Number(id),
      parse.data.ativo,
      Number(request.user.sub),
      request.user.perfil,
    );
    return { data: resultado };
  });

  // DELETE /usuarios/:id
  app.delete('/usuarios/:id', { preHandler: adminOnly }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await excluirUsuario(prisma, Number(id), Number(request.user.sub), request.user.perfil);
    return reply.status(204).send();
  });
}
