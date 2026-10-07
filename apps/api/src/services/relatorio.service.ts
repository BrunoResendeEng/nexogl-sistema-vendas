import type { PrismaClient } from '@repo/db';

// ─── Vendas por período ───────────────────────────────────────────────────────

export type RelatorioVendasItem = {
  id: number;
  numero: string;
  clienteNome: string | null;
  formaPagamento: string;
  subtotal: number;
  descontoAplicado: number;
  total: number;
  usuarioNome: string;
  criadoEm: Date;
  totalItens: number;
};

export type RelatorioVendasResumo = {
  totalVendas: number;
  totalFaturamento: number;
  totalDesconto: number;
  porFormaPagamento: { forma: string; quantidade: number; total: number }[];
};

export async function relatorioVendas(
  prisma: PrismaClient,
  dataInicio: string,
  dataFim: string,
): Promise<{ itens: RelatorioVendasItem[]; resumo: RelatorioVendasResumo }> {
  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim + 'T23:59:59');

  const vendas = await prisma.venda.findMany({
    where: { criadoEm: { gte: inicio, lte: fim }, canceladoEm: null },
    orderBy: { criadoEm: 'desc' },
    include: {
      usuario: { select: { nome: true } },
      _count: { select: { itens: true } },
    },
  });

  const itens: RelatorioVendasItem[] = vendas.map((v) => ({
    id: v.id,
    numero: v.numero,
    clienteNome: v.clienteNome,
    formaPagamento: v.formaPagamento as string,
    subtotal: Number(v.subtotal),
    descontoAplicado: Number(v.descontoAplicado),
    total: Number(v.total),
    usuarioNome: v.usuario.nome,
    criadoEm: v.criadoEm,
    totalItens: v._count.itens,
  }));

  const totalFaturamento = itens.reduce((s, v) => s + v.total, 0);
  const totalDesconto = itens.reduce((s, v) => s + v.descontoAplicado, 0);

  const agrupado = itens.reduce<Record<string, { quantidade: number; total: number }>>((acc, v) => {
    const f = v.formaPagamento;
    if (!acc[f]) acc[f] = { quantidade: 0, total: 0 };
    acc[f]!.quantidade += 1;
    acc[f]!.total += v.total;
    return acc;
  }, {});

  const porFormaPagamento = Object.entries(agrupado).map(([forma, val]) => ({
    forma,
    quantidade: val.quantidade,
    total: val.total,
  }));

  return {
    itens,
    resumo: {
      totalVendas: itens.length,
      totalFaturamento,
      totalDesconto,
      porFormaPagamento,
    },
  };
}

// ─── Mais vendidos ────────────────────────────────────────────────────────────

export type MaisVendidoItem = {
  produtoId: number;
  produtoSku: string;
  produtoNome: string;
  categoria: string;
  totalQuantidade: number;
  totalReceita: number;
};

export async function relatorioMaisVendidos(
  prisma: PrismaClient,
  dataInicio: string,
  dataFim: string,
  limit = 20,
): Promise<MaisVendidoItem[]> {
  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim + 'T23:59:59');

  const rows = await prisma.$queryRaw<{
    produtoId: number;
    sku: string;
    nome: string;
    categoria: string;
    totalQuantidade: bigint;
    totalReceita: number;
  }[]>`
    SELECT
      iv.produto_id AS "produtoId",
      p.sku,
      p.nome,
      p.categoria::text,
      SUM(iv.quantidade)::bigint AS "totalQuantidade",
      SUM(iv.subtotal)::float AS "totalReceita"
    FROM item_venda iv
    JOIN produto p ON p.id = iv.produto_id
    JOIN venda v ON v.id = iv.venda_id
    WHERE v.criado_em >= ${inicio}
      AND v.criado_em <= ${fim}
      AND v.cancelado_em IS NULL
    GROUP BY iv.produto_id, p.sku, p.nome, p.categoria
    ORDER BY "totalQuantidade" DESC
    LIMIT ${limit}
  `;

  return rows.map((r) => ({
    produtoId: r.produtoId,
    produtoSku: r.sku,
    produtoNome: r.nome,
    categoria: r.categoria,
    totalQuantidade: Number(r.totalQuantidade),
    totalReceita: Number(r.totalReceita),
  }));
}

