import { describe, it, expect } from 'vitest';
import { formatarSku, parsearSku } from './sku.js';

describe('formatarSku', () => {
  it('deve formatar sequencial com zero à esquerda', () => {
    expect(formatarSku('MOT', 1)).toBe('MOT-00001');
  });

  it('deve formatar sequencial 42 corretamente', () => {
    expect(formatarSku('MOT', 42)).toBe('MOT-00042');
  });

  it('deve formatar o valor máximo de 5 dígitos', () => {
    expect(formatarSku('FRE', 99999)).toBe('FRE-99999');
  });

  it('deve funcionar com todas as categorias do sistema', () => {
    const categorias = ['MOT', 'FRE', 'TRA', 'ELE', 'SUS', 'PNE', 'ACC', 'OUT'];
    for (const cat of categorias) {
      expect(formatarSku(cat, 1)).toBe(`${cat}-00001`);
    }
  });

  it('deve lançar erro para sequencial = 0', () => {
    expect(() => formatarSku('MOT', 0)).toThrow('maior que zero');
  });

  it('deve lançar erro para sequencial negativo', () => {
    expect(() => formatarSku('MOT', -1)).toThrow('maior que zero');
  });

  it('deve lançar erro para sequencial > 99999', () => {
    expect(() => formatarSku('MOT', 100000)).toThrow('limite de 5 dígitos');
  });
});

describe('parsearSku', () => {
  it('deve extrair categoria e sequencial corretamente', () => {
    expect(parsearSku('MOT-00042')).toEqual({ categoria: 'MOT', sequencial: 42 });
  });

  it('deve retornar null para SKU com formato inválido', () => {
    expect(parsearSku('MOT-042')).toBeNull();
    expect(parsearSku('MOT00042')).toBeNull();
    expect(parsearSku('')).toBeNull();
    expect(parsearSku('MOTOR-00001')).toBeNull();
  });

  it('deve aceitar categorias de 2 letras', () => {
    expect(parsearSku('AB-00001')).toEqual({ categoria: 'AB', sequencial: 1 });
  });
});
