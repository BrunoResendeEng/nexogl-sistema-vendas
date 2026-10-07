import { z } from 'zod';

export const criarMovimentacaoSchema = z.object({
  tipo: z.enum(['ENTRADA', 'AJUSTE', 'PERDA', 'DEVOLUCAO']),
  produtoId: z.coerce.number().int().positive(),
  quantidade: z.number().int().positive(),
  custoUnitario: z.number().min(0).optional(),
  observacao: z.string().optional(),
  fornecedorId: z.coerce.number().int().positive().optional(),
}).refine(
  (d) => d.tipo !== 'ENTRADA' || (d.custoUnitario !== undefined && d.custoUnitario >= 0),
  { message: 'custoUnitario é obrigatório para ENTRADA', path: ['custoUnitario'] },
).refine(
  (d) => (d.tipo !== 'AJUSTE' && d.tipo !== 'PERDA') || (d.observacao && d.observacao.trim().length > 0),
  { message: 'Observação é obrigatória para AJUSTE e PERDA', path: ['observacao'] },
);

export const listarMovimentacoesSchema = z.object({
  produtoId: z.coerce.number().int().positive().optional(),
  tipo: z.enum(['ENTRADA', 'SAIDA', 'AJUSTE', 'PERDA', 'DEVOLUCAO']).optional(),
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type CriarMovimentacaoBody = z.infer<typeof criarMovimentacaoSchema>;
export type ListarMovimentacoesQuery = z.infer<typeof listarMovimentacoesSchema>;
