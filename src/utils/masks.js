/**
 * src/utils/masks.js
 * Funções de formatação e validação de campos brasileiros.
 */

/**
 * Aplica máscara de CPF: 000.000.000-00
 */
export const maskCpf = (value) =>
  value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');

export const maskPhone = (value) => {
  const clean = value.replace(/\D/g, '');
  if (clean.length <= 10) {
    return clean
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  }
  return clean
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

/**
 * Valida CPF com cálculo de dígitos verificadores.
 * Rejeita CPFs com todos os dígitos iguais (ex: 000.000.000-00).
 * @param {string} cpf - CPF com ou sem máscara
 * @returns {boolean}
 */
export const validateCpf = (cpf) => {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return false;

  // Rejeitar sequências triviais
  if (/^(\d)\1+$/.test(clean)) return false;

  const calcDigit = (cpfStr, length) => {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += parseInt(cpfStr[i]) * (length + 1 - i);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  const digit1 = calcDigit(clean, 9);
  const digit2 = calcDigit(clean, 10);

  return parseInt(clean[9]) === digit1 && parseInt(clean[10]) === digit2;
};
