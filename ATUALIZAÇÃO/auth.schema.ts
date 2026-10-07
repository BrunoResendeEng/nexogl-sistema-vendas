import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'E-mail inválido' }),
  senha: z.string().min(6, { message: 'Senha deve ter ao menos 6 caracteres' }),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({});

export const criarUsuarioSchema = z.object({
  nome: z.string().min(2, { message: 'Nome deve ter ao menos 2 caracteres' }),
  email: z.string().email({ message: 'E-mail inválido' }),
  senha: z.string().min(8, { message: 'Senha deve ter ao menos 8 caracteres' }),
  perfil: z.enum(['MASTER', 'ADMIN', 'OPERADOR'], { message: 'Perfil inválido' }),
});

export type CriarUsuarioInput = z.infer<typeof criarUsuarioSchema>;

export const editarUsuarioSchema = z.object({
  nome: z.string().min(2).optional(),
  email: z.string().email().optional(),
  perfil: z.enum(['MASTER', 'ADMIN', 'OPERADOR']).optional(),
});

export type EditarUsuarioInput = z.infer<typeof editarUsuarioSchema>;

export const statusUsuarioSchema = z.object({
  ativo: z.boolean(),
});

export const recuperarSenhaSchema = z.object({
  email: z.string().email({ message: 'E-mail inválido' }),
});

export type RecuperarSenhaInput = z.infer<typeof recuperarSenhaSchema>;

export const alterarSenhaSchema = z.object({
  senhaAtual: z.string().min(1, { message: 'Senha atual obrigatória' }),
  novaSenha: z.string().min(8, { message: 'Nova senha deve ter ao menos 8 caracteres' }),
});

export type AlterarSenhaInput = z.infer<typeof alterarSenhaSchema>;
