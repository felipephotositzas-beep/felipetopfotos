import { describe, it, expect } from 'vitest';
import { maskCpf, maskPhone, validateCpf } from './masks';

describe('Utilitários de Máscara (masks.js)', () => {
  describe('maskCpf', () => {
    it('deve aplicar máscara corretamente em CPFs válidos', () => {
      expect(maskCpf('12345678909')).toBe('123.456.789-09');
    });

    it('deve lidar com strings curtas', () => {
      expect(maskCpf('123')).toBe('123');
      expect(maskCpf('1234')).toBe('123.4');
      expect(maskCpf('1234567')).toBe('123.456.7');
    });
  });

  describe('maskPhone', () => {
    it('deve aplicar máscara corretamente em celulares com 9 dígitos', () => {
      expect(maskPhone('11999999999')).toBe('(11) 99999-9999');
    });

    it('deve aplicar máscara corretamente em fixos com 8 dígitos', () => {
      expect(maskPhone('1133333333')).toBe('(11) 3333-3333');
    });
  });

  describe('validateCpf', () => {
    it('deve aceitar CPFs válidos matematicamente', () => {
      // Exemplo de CPF válido real gerado
      expect(validateCpf('11144477735')).toBe(true);
      expect(validateCpf('111.444.777-35')).toBe(true); // Suporta máscara
      expect(validateCpf('111.444.777-36')).toBe(false); // Inválido com máscara
    });

    it('deve rejeitar sequências inválidas ou CPFs com números repetidos', () => {
      expect(validateCpf('11111111111')).toBe(false);
      expect(validateCpf('00000000000')).toBe(false);
      expect(validateCpf('12345678900')).toBe(false);
    });

    it('deve rejeitar CPFs com comprimento diferente de 11', () => {
      expect(validateCpf('123')).toBe(false);
      expect(validateCpf('123456789012')).toBe(false);
    });
  });
});
