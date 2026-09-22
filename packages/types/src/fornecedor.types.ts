export type Fornecedor = {
  id: string;
  razaoSocial: string;
  cnpj: string;
  telefone: string | null;
  email: string | null;
  contato: string | null;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
};

export type CriarFornecedorInput = {
  razaoSocial: string;
  cnpj: string;
  telefone?: string;
  email?: string;
  contato?: string;
};

export type EditarFornecedorInput = Partial<CriarFornecedorInput>;
