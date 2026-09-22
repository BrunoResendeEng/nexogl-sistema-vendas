export const Categoria = {
  MOT: 'MOT',
  FRE: 'FRE',
  TRA: 'TRA',
  ELE: 'ELE',
  SUS: 'SUS',
  PNE: 'PNE',
  ACC: 'ACC',
  OUT: 'OUT',
} as const;
export type Categoria = (typeof Categoria)[keyof typeof Categoria];

export const CATEGORIA_LABELS: Record<Categoria, string> = {
  MOT: 'Motor',
  FRE: 'Freio',
  TRA: 'Transmissão',
  ELE: 'Elétrica',
  SUS: 'Suspensão',
  PNE: 'Pneu / Câmara',
  ACC: 'Acessórios',
  OUT: 'Outros',
};

export const Unidade = {
  UN: 'UN',
  CX: 'CX',
  PC: 'PC',
  KG: 'KG',
  L: 'L',
} as const;
export type Unidade = (typeof Unidade)[keyof typeof Unidade];

export type CodigoBarras = {
  id: string;
  codigo: string;
  produtoId: string;
  criadoEm: Date;
};

export type Produto = {
  id: string;
  sku: string;
  nome: string;
  descricao: string | null;
  categoria: Categoria;
  unidade: Unidade;
  marca: string | null;
  aplicacao: string | null;
  localizacao: string | null;
  fotoUrl: string | null;
  estoqueMinimo: number;
  estoqueAtual: number;
  custoMedio: number;
  ativo: boolean;
  codigosBarras: CodigoBarras[];
  criadoEm: Date;
  atualizadoEm: Date;
};

export type CriarProdutoInput = {
  nome: string;
  categoria: Categoria;
  unidade: Unidade;
  estoqueMinimo: number;
  descricao?: string;
  aplicacao?: string;
  marca?: string;
  localizacao?: string;
};

export type EditarProdutoInput = Partial<Omit<CriarProdutoInput, 'categoria'>>;
