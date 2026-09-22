import { describe, it, expect } from 'vitest';
import { validarEstoqueSuficiente, calcularNovoEstoqueDebito } from './estoque.js';

describe('validarEstoqueSuficiente', () => {
  it('deve permitir saída exata (estoque = quantidade)', () => {
    expect(validarEstoqueSuficiente(5, 5)).toBe(true);
  });

  it('deve permitir saída parcial', () => {
    expect(validarEstoqueSuficiente(10, 3)).toBe(true);
  });

  it('deve bloquear saída maior que estoque', () => {
    expect(validarEstoqueSuficiente(5, 6)).toBe(false);
  });

  it('deve bloquear saída quando estoque = 0', () => {
    expect(validarEstoqueSuficiente(0, 1)).toBe(false);
  });

  it('deve permitir quantidade 0 (sem efeito)', () => {
    expect(validarEstoqueSuficiente(0, 0)).toBe(true);
  });
});

describe('calcularNovoEstoqueDebito', () => {
  it('deve retornar o saldo correto após débito', () => {
    expect(calcularNovoEstoqueDebito(10, 3)).toBe(7);
  });

  it('deve retornar zero quando débito é igual ao estoque', () => {
    expect(calcularNovoEstoqueDebito(5, 5)).toBe(0);
  });

  it('deve lançar erro quando débito excede estoque', () => {
    expect(() => calcularNovoEstoqueDebito(3, 5)).toThrow('Estoque insuficiente');
  });

  it('deve lançar erro com mensagem informativa', () => {
    expect(() => calcularNovoEstoqueDebito(3, 5)).toThrow(
      'atual=3, solicitado=5',
    );
  });
});
