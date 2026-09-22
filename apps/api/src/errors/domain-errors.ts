/**
 * Classe base para todos os erros de domínio do sistema.
 * O handler global de erros do Fastify usa `instanceof DomainError`
 * para formatar a resposta com o envelope correto.
 */
export class DomainError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(code: string, message: string, statusCode: number) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

// ─── Estoque ──────────────────────────────────────────────────────────────────

export class EstoqueInsuficienteError extends DomainError {
  constructor(produtoId: string, estoqueAtual: number, qtdSolicitada: number) {
    super(
      'ESTOQUE_INSUFICIENTE',
      `Estoque insuficiente para o produto ${produtoId}: atual=${estoqueAtual}, solicitado=${qtdSolicitada}`,
      422,
    );
  }
}

export class ProdutoComEstoqueError extends DomainError {
  constructor(produtoId: string, estoqueAtual: number) {
    super(
      'PRODUTO_COM_ESTOQUE',
      `Produto ${produtoId} não pode ser desativado com estoque em ${estoqueAtual} unidade(s)`,
      422,
    );
  }
}

// ─── Código de barras ────────────────────────────────────────────────────────

export class CodigoBarrasDuplicadoError extends DomainError {
  constructor(codigo: string) {
    super(
      'CODIGO_BARRAS_DUPLICADO',
      `O código de barras "${codigo}" já está cadastrado para outro produto`,
      409,
    );
  }
}

// ─── Produto ─────────────────────────────────────────────────────────────────

export class ProdutoNaoEncontradoError extends DomainError {
  constructor(id: string) {
    super('PRODUTO_NAO_ENCONTRADO', `Produto "${id}" não encontrado ou inativo`, 404);
  }
}

// ─── Fornecedor ───────────────────────────────────────────────────────────────

export class FornecedorNaoEncontradoError extends DomainError {
  constructor(id: string) {
    super(
      'FORNECEDOR_NAO_ENCONTRADO',
      `Fornecedor "${id}" não encontrado ou inativo`,
      404,
    );
  }
}

export class CnpjInvalidoError extends DomainError {
  constructor(cnpj: string) {
    super('CNPJ_INVALIDO', `CNPJ "${cnpj}" inválido (dígitos verificadores incorretos)`, 422);
  }
}

export class CnpjDuplicadoError extends DomainError {
  constructor(cnpj: string) {
    super('CNPJ_DUPLICADO', `CNPJ "${cnpj}" já está cadastrado`, 409);
  }
}

// ─── Autenticação ─────────────────────────────────────────────────────────────

export class CredenciaisInvalidasError extends DomainError {
  constructor() {
    super('CREDENCIAIS_INVALIDAS', 'E-mail ou senha incorretos', 401);
  }
}

export class ContaBloqueadaError extends DomainError {
  constructor(minutosRestantes: number) {
    super(
      'CONTA_BLOQUEADA',
      `Conta bloqueada por tentativas excessivas. Tente novamente em ${minutosRestantes} minuto(s)`,
      423,
    );
  }
}

export class TokenExpiradoError extends DomainError {
  constructor() {
    super('TOKEN_EXPIRADO', 'Token expirado ou inválido', 401);
  }
}

// ─── Autorização ──────────────────────────────────────────────────────────────

export class AcessoNegadoError extends DomainError {
  constructor(recurso?: string) {
    super(
      'ACESSO_NEGADO',
      recurso
        ? `Seu perfil não tem permissão para acessar: ${recurso}`
        : 'Seu perfil não tem permissão para esta operação',
      403,
    );
  }
}

// ─── Movimentação ─────────────────────────────────────────────────────────────

export class ObservacaoObrigatoriaError extends DomainError {
  constructor(tipo: string) {
    super(
      'OBSERVACAO_OBRIGATORIA',
      `O campo "observação" é obrigatório para movimentações do tipo ${tipo}`,
      422,
    );
  }
}

// ─── Validação ────────────────────────────────────────────────────────────────

export class ValidacaoError extends DomainError {
  readonly details: unknown;

  constructor(message: string, details?: unknown) {
    super('VALIDACAO', message, 400);
    this.details = details;
  }
}
