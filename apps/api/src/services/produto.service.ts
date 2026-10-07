import type { PrismaClient } from '@repo/db';
import type { ListarProdutosQuery, CriarProdutoBody, EditarProdutoBody, AlterarStatusProdutoBody } from '../schemas/produto.schema.js';

export type ProdutoDetalhe = ProdutoListItem & {
  descricao: string | null;
  unidade: string;
  marca: string | null;
  localizacao: string | null;
  estoqueMinimo: number;
  custoMedio: number;
  codigosBarras: string[];
};

export type ProdutoListItem = {
  id: number;
  sku: string;
  nome: string;
  categoria: string;
  aplicacao: string | null;
  estoqueAtual: number;
  estoqueMinimo: number;
  custoMedio: number;
  precoVenda: number | null;
  ativo: boolean;
};

export async function listarProdutos(
  prisma: PrismaClient,
  query: ListarProdutosQuery,
): Promise<{ data: ProdutoListItem[]; total: number }> {
  const { search, categoria, ativo, page, pageSize } = query;

  const where = {
    ...(ativo !== undefined ? { ativo } : {}),
    ...(categoria ? { categoria: categoria as never } : {}),
    ...(search
      ? {
          OR: [
            { nome: { contains: search, mode: 'insensitive' as const } },
            { sku: { contains: search, mode: 'insensitive' as const } },
            { aplicacao: { contains: search, mode: 'insensitive' as const } },
            {
              codigosBarras: {
                some: { codigo: { contains: search, mode: 'insensitive' as const } },
              },
            },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.produto.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { criadoEm: 'desc' },
      select: {
        id: true,
        sku: true,
        nome: true,
        categoria: true,
        aplicacao: true,
        estoqueAtual: true,
        estoqueMinimo: true,
        custoMedio: true,
        precoVenda: true,
        ativo: true,
      },
    }),
    prisma.produto.count({ where }),
  ]);

  return {
    data: data.map((p) => ({
      ...p,
      categoria: p.categoria as string,
      custoMedio: Number(p.custoMedio),
      precoVenda: p.precoVenda ? Number(p.precoVenda) : null,
    })),
    total,
  };
}

export async function alterarStatusProduto(
  prisma: PrismaClient,
  id: number,
  body: AlterarStatusProdutoBody,
): Promise<ProdutoListItem | null> {
  const existe = await prisma.produto.findUnique({ where: { id }, select: { id: true } });
  if (!existe) return null;
  const p = await prisma.produto.update({
    where: { id },
    data: { ativo: body.ativo },
    select: {
      id: true, sku: true, nome: true, categoria: true, aplicacao: true,
      estoqueAtual: true, estoqueMinimo: true, custoMedio: true, precoVenda: true, ativo: true,
    },
  });
  return {
    ...p,
    categoria: p.categoria as string,
    custoMedio: Number(p.custoMedio),
    precoVenda: p.precoVenda ? Number(p.precoVenda) : null,
  };
}

export async function buscarProdutoPorId(prisma: PrismaClient, id: number): Promise<ProdutoDetalhe | null> {
  const p = await prisma.produto.findUnique({
    where: { id },
    select: {
      id: true, sku: true, nome: true, descricao: true, categoria: true,
      unidade: true, marca: true, aplicacao: true, localizacao: true,
      estoqueAtual: true, estoqueMinimo: true, custoMedio: true,
      precoVenda: true, ativo: true,
      codigosBarras: { select: { codigo: true } },
    },
  });
  if (!p) return null;
  return {
    ...p,
    categoria: p.categoria as string,
    unidade: p.unidade as string,
    custoMedio: Number(p.custoMedio),
    precoVenda: p.precoVenda ? Number(p.precoVenda) : null,
    codigosBarras: p.codigosBarras.map((c) => c.codigo),
  };
}

