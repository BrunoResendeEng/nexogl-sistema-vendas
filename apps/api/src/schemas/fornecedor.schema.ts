import { z } from 'zod';

export const criarFornecedorSchema = z.object({
  razaoSocial: z.string().min(2),
  cnpj: z.string().length(14, 'CNPJ deve ter 14 dígitos (sem máscara)'),
  telefone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  contato: z.string().optional(),
});

export const atualizarFornecedorSchema = criarFornecedorSchema.partial();

export const listarFornecedoresSchema = z.object({
  search: z.string().optional(),
  ativo: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type CriarFornecedorBody = z.infer<typeof criarFornecedorSchema>;
export type AtualizarFornecedorBody = z.infer<typeof atualizarFornecedorSchema>;
export type ListarFornecedoresQuery = z.infer<typeof listarFornecedoresSchema>;
