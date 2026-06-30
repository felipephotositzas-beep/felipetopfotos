/**
 * src/utils/urls.js
 * Funções de resolução de URLs da API e assets.
 */

/**
 * Resolve uma URL relativa para absoluta usando o domínio da API.
 * URLs que já começam com http(s):// são retornadas sem alteração.
 */
export const resolveUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) {
    return `https://painel.topfotos.com.br${url}`;
  }
  return url;
};