export async function editarProduto(
  prisma: PrismaClient,
  id: number,
  body: EditarProdutoBody,
): Promise<ProdutoDetalhe | null> {
  const { codigosBarras, ...rest } = body;

  const existe = await prisma.produto.findUnique({ where: { id }, select: { id: true } });
  if (!existe) return null;

  if (codigosBarras?.length) {
    const existentes = await prisma.codigo.findMany({
      where: { codigo: { in: codigosBarras }, NOT: { produtoId: id } },
      select: { codigo: true, produto: { select: { sku: true, nome: true } } },
    });
    if (existentes.length > 0) {
      const lista = existentes.map((c) => `${c.codigo} (${c.produto.sku} - ${c.produto.nome})`).join(', ');
      throw new Error(`Código(s) de barras já cadastrado(s) em outro produto: ${lista}`);
    }
  }

  await prisma.$transaction(async (tx) => {
    await (tx as PrismaClient).produto.update({ where: { id }, data: rest });

    if (codigosBarras !== undefined) {
      await (tx as PrismaClient).codigo.deleteMany({ where: { produtoId: id } });
      if (codigosBarras.length > 0) {
        await (tx as PrismaClient).codigo.createMany({
          data: codigosBarras.map((c) => ({ codigo: c, produtoId: id })),
        });
      }
    }
  });

  return buscarProdutoPorId(prisma, id);
}

export async function criarProduto(
  prisma: PrismaClient,
  body: CriarProdutoBody,
  usuarioId: number,
): Promise<ProdutoListItem> {
  const { codigosBarras, estoqueInicial, estoqueMinimo, precoVenda, custoUnitario, ...rest } = body;

  if (codigosBarras?.length) {
    const existentes = await prisma.codigo.findMany({
      where: { codigo: { in: codigosBarras } },
      select: { codigo: true, produto: { select: { sku: true, nome: true } } },
    });
    if (existentes.length > 0) {
      const lista = existentes.map((c) => `${c.codigo} (${c.produto.sku} - ${c.produto.nome})`).join(', ');
      throw new Error(`Código(s) de barras já cadastrado(s) em outro produto: ${lista}`);
    }
  }

  const produto = await prisma.$transaction(async (tx) => {
    // Gera SKU atomicamente
    const seq = await (tx as PrismaClient).$queryRawUnsafe<{ proximo: number }[]>(
      `SELECT proximo FROM sku_sequencia WHERE categoria = $1::"Categoria" FOR UPDATE`,
      rest.categoria,
    );

    let numero: number;
    if (seq.length === 0) {
      await (tx as PrismaClient).$executeRawUnsafe(
        `INSERT INTO sku_sequencia (categoria, proximo) VALUES ($1::"Categoria", 2)`,
        rest.categoria,
      );
      numero = 1;
    } else {
      numero = seq[0]!.proximo;
      await (tx as PrismaClient).$executeRawUnsafe(
        `UPDATE sku_sequencia SET proximo = proximo + 1 WHERE categoria = $1::"Categoria"`,
        rest.categoria,
      );
    }

    const sku = `${rest.categoria}-${String(numero).padStart(5, '0')}`;

    const novo = await (tx as PrismaClient).produto.create({
      data: {
        ...rest,
        sku,
        estoqueAtual: 0,
        estoqueMinimo: estoqueMinimo ?? 0,
        precoVenda: precoVenda ?? null,
        codigosBarras: codigosBarras?.length
          ? { create: codigosBarras.map((c) => ({ codigo: c })) }
          : undefined,
      },
      select: {
        id: true, sku: true, nome: true, categoria: true, aplicacao: true,
        estoqueAtual: true, estoqueMinimo: true, custoMedio: true, precoVenda: true, ativo: true,
      },
    });

    // Estoque inicial via movimentação — nunca update direto
    if (estoqueInicial > 0) {
      await (tx as PrismaClient).movimentacao.create({
        data: {
          tipo: 'ENTRADA',
          quantidade: estoqueInicial,
          custoUnitario: custoUnitario ?? 0,
          observacao: 'Estoque inicial no cadastro',
          produtoId: novo.id,
          usuarioId,
        },
      });
      await (tx as PrismaClient).produto.update({
        where: { id: novo.id },
        data: { estoqueAtual: estoqueInicial, custoMedio: custoUnitario ?? 0 },
      });
      novo.estoqueAtual = estoqueInicial;
    }

    return novo;
  });

  return {
    ...produto,
    categoria: produto.categoria as string,
    custoMedio: Number(produto.custoMedio),
    precoVenda: produto.precoVenda ? Number(produto.precoVenda) : null,
  };
}
