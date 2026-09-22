import { describe, it, expect } from 'vitest';
import { validarCnpj, limparCnpj, formatarCnpj } from './cnpj.js';

describe('validarCnpj', () => {
  describe('CNPJs válidos', () => {
    it('deve aceitar CNPJ válido sem máscara', () => {
      expect(validarCnpj('11222333000181')).toBe(true);
    });

    it('deve aceitar CNPJ válido com máscara', () => {
      expect(validarCnpj('11.222.333/0001-81')).toBe(true);
    });

    it('deve aceitar outro CNPJ válido conhecido', () => {
      // CNPJ da Receita Federal de teste
      expect(validarCnpj('45997418000153')).toBe(true);
    });
  });

  describe('CNPJs inválidos', () => {
    it('deve rejeitar CNPJ com dígito verificador errado', () => {
      expect(validarCnpj('11222333000182')).toBe(false);
    });

    it('deve rejeitar CNPJ com menos de 14 dígitos', () => {
      expect(validarCnpj('1122233300018')).toBe(false);
    });

    it('deve rejeitar CNPJ com mais de 14 dígitos', () => {
      expect(validarCnpj('112223330001810')).toBe(false);
    });

    it('deve rejeitar sequência de zeros', () => {
      expect(validarCnpj('00000000000000')).toBe(false);
    });

    it('deve rejeitar sequência repetida', () => {
      expect(validarCnpj('11111111111111')).toBe(false);
    });

    it('deve rejeitar string vazia', () => {
      expect(validarCnpj('')).toBe(false);
    });

    it('deve rejeitar CNPJ com letras', () => {
      expect(validarCnpj('1122233300018A')).toBe(false);
    });
  });
});

describe('limparCnpj', () => {
  it('deve remover pontos, barra e hífen', () => {
    expect(limparCnpj('11.222.333/0001-81')).toBe('11222333000181');
  });

  it('deve manter CNPJ já limpo', () => {
    expect(limparCnpj('11222333000181')).toBe('11222333000181');
  });
});

describe('formatarCnpj', () => {
  it('deve formatar CNPJ numérico corretamente', () => {
    expect(formatarCnpj('11222333000181')).toBe('11.222.333/0001-81');
  });
});
