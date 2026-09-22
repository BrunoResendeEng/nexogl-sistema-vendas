export const TipoMovimentacao = {
  ENTRADA: 'ENTRADA',
  SAIDA: 'SAIDA',
  AJUSTE: 'AJUSTE',
  PERDA: 'PERDA',
  DEVOLUCAO: 'DEVOLUCAO',
} as const;
export type TipoMovimentacao = (typeof TipoMovimentacao)[keyof typeof TipoMovimentacao];

export const TIPO_MOVIMENTACAO_LABELS: Record<TipoMovimentacao, string> = {
  ENTRADA: 'Entrada',
  SAIDA: 'Saída',
  AJUSTE: 'Ajuste',
  PERDA: 'Perda',
  DEVOLUCAO: 'Devolução',
};

/** Tipos que reduzem o estoque */
export const TIPOS_DEBITO: TipoMovimentacao[] = ['SAIDA', 'AJUSTE', 'PERDA'];

/** Tipos que aumentam o estoque */
export const TIPOS_CREDITO: TipoMovimentacao[] = ['ENTRADA', 'DEVOLUCAO'];

/** Tipos que exigem observação obrigatória */
export const TIPOS_COM_OBSERVACAO_OBRIGATORIA: TipoMovimentacao[] = ['AJUSTE', 'PERDA'];

/** Tipos exclusivos de ADMIN */
export const TIPOS_SOMENTE_ADMIN: TipoMovimentacao[] = ['AJUSTE', 'PERDA'];

export type Movimentacao = {
  id: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  custoUnitario: number;
  observacao: string | null;
  produtoId: string;
  usuarioId: string;
  fornecedorId: string | null;
  criadoEm: Date;
};

export type RegistrarMovimentacaoInput = {
  produtoId: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  /** Obrigatório em ENTRADA. Ignorado nos demais (preenchido pelo sistema com custoMedio vigente). */
  custoUnitario?: number;
  /** Opcional. Só relevante em ENTRADA. */
  fornecedorId?: string;
  /** Obrigatório em AJUSTE e PERDA. */
  observacao?: string;
};
