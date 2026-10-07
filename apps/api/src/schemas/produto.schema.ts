import { z } from 'zod';

const categoriaEnum = z.enum(['MOT', 'FRE', 'TRA', 'ELE', 'SUS', 'PNE', 'ACC', 'OUT']);
const unidadeEnum = z.enum(['UN', 'CX', 'PC', 'KG', 'L']);

export const criarProdutoSchema = z.object({
  nome: z.string().min(2).max(200),
  descricao: z.string().max(1000).optional(),
  categoria: categoriaEnum,
  unidade: unidadeEnum,
  marca: z.string().max(100).optional(),
  aplicacao: z.string().max(500).optional(),
  localizacao: z.string().max(50).optional(),
  estoqueMinimo: z.coerce.number().int().min(0).default(0),
  estoqueInicial: z.coerce.number().int().min(0).default(0),
  custoUnitario: z.coerce.number().min(0).default(0),
  precoVenda: z.coerce.number().positive().optional(),
  codigosBarras: z.array(z.string().min(1).max(50)).optional(),
});

export type CriarProdutoBody = z.infer<typeof criarProdutoSchema>;

export const editarProdutoSchema = z
  .object({
    nome: z.string().min(2).max(200).optional(),
    descricao: z.string().max(1000).optional(),
    unidade: unidadeEnum.optional(),
    marca: z.string().max(100).optional(),
    aplicacao: z.string().max(500).optional(),
    localizacao: z.string().max(50).optional(),
    estoqueMinimo: z.coerce.number().int().min(0).optional(),
    precoVenda: z.coerce.number().positive().optional().nullable(),
    codigosBarras: z.array(z.string().min(1).max(50)).optional(),
  })
  .strict(); // rejeita categoria e qualquer campo não permitido

export type EditarProdutoBody = z.infer<typeof editarProdutoSchema>;

export const alterarStatusProdutoSchema = z.object({
  ativo: z.boolean(),
});

export type AlterarStatusProdutoBody = z.infer<typeof alterarStatusProdutoSchema>;

export const listarProdutosSchema = z.object({
  search: z.string().max(100).optional(),
  categoria: z
    .enum(['MOT', 'FRE', 'TRA', 'ELE', 'SUS', 'PNE', 'ACC', 'OUT'])
    .optional(),
  ativo: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

export type ListarProdutosQuery = z.infer<typeof listarProdutosSchema>;
