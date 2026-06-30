/**
 * src/utils/http.js
 * Cliente HTTP centralizado com timeout e AbortController.
 */

const DEFAULT_TIMEOUT_MS = 15000; // 15 segundos

/**
 * Wrapper de fetch com timeout automático via AbortController.
 * Lança Error com mensagem amigável em caso de timeout.
 *
 * @param {string} url
 * @param {RequestInit} options
 * @param {number} timeoutMs
 * @returns {Promise<Response>}
 */
export async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('A requisição demorou muito. Verifique sua conexão e tente novamente.');
    }
    throw err;
  } finally {
    clearTimeout(timerId);
  }
}
