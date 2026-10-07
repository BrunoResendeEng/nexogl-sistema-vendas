import { z } from 'zod';

export const criarVendaSchema = z.object({
  clienteNome: z.string().max(200).optional(),
  clienteTelefone: z.string().max(20).optional(),
  clienteCpf: z.string().max(14).optional(),
  formaPagamento: z.enum(['DINHEIRO', 'PIX', 'CARTAO']),
  aplicarDescontoPix: z.boolean().default(true),
  observacao: z.string().max(500).optional(),
  itens: z.array(z.object({
    produtoId: z.coerce.number().int().positive(),
    quantidade: z.coerce.number().int().min(1),
  })).min(1),
});

export type CriarVendaBody = z.infer<typeof criarVendaSchema>;

export const listarVendasSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  formaPagamento: z.enum(['DINHEIRO', 'PIX', 'CARTAO']).optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
});

export type ListarVendasQuery = z.infer<typeof listarVendasSchema>;
