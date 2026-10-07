import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { listarProdutos, criarProduto, buscarProdutoPorId, editarProduto, alterarStatusProduto } from '../services/produto.service.js';
import { listarProdutosSchema, criarProdutoSchema, editarProdutoSchema, alterarStatusProdutoSchema } from '../schemas/produto.schema.js';
import { ValidacaoError } from '../errors/domain-errors.js';
import { env } from '../config/env.js';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';

export async function produtoRoutes(app: FastifyInstance): Promise<void> {
  const authenticate = async (req: FastifyRequest, rep: FastifyReply) =>
    app.authenticate(req, rep);
  const soAdminOuOperador = async (req: FastifyRequest, rep: FastifyReply) =>
    app.requirePerfil(['ADMIN', 'OPERADOR'])(req, rep);
  const soAdmin = async (req: FastifyRequest, rep: FastifyReply) =>
    app.requirePerfil(['ADMIN'])(req, rep);
  const authAny = [authenticate, soAdminOuOperador];
  const authAdmin = [authenticate, soAdmin];

  // GET /produtos
  app.get('/produtos', { preHandler: authAny }, async (request) => {
    const parse = listarProdutosSchema.safeParse(request.query);
    if (!parse.success) {
      throw new ValidacaoError('Parâmetros inválidos', parse.error.flatten().fieldErrors);
    }
    const { data, total } = await listarProdutos(prisma, parse.data);
    return { data, meta: { total, page: parse.data.page, pageSize: parse.data.pageSize } };
  });

  // GET /produtos/:id
  app.get('/produtos/:id', { preHandler: authAny }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const produto = await buscarProdutoPorId(prisma, Number(id));
    if (!produto) return reply.status(404).send({ message: 'Produto não encontrado' });
    return produto;
  });

  // PATCH /produtos/:id/status
  app.patch('/produtos/:id/status', { preHandler: authAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parse = alterarStatusProdutoSchema.safeParse(request.body);
    if (!parse.success) {
      throw new ValidacaoError('Dados inválidos', parse.error.flatten().fieldErrors);
    }
    const produto = await alterarStatusProduto(prisma, Number(id), parse.data);
    if (!produto) return reply.status(404).send({ message: 'Produto não encontrado' });
    return produto;
  });

  // PATCH /produtos/:id
  app.patch('/produtos/:id', { preHandler: authAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parse = editarProdutoSchema.safeParse(request.body);
    if (!parse.success) {
      throw new ValidacaoError('Dados inválidos', parse.error.flatten().fieldErrors);
    }
    const produto = await editarProduto(prisma, Number(id), parse.data);
    if (!produto) return reply.status(404).send({ message: 'Produto não encontrado' });
    return produto;
  });

  // POST /produtos
  app.post('/produtos', { preHandler: authAdmin }, async (request, reply) => {
    const parse = criarProdutoSchema.safeParse(request.body);
    if (!parse.success) {
      throw new ValidacaoError('Dados inválidos', parse.error.flatten().fieldErrors);
    }
    const produto = await criarProduto(prisma, parse.data, Number(request.user.sub));
    return reply.status(201).send(produto);
  });

  // POST /produtos/:id/foto
  app.post('/produtos/:id/foto', { preHandler: authAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const produto = await buscarProdutoPorId(prisma, Number(id));
    if (!produto) return reply.status(404).send({ message: 'Produto não encontrado' });

    const data = await request.file();
    if (!data) return reply.status(400).send({ message: 'Nenhum arquivo enviado' });

    const ext = extname(data.filename).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      return reply.status(400).send({ message: 'Formato inválido. Use JPG, PNG ou WebP' });
    }

    const buffer = await data.toBuffer();
    if (buffer.length > 2 * 1024 * 1024) {
      return reply.status(400).send({ message: 'Arquivo muito grande. Máximo 2MB' });
    }

    const uploadDir = join(process.cwd(), env.UPLOAD_DIR);
    await mkdir(uploadDir, { recursive: true });

    const filename = `${produto.sku}-${Date.now()}${ext}`;
    await writeFile(join(uploadDir, filename), buffer);

    const fotoUrl = filename;
    await prisma.produto.update({ where: { id: Number(id) }, data: { fotoUrl } });

    return { fotoUrl };
  });
}
