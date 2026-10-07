import type { PrismaClient } from '@repo/db';
import type { CriarVendaBody, ListarVendasQuery } from '../schemas/venda.schema.js';
import { EstoqueInsuficienteError, VendaJaCanceladaError } from '../errors/domain-errors.js';

export type ItemVendaDetalhe = {
  id: number;
  produtoId: number;
  produtoNome: string;
  produtoSku: string;
  quantidade: number;
  precoUnitario: number;
  custoUnitario: number;
  subtotal: number;
};

export type VendaDetalhe = {
  id: number;
  numero: string;
  clienteNome: string | null;
  clienteTelefone: string | null;
  clienteCpf: string | null;
  formaPagamento: string;
  subtotal: number;
  descontoPercentual: number;
  descontoAplicado: number;
  total: number;
  observacao: string | null;
  usuarioId: number;
  usuarioNome: string;
  criadoEm: Date;
  canceladoEm: Date | null;
  canceladoPorNome: string | null;
  itens: ItemVendaDetalhe[];
};

export type VendaListItem = Omit<VendaDetalhe, 'itens'>;

export async function criarVenda(
  prisma: PrismaClient,
  body: CriarVendaBody,
  usuarioId: number,
): Promise<VendaDetalhe> {
  return prisma.$transaction(async (tx) => {
    const txp = tx as PrismaClient;

    // Busca produtos e valida estoque
    const produtos = await txp.produto.findMany({
      where: { id: { in: body.itens.map((i) => i.produtoId) }, ativo: true },
      select: { id: true, nome: true, sku: true, estoqueAtual: true, custoMedio: true, precoVenda: true },
    });

    for (const item of body.itens) {
      const p = produtos.find((x) => x.id === item.produtoId);
      if (!p) throw new EstoqueInsuficienteError(item.produtoId, 0, item.quantidade);
      if (p.estoqueAtual < item.quantidade) {
        throw new EstoqueInsuficienteError(item.produtoId, p.estoqueAtual, item.quantidade);
      }
    }

    // Calcula totais
    const itensCalc = body.itens.map((item) => {
      const p = produtos.find((x) => x.id === item.produtoId)!;
      const preco = p.precoVenda ? Number(p.precoVenda) : 0;
      return {
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        precoUnitario: preco,
        custoUnitario: Number(p.custoMedio),
        subtotal: preco * item.quantidade,
      };
    });

    const subtotal = itensCalc.reduce((s, i) => s + i.subtotal, 0);
    const aplicarDesconto = body.formaPagamento === 'PIX' && body.aplicarDescontoPix;
    const descontoPercentual = aplicarDesconto ? 5 : 0;
    const descontoAplicado = Number((subtotal * descontoPercentual / 100).toFixed(2));
    const total = Number((subtotal - descontoAplicado).toFixed(2));

    // Gera número da venda atomicamente
    const seq = await txp.$queryRawUnsafe<{ proximo: number }[]>(
      `INSERT INTO venda_sequencia (id, proximo) VALUES (1, 2)
       ON CONFLICT (id) DO UPDATE SET proximo = venda_sequencia.proximo + 1
       RETURNING proximo - 1 AS proximo`,
    );
    const numero = `VND-${String(seq[0]!.proximo).padStart(5, '0')}`;

    // Cria a venda
    const venda = await txp.venda.create({
      data: {
        numero,
        clienteNome: body.clienteNome,
        clienteTelefone: body.clienteTelefone,
        clienteCpf: body.clienteCpf,
        formaPagamento: body.formaPagamento,
        subtotal,
        descontoPercentual,
        descontoAplicado,
        total,
        observacao: body.observacao,
        usuarioId,
        itens: { create: itensCalc },
      },
      include: {
        itens: { include: { produto: { select: { nome: true, sku: true } } } },
        usuario: { select: { nome: true } },
      },
    });

    // Cria movimentações SAIDA e atualiza estoque
    for (const item of itensCalc) {
      await txp.movimentacao.create({
        data: {
          tipo: 'SAIDA',
          quantidade: item.quantidade,
          custoUnitario: item.custoUnitario,
          observacao: `Venda ${numero}`,
          produtoId: item.produtoId,
          usuarioId,
        },
      });
      await txp.produto.update({
        where: { id: item.produtoId },
        data: { estoqueAtual: { decrement: item.quantidade } },
      });
    }

    return {
      id: venda.id,
      numero: venda.numero,
      clienteNome: venda.clienteNome,
      clienteTelefone: venda.clienteTelefone,
      clienteCpf: venda.clienteCpf,
      formaPagamento: venda.formaPagamento as string,
      subtotal: Number(venda.subtotal),
      descontoPercentual: Number(venda.descontoPercentual),
      descontoAplicado: Number(venda.descontoAplicado),
      total: Number(venda.total),
      observacao: venda.observacao,
      usuarioId: venda.usuarioId,
      usuarioNome: venda.usuario.nome,
      criadoEm: venda.criadoEm,
      canceladoEm: null,
      canceladoPorNome: null,
      itens: venda.itens.map((i) => ({
        id: i.id,
        produtoId: i.produtoId,
        produtoNome: i.produto.nome,
        produtoSku: i.produto.sku,
        quantidade: i.quantidade,
        precoUnitario: Number(i.precoUnitario),
        custoUnitario: Number(i.custoUnitario),
        subtotal: Number(i.subtotal),
      })),
    };
  });
}

