import { describe, it, expect } from 'vitest';
import { calcularCustoMedio } from './custo-medio.js';

describe('calcularCustoMedio', () => {
  describe('caso estoque zero (sem divisão por zero)', () => {
    it('deve retornar o custoUnitario quando estoqueAtual = 0', () => {
      expect(calcularCustoMedio(0, 0, 10, 5)).toBe(5.0);
    });

    it('deve retornar custoUnitario mesmo com custoMedioAtual = 0', () => {
      expect(calcularCustoMedio(0, 0, 1, 12.5)).toBe(12.5);
    });

    it('deve retornar 0 quando custoUnitario = 0 e estoque = 0', () => {
      expect(calcularCustoMedio(0, 0, 5, 0)).toBe(0);
    });
  });

  describe('caso estoque positivo (média ponderada)', () => {
    it('deve calcular a média ponderada corretamente', () => {
      // (10 * 5 + 5 * 10) / (10 + 5) = (50 + 50) / 15 = 6.67
      expect(calcularCustoMedio(10, 5, 5, 10)).toBe(6.67);
    });

    it('deve retornar o mesmo valor quando custoUnitario = custoMedioAtual', () => {
      expect(calcularCustoMedio(10, 8, 5, 8)).toBe(8.0);
    });

    it('deve reduzir o custo médio quando entrada tem custo menor', () => {
      // (100 * 10 + 100 * 5) / 200 = 7.50
      expect(calcularCustoMedio(100, 10, 100, 5)).toBe(7.5);
    });

    it('deve arredondar para 2 casas decimais', () => {
      // (1 * 10 + 1 * 5) / 2 = 7.50 (exato)
      expect(calcularCustoMedio(1, 10, 1, 5)).toBe(7.5);
    });

    it('deve arredondar corretamente caso com dízima', () => {
      // (2 * 10 + 1 * 7) / 3 = 27/3 = 9.00
      expect(calcularCustoMedio(2, 10, 1, 7)).toBe(9.0);
    });

    it('caso real: pistão CG150 — entrada incremental', () => {
      // Situação: 5 unid @ R$45,00. Entra mais 3 @ R$52,00
      // (5 * 45 + 3 * 52) / 8 = (225 + 156) / 8 = 381 / 8 = 47.63
      expect(calcularCustoMedio(5, 45, 3, 52)).toBe(47.63);
    });
  });

  describe('validações de entrada', () => {
    it('deve lançar erro quando qtdEntrada = 0', () => {
      expect(() => calcularCustoMedio(10, 5, 0, 8)).toThrow(
        'qtdEntrada deve ser maior que zero',
      );
    });

    it('deve lançar erro quando qtdEntrada é negativa', () => {
      expect(() => calcularCustoMedio(10, 5, -1, 8)).toThrow(
        'qtdEntrada deve ser maior que zero',
      );
    });

    it('deve lançar erro quando estoqueAtual é negativo', () => {
      expect(() => calcularCustoMedio(-1, 5, 10, 8)).toThrow(
        'estoqueAtual não pode ser negativo',
      );
    });
  });
});
