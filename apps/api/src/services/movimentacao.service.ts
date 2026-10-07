import type { PrismaClient } from '@repo/db';
import { calcularCustoMedio } from '@repo/utils';
import type { CriarMovimentacaoBody, ListarMovimentacoesQuery } from '../schemas/movimentacao.schema.js';

export type MovimentacaoItem = {
  id: number;
  tipo: string;
  quantidade: number;
  custoUnitario: number;
  observacao: string | null;
  produtoId: number;
  produtoNome: string;
  produtoSku: string;
  usuarioId: number;
  usuarioNome: string;
  criadoEm: Date;
};

export async function criarMovimentacao(
  prisma: PrismaClient,
  body: CriarMovimentacaoBody,
  usuarioId: number,
): Promise<MovimentacaoItem> {
  return prisma.$transaction(async (tx) => {
    const txp = tx as PrismaClient;

    const produto = await txp.produto.findUnique({
      where: { id: body.produtoId, ativo: true },
      select: { id: true, nome: true, sku: true, estoqueAtual: true, custoMedio: true },
    });
    if (!produto) throw new Error('Produto não encontrado ou inativo');

    // Calcula novo estoque e custo médio
    let novoEstoque: number;
    let novoCustoMedio: number | undefined;

    if (body.tipo === 'ENTRADA') {
      novoEstoque = produto.estoqueAtual + body.quantidade;
      novoCustoMedio = calcularCustoMedio(
        produto.estoqueAtual,
        Number(produto.custoMedio),
        body.quantidade,
        body.custoUnitario!,
      );
    } else if (body.tipo === 'AJUSTE') {
      novoEstoque = produto.estoqueAtual + body.quantidade;
    } else if (body.tipo === 'PERDA') {
      novoEstoque = produto.estoqueAtual - body.quantidade;
    } else {
      // DEVOLUCAO
      novoEstoque = produto.estoqueAtual + body.quantidade;
    }

    if (novoEstoque < 0) throw new Error(`Estoque insuficiente. Atual: ${produto.estoqueAtual}`);

    const mov = await txp.movimentacao.create({
      data: {
        tipo: body.tipo as never,
        quantidade: body.quantidade,
        custoUnitario: body.custoUnitario ?? Number(produto.custoMedio),
        observacao: body.observacao,
        produtoId: body.produtoId,
        usuarioId,
        fornecedorId: body.fornecedorId,
      },
      include: {
        produto: { select: { nome: true, sku: true } },
        usuario: { select: { nome: true } },
      },
    });

    await txp.produto.update({
      where: { id: body.produtoId },
      data: {
        estoqueAtual: novoEstoque,
        ...(novoCustoMedio !== undefined ? { custoMedio: novoCustoMedio } : {}),
      },
    });

    return {
      id: mov.id,
      tipo: mov.tipo as string,
      quantidade: mov.quantidade,
      custoUnitario: Number(mov.custoUnitario),
      observacao: mov.observacao,
      produtoId: mov.produtoId,
      produtoNome: mov.produto.nome,
      produtoSku: mov.produto.sku,
      usuarioId: mov.usuarioId,
      usuarioNome: mov.usuario.nome,
      criadoEm: mov.criadoEm,
    };
  });
}

export async function listarMovimentacoes(
  prisma: PrismaClient,
  query: ListarMovimentacoesQuery,
): Promise<{ data: MovimentacaoItem[]; total: number }> {
  const { produtoId, tipo, dataInicio, dataFim, page, pageSize } = query;

  const where = {
    ...(produtoId ? { produtoId } : {}),
    ...(tipo ? { tipo: tipo as never } : {}),
    ...((dataInicio || dataFim) ? {
      criadoEm: {
        ...(dataInicio ? { gte: new Date(dataInicio) } : {}),
        ...(dataFim ? { lte: new Date(dataFim + 'T23:59:59') } : {}),
      },
    } : {}),
  };

  const [movs, total] = await Promise.all([
    prisma.movimentacao.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { criadoEm: 'desc' },
      include: {
        produto: { select: { nome: true, sku: true } },
        usuario: { select: { nome: true } },
      },
    }),
    prisma.movimentacao.count({ where }),
  ]);

  return {
    data: movs.map((m) => ({
      id: m.id,
      tipo: m.tipo as string,
      quantidade: m.quantidade,
      custoUnitario: Number(m.custoUnitario),
      observacao: m.observacao,
      produtoId: m.produtoId,
      produtoNome: m.produto.nome,
      produtoSku: m.produto.sku,
      usuarioId: m.usuarioId,
      usuarioNome: m.usuario.nome,
      criadoEm: m.criadoEm,
    })),
    total,
  };
}
