/**
 * Calcula o novo custo médio ponderado após uma ENTRADA.
 * Aplicado APENAS em movimentações do tipo ENTRADA.
 *
 * Regras (conforme product.md):
 * - estoqueAtual = 0 → novoCustoMedio = custoUnitario (evita divisão por zero)
 * - estoqueAtual > 0 → média ponderada
 * - Resultado arredondado para 2 casas decimais
 */
export function calcularCustoMedio(
  estoqueAtual: number,
  custoMedioAtual: number,
  qtdEntrada: number,
  custoUnitario: number,
): number {
  if (qtdEntrada <= 0) {
    throw new Error('qtdEntrada deve ser maior que zero');
  }

  if (estoqueAtual < 0) {
    throw new Error('estoqueAtual não pode ser negativo');
  }

  if (estoqueAtual === 0) {
    return arredondar(custoUnitario);
  }

  const novoCusto =
    (estoqueAtual * custoMedioAtual + qtdEntrada * custoUnitario) /
    (estoqueAtual + qtdEntrada);

  return arredondar(novoCusto);
}

/**
 * Arredonda um número para 2 casas decimais.
 * Usa arredondamento "half away from zero" (padrão contábil).
 */
export function arredondar(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}
