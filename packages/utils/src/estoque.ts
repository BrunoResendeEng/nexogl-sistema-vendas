/**
 * Valida se uma movimentação resultaria em estoque negativo.
 * Retorna true se a operação for permitida, false se bloqueada.
 */
export function validarEstoqueSuficiente(
  estoqueAtual: number,
  quantidade: number,
): boolean {
  return estoqueAtual - quantidade >= 0;
}

/**
 * Calcula o novo estoque após uma movimentação de débito.
 * Lança erro se o resultado for negativo (use validarEstoqueSuficiente antes).
 */
export function calcularNovoEstoqueDebito(
  estoqueAtual: number,
  quantidade: number,
): number {
  const novo = estoqueAtual - quantidade;
  if (novo < 0) {
    throw new Error(
      `Estoque insuficiente: atual=${estoqueAtual}, solicitado=${quantidade}`,
    );
  }
  return novo;
}
