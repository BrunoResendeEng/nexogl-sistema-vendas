import type { PrismaClient } from '@repo/db';

export async function getDashboard(prisma: PrismaClient, dias = 7) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const fimHoje = new Date();
  fimHoje.setHours(23, 59, 59, 999);
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const inicioDias = new Date(hoje);
  inicioDias.setDate(inicioDias.getDate() - (dias - 1));

  const [
    totalProdutos,
    totalUsuarios,
    semEstoque,
    vendasHoje,
    vendasMes,
    totalVendasMes,
    ultimasVendas,
    grafico7dias,
  ] = await Promise.all([
    prisma.produto.count({ where: { ativo: true } }),
    prisma.usuario.count({ where: { ativo: true } }),
    prisma.produto.count({ where: { ativo: true, estoqueAtual: 0 } }),
    prisma.venda.count({ where: { criadoEm: { gte: hoje, lte: fimHoje }, canceladoEm: null } }),
    prisma.venda.count({ where: { criadoEm: { gte: inicioMes }, canceladoEm: null } }),
    prisma.venda.aggregate({
      where: { criadoEm: { gte: inicioMes }, canceladoEm: null },
      _sum: { total: true },
    }),
    prisma.venda.findMany({
      where: { canceladoEm: null },
      orderBy: { criadoEm: 'desc' },
      take: 5,
      include: { usuario: { select: { nome: true } } },
    }),
    prisma.$queryRaw<{ dia: string; total: number; quantidade: number }[]>`
      SELECT
        TO_CHAR(DATE_TRUNC('day', criado_em), 'YYYY-MM-DD') AS dia,
        SUM(total)::float AS total,
        COUNT(*)::int AS quantidade
      FROM venda
      WHERE criado_em >= ${inicioDias}
        AND cancelado_em IS NULL
      GROUP BY DATE_TRUNC('day', criado_em)
      ORDER BY dia ASC
    `,
  ]);

  // Preenche dias sem venda com zero
  const mapaGrafico = new Map(grafico7dias.map((r) => [r.dia, r]));
  const grafico = Array.from({ length: dias }, (_, i) => {
    const d = new Date(inicioDias);
    d.setDate(d.getDate() + i);
    const dia = d.toISOString().slice(0, 10);
    const entry = mapaGrafico.get(dia);
    return {
      dia,
      label: d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
      total: entry ? Number(entry.total) : 0,
      quantidade: entry ? Number(entry.quantidade) : 0,
    };
  });

  // Produtos com estoque <= mínimo (crítico + sem estoque)
  const produtosCriticos = await prisma.$queryRaw<{
    id: number; sku: string; nome: string;
    estoqueAtual: number; estoqueMinimo: number; categoria: string;
  }[]>`
    SELECT id, sku, nome, estoque_atual, estoque_minimo, categoria::text
    FROM produto
    WHERE ativo = true AND estoque_atual <= estoque_minimo
    ORDER BY estoque_atual ASC
    LIMIT 8
  `;

  const estoqueCritico = produtosCriticos.length;

  return {
    cards: {
      totalProdutos,
      totalUsuarios,
      estoqueCritico,
      semEstoque,
      vendasHoje,
      vendasMes,
      totalVendasMes: Number(totalVendasMes._sum.total ?? 0),
    },
    ultimasVendas: ultimasVendas.map((v) => ({
      id: v.id,
      numero: v.numero,
      clienteNome: v.clienteNome,
      formaPagamento: v.formaPagamento as string,
      total: Number(v.total),
      usuarioNome: v.usuario.nome,
      criadoEm: v.criadoEm,
    })),
    produtosCriticos: produtosCriticos.map((p) => ({
      id: p.id,
      sku: p.sku,
      nome: p.nome,
      categoria: p.categoria,
      estoqueAtual: Number(p.estoqueAtual),
      estoqueMinimo: Number(p.estoqueMinimo),
    })),
    grafico7dias: grafico,
  };
}
