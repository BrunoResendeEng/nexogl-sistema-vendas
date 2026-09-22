/**
 * Tipos de código de barras suportados.
 */
export const TipoCodigoBarras = {
  EAN13: 'EAN13',
  EAN8: 'EAN8',
  CODE128: 'CODE128',
  CODE39: 'CODE39',
} as const;
export type TipoCodigoBarras = (typeof TipoCodigoBarras)[keyof typeof TipoCodigoBarras];

/**
 * Detecta o tipo do código de barras com base no formato.
 * Retorna null se não for reconhecido.
 */
export function detectarTipo(codigo: string): TipoCodigoBarras | null {
  const limpo = codigo.trim();

  if (/^\d{13}$/.test(limpo)) return TipoCodigoBarras.EAN13;
  if (/^\d{8}$/.test(limpo)) return TipoCodigoBarras.EAN8;
  // Code 39: maiúsculas, números e caracteres especiais -. $+%/ espaço
  if (/^[A-Z0-9\-. $+%/]{4,}$/.test(limpo)) return TipoCodigoBarras.CODE39;
  // Code 128: qualquer ASCII imprimível, mínimo 4 chars
  if (limpo.length >= 4) return TipoCodigoBarras.CODE128;

  return null;
}

/**
 * Valida um código de barras conforme as regras do sistema:
 * - EAN-13/8: validar dígito verificador
 * - Code 128/39: mínimo 4 caracteres
 *
 * Retorna { valido: true } ou { valido: false, motivo: string }
 */
export function validarCodigoBarras(codigo: string): { valido: boolean; motivo?: string } {
  const limpo = codigo.trim();

  if (!limpo) {
    return { valido: false, motivo: 'Código de barras não pode ser vazio' };
  }

  const tipo = detectarTipo(limpo);

  if (tipo === TipoCodigoBarras.EAN13) {
    return validarEan(limpo, 13);
  }

  if (tipo === TipoCodigoBarras.EAN8) {
    return validarEan(limpo, 8);
  }

  // Code 128 / Code 39: mínimo 4 caracteres
  if (limpo.length < 4) {
    return { valido: false, motivo: 'Code 128/39 deve ter no mínimo 4 caracteres' };
  }

  return { valido: true };
}

/**
 * Valida o dígito verificador de EAN-8 ou EAN-13.
 */
function validarEan(codigo: string, tamanho: 8 | 13): { valido: boolean; motivo?: string } {
  if (codigo.length !== tamanho) {
    return { valido: false, motivo: `EAN-${tamanho} deve ter exatamente ${tamanho} dígitos` };
  }

  const digitos = codigo.split('').map(Number);
  const digitoVerificador = digitos[tamanho - 1];

  // Multiplicadores: posições ímpares (0-indexed pares) = 1, pares = 3 (EAN-13)
  // Para EAN-8: pares = 3, ímpares = 1 (invertido)
  let soma = 0;
  for (let i = 0; i < tamanho - 1; i++) {
    const multiplicador = tamanho === 13
      ? (i % 2 === 0 ? 1 : 3)
      : (i % 2 === 0 ? 3 : 1);
    soma += (digitos[i] ?? 0) * multiplicador;
  }

  const digitoEsperado = (10 - (soma % 10)) % 10;

  if (digitoVerificador !== digitoEsperado) {
    return {
      valido: false,
      motivo: `Dígito verificador inválido para EAN-${tamanho} (esperado: ${digitoEsperado}, recebido: ${digitoVerificador})`,
    };
  }

  return { valido: true };
}