export async function buscarVendaPorId(prisma: PrismaClient, id: number): Promise<VendaDetalhe | null> {
  const venda = await prisma.venda.findUnique({
    where: { id },
    include: {
      itens: { include: { produto: { select: { nome: true, sku: true } } } },
      usuario: { select: { nome: true } },
      canceladoPor: { select: { nome: true } },
    },
  });
  if (!venda) return null;
  return {
    id: venda.id,
    numero: venda.numero,
    clienteNome: venda.clienteNome,
    clienteTelefone: venda.clienteTelefone,
    clienteCpf: venda.clienteCpf,
    formaPagamento: venda.formaPagamento as string,
    subtotal: Number(venda.subtotal),
    descontoPercentual: Number(venda.descontoPercentual),
    descontoAplicado: Number(venda.descontoAplicado),
    total: Number(venda.total),
    observacao: venda.observacao,
    usuarioId: venda.usuarioId,
    usuarioNome: venda.usuario.nome,
    criadoEm: venda.criadoEm,
    canceladoEm: venda.canceladoEm,
    canceladoPorNome: venda.canceladoPor?.nome ?? null,
    itens: venda.itens.map((i) => ({
      id: i.id,
      produtoId: i.produtoId,
      produtoNome: i.produto.nome,
      produtoSku: i.produto.sku,
      quantidade: i.quantidade,
      precoUnitario: Number(i.precoUnitario),
      custoUnitario: Number(i.custoUnitario),
      subtotal: Number(i.subtotal),
    })),
  };
}

export async function cancelarVenda(
  prisma: PrismaClient,
  id: number,
  usuarioId: number,
): Promise<VendaDetalhe | null> {
  return prisma.$transaction(async (tx) => {
    const txp = tx as PrismaClient;

    const venda = await txp.venda.findUnique({
      where: { id },
      include: { itens: true },
    });
    if (!venda) return null;
    if (venda.canceladoEm) throw new VendaJaCanceladaError(venda.numero);

    // Devolve estoque via movimentação DEVOLUCAO
    for (const item of venda.itens) {
      const produto = await txp.produto.findUnique({
        where: { id: item.produtoId },
        select: { custoMedio: true },
      });
      await txp.movimentacao.create({
        data: {
          tipo: 'DEVOLUCAO',
          quantidade: item.quantidade,
          custoUnitario: produto ? produto.custoMedio : item.custoUnitario,
          observacao: `Cancelamento da venda ${venda.numero}`,
          produtoId: item.produtoId,
          usuarioId,
        },
      });
      await txp.produto.update({
        where: { id: item.produtoId },
        data: { estoqueAtual: { increment: item.quantidade } },
      });
    }

    await txp.venda.update({
      where: { id },
      data: { canceladoEm: new Date(), canceladoPorId: usuarioId },
    });

    return buscarVendaPorId(prisma, id);
  });
}

export async function listarVendas(
  prisma: PrismaClient,
  query: ListarVendasQuery,
): Promise<{ data: VendaListItem[]; total: number }> {
  const { page, pageSize, formaPagamento, dataInicio, dataFim } = query;

  const where = {
    ...(formaPagamento ? { formaPagamento: formaPagamento as never } : {}),
    ...(dataInicio || dataFim ? {
      criadoEm: {
        ...(dataInicio ? { gte: new Date(dataInicio) } : {}),
        ...(dataFim ? { lte: new Date(dataFim + 'T23:59:59') } : {}),
      },
    } : {}),
  };

  const [vendas, total] = await Promise.all([
    prisma.venda.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { criadoEm: 'desc' },
      include: { usuario: { select: { nome: true } } },
    }),
    prisma.venda.count({ where }),
  ]);

  return {
    data: vendas.map((v) => ({
      id: v.id,
      numero: v.numero,
      clienteNome: v.clienteNome,
      clienteTelefone: v.clienteTelefone,
      clienteCpf: v.clienteCpf,
      formaPagamento: v.formaPagamento as string,
      subtotal: Number(v.subtotal),
      descontoPercentual: Number(v.descontoPercentual),
      descontoAplicado: Number(v.descontoAplicado),
      total: Number(v.total),
      observacao: v.observacao,
      usuarioId: v.usuarioId,
      usuarioNome: v.usuario.nome,
      criadoEm: v.criadoEm,
      canceladoEm: v.canceladoEm,
      canceladoPorNome: null,
    })),
    total,
  };
}
