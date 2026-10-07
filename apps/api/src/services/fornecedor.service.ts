import type { PrismaClient } from '@repo/db';
import { validarCnpj } from '@repo/utils';
import type { CriarFornecedorBody, AtualizarFornecedorBody, ListarFornecedoresQuery } from '../schemas/fornecedor.schema.js';
import { CnpjInvalidoError, CnpjDuplicadoError, FornecedorNaoEncontradoError } from '../errors/domain-errors.js';

export type FornecedorItem = {
  id: number;
  razaoSocial: string;
  cnpj: string;
  telefone: string | null;
  email: string | null;
  contato: string | null;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
};

export async function listarFornecedores(
  prisma: PrismaClient,
  query: ListarFornecedoresQuery,
): Promise<{ data: FornecedorItem[]; total: number }> {
  const { search, ativo, page, pageSize } = query;

  const where = {
    ...(ativo !== undefined ? { ativo: ativo === 'true' } : {}),
    ...(search
      ? {
          OR: [
            { razaoSocial: { contains: search, mode: 'insensitive' as const } },
            { cnpj: { contains: search } },
          ],
        }
      : {}),
  };

  const [fornecedores, total] = await Promise.all([
    prisma.fornecedor.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { razaoSocial: 'asc' },
    }),
    prisma.fornecedor.count({ where }),
  ]);

  return { data: fornecedores, total };
}

export async function buscarFornecedorPorId(
  prisma: PrismaClient,
  id: number,
): Promise<FornecedorItem | null> {
  return prisma.fornecedor.findUnique({ where: { id } });
}

export async function criarFornecedor(
  prisma: PrismaClient,
  body: CriarFornecedorBody,
): Promise<FornecedorItem> {
  if (!validarCnpj(body.cnpj)) throw new CnpjInvalidoError(body.cnpj);

  const existe = await prisma.fornecedor.findUnique({ where: { cnpj: body.cnpj } });
  if (existe) throw new CnpjDuplicadoError(body.cnpj);

  return prisma.fornecedor.create({
    data: {
      razaoSocial: body.razaoSocial,
      cnpj: body.cnpj,
      telefone: body.telefone ?? null,
      email: body.email || null,
      contato: body.contato ?? null,
    },
  });
}

export async function atualizarFornecedor(
  prisma: PrismaClient,
  id: number,
  body: AtualizarFornecedorBody,
): Promise<FornecedorItem> {
  const fornecedor = await prisma.fornecedor.findUnique({ where: { id } });
  if (!fornecedor) throw new FornecedorNaoEncontradoError(id);

  if (body.cnpj && body.cnpj !== fornecedor.cnpj) {
    if (!validarCnpj(body.cnpj)) throw new CnpjInvalidoError(body.cnpj);
    const existe = await prisma.fornecedor.findUnique({ where: { cnpj: body.cnpj } });
    if (existe) throw new CnpjDuplicadoError(body.cnpj);
  }

  return prisma.fornecedor.update({
    where: { id },
    data: {
      ...(body.razaoSocial !== undefined ? { razaoSocial: body.razaoSocial } : {}),
      ...(body.cnpj !== undefined ? { cnpj: body.cnpj } : {}),
      ...(body.telefone !== undefined ? { telefone: body.telefone } : {}),
      ...(body.email !== undefined ? { email: body.email || null } : {}),
      ...(body.contato !== undefined ? { contato: body.contato } : {}),
    },
  });
}

export async function toggleFornecedor(
  prisma: PrismaClient,
  id: number,
  ativo: boolean,
): Promise<FornecedorItem> {
  const fornecedor = await prisma.fornecedor.findUnique({ where: { id } });
  if (!fornecedor) throw new FornecedorNaoEncontradoError(id);
  return prisma.fornecedor.update({ where: { id }, data: { ativo } });
}
