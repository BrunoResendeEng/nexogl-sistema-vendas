/**
 * Formata um número sequencial no padrão SKU do sistema.
 * Formato: {CATEGORIA}-{NNNNN} — sempre 5 dígitos com zero à esquerda.
 *
 * Exemplo: formatarSku('MOT', 42) → 'MOT-00042'
 *
 * IMPORTANTE: a geração atômica do sequencial ocorre no service,
 * dentro de prisma.$transaction com SELECT FOR UPDATE em SkuSequencia.
 * Esta função apenas formata o valor já obtido.
 */
export function formatarSku(categoria: string, sequencial: number): string {
  if (sequencial <= 0) {
    throw new Error('Sequencial deve ser maior que zero');
  }

  if (sequencial > 99999) {
    throw new Error('Sequencial excede o limite de 5 dígitos (máx: 99999)');
  }

  const seq = String(sequencial).padStart(5, '0');
  return `${categoria}-${seq}`;
}

/**
 * Extrai a categoria e o número sequencial de um SKU.
 * Retorna null se o formato for inválido.
 */
export function parsearSku(sku: string): { categoria: string; sequencial: number } | null {
  const match = /^([A-Z]{2,3})-(\d{5})$/.exec(sku);
  if (!match) return null;

  return {
    categoria: match[1] as string,
    sequencial: parseInt(match[2] as string, 10),
  };
}
