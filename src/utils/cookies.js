/**
 * src/utils/cookies.js
 * Leitura segura de cookies do documento.
 */

/**
 * Lê o valor de um cookie pelo nome.
 * @param {string} name - Nome do cookie
 * @returns {string} Valor do cookie ou string vazia
 */
export const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return '';
};