// ─── Produtos parados ─────────────────────────────────────────────────────────

export type ProdutoParadoItem = {
  id: number;
  sku: string;
  nome: string;
  categoria: string;
  estoqueAtual: number;
  custoMedio: number;
  valorEstoque: number;
  ultimaMovimentacao: Date | null;
  diasParado: number;
};

export async function relatorioProdutosParados(
  prisma: PrismaClient,
  diasSemMovimentacao = 90,
): Promise<ProdutoParadoItem[]> {
  const corte = new Date();
  corte.setDate(corte.getDate() - diasSemMovimentacao);

  const rows = await prisma.$queryRaw<{
    id: number;
    sku: string;
    nome: string;
    categoria: string;
    estoqueAtual: number;
    custoMedio: number;
    ultimaMovimentacao: Date | null;
  }[]>`
    SELECT
      p.id,
      p.sku,
      p.nome,
      p.categoria::text,
      p.estoque_atual AS "estoqueAtual",
      p.custo_medio::float AS "custoMedio",
      MAX(m.criado_em) AS "ultimaMovimentacao"
    FROM produto p
    LEFT JOIN movimentacao m ON m.produto_id = p.id
    WHERE p.ativo = true AND p.estoque_atual > 0
    GROUP BY p.id, p.sku, p.nome, p.categoria, p.estoque_atual, p.custo_medio
    HAVING MAX(m.criado_em) IS NULL OR MAX(m.criado_em) < ${corte}
    ORDER BY "ultimaMovimentacao" ASC NULLS FIRST
  `;

  const agora = new Date();
  return rows.map((r) => {
    const ultima = r.ultimaMovimentacao;
    const diasParado = ultima
      ? Math.floor((agora.getTime() - new Date(ultima).getTime()) / 86400000)
      : diasSemMovimentacao;
    return {
      id: r.id,
      sku: r.sku,
      nome: r.nome,
      categoria: r.categoria,
      estoqueAtual: Number(r.estoqueAtual),
      custoMedio: Number(r.custoMedio),
      valorEstoque: Number(r.estoqueAtual) * Number(r.custoMedio),
      ultimaMovimentacao: ultima ? new Date(ultima) : null,
      diasParado,
    };
  });
}

// ─── Posição de estoque ───────────────────────────────────────────────────────

export type PosicaoEstoqueItem = {
  id: number;
  sku: string;
  nome: string;
  categoria: string;
  unidade: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  custoMedio: number;
  precoVenda: number | null;
  valorEstoque: number;
  status: 'OK' | 'BAIXO' | 'SEM_ESTOQUE';
};

export async function relatorioPosicaoEstoque(
  prisma: PrismaClient,
): Promise<{ itens: PosicaoEstoqueItem[]; totalValorEstoque: number }> {
  const produtos = await prisma.produto.findMany({
    where: { ativo: true },
    orderBy: [{ categoria: 'asc' }, { nome: 'asc' }],
    select: {
      id: true, sku: true, nome: true, categoria: true, unidade: true,
      estoqueAtual: true, estoqueMinimo: true, custoMedio: true, precoVenda: true,
    },
  });

  const itens: PosicaoEstoqueItem[] = produtos.map((p) => {
    const estoqueAtual = p.estoqueAtual;
    const estoqueMinimo = p.estoqueMinimo;
    const custoMedio = Number(p.custoMedio);
    const status: PosicaoEstoqueItem['status'] =
      estoqueAtual === 0 ? 'SEM_ESTOQUE' : estoqueAtual <= estoqueMinimo ? 'BAIXO' : 'OK';
    return {
      id: p.id,
      sku: p.sku,
      nome: p.nome,
      categoria: p.categoria as string,
      unidade: p.unidade as string,
      estoqueAtual,
      estoqueMinimo,
      custoMedio,
      precoVenda: p.precoVenda ? Number(p.precoVenda) : null,
      valorEstoque: estoqueAtual * custoMedio,
      status,
    };
  });

  const totalValorEstoque = itens.reduce((s, p) => s + p.valorEstoque, 0);
  return { itens, totalValorEstoque };
}
