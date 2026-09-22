/**
 * Valida CNPJ verificando os dígitos verificadores.
 * Aceita CNPJ com ou sem máscara (XX.XXX.XXX/XXXX-XX).
 */
export function validarCnpj(cnpj: string): boolean {
  // Remove caracteres não numéricos
  const numeros = cnpj.replace(/\D/g, '');

  if (numeros.length !== 14) return false;

  // Rejeita sequências repetidas (ex: 00000000000000)
  if (/^(\d)\1+$/.test(numeros)) return false;

  // Valida primeiro dígito verificador
  if (!validarDigito(numeros, 12)) return false;

  // Valida segundo dígito verificador
  if (!validarDigito(numeros, 13)) return false;

  return true;
}

function validarDigito(cnpj: string, posicao: number): boolean {
  const pesos =
    posicao === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const soma = pesos.reduce((acc, peso, i) => {
    const digito = parseInt(cnpj[i] ?? '0', 10);
    return acc + digito * peso;
  }, 0);

  const resto = soma % 11;
  const digitoEsperado = resto < 2 ? 0 : 11 - resto;
  const digitoReal = parseInt(cnpj[posicao] ?? '0', 10);

  return digitoEsperado === digitoReal;
}

/**
 * Remove máscara do CNPJ, retornando apenas os 14 dígitos.
 */
export function limparCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

/**
 * Formata CNPJ numérico para o padrão XX.XXX.XXX/XXXX-XX.
 */
export function formatarCnpj(cnpj: string): string {
  const n = limparCnpj(cnpj);
  return n.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}
