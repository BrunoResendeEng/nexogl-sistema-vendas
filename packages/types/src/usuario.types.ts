// Const objects em vez de TypeScript enum (conforme tech.md)

export const Perfil = {
  MASTER: 'MASTER',
  ADMIN: 'ADMIN',
  OPERADOR: 'OPERADOR',
} as const;
export type Perfil = (typeof Perfil)[keyof typeof Perfil];

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
};

export type UsuarioPublico = Omit<Usuario, never>; // sem senhaHash, refreshTokenHash

export type CriarUsuarioInput = {
  nome: string;
  email: string;
  senha: string;
  perfil: Perfil;
};

export type EditarUsuarioInput = Partial<{
  nome: string;
  email: string;
  perfil: Perfil;
}>;
