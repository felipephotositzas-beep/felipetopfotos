/**
 * src/services/cartService.js
 * Serviços de API para o gerenciamento de carrinho.
 * Separa a lógica de requisições HTTP e tratamento de rede da camada de apresentação/contexto.
 */
import { apiUrl } from '../config/api';
import { getCookie } from '../utils/cookies';
import { fetchWithTimeout } from '../utils/http';

/**
 * Helper para obter os cabeçalhos padrão com CSRF token.
 * @param {string} method - Método HTTP
 * @returns {object} Headers configurados
 */
const getHeaders = (method = 'GET') => {
  const headers = {};
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase())) {
    headers['Content-Type'] = 'application/json';
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) {
      headers['X-CSRFTOKEN'] = csrfToken;
    }
  }
  return headers;
};

/**
 * Busca os dados do carrinho no backend.
 * @param {string} cartId - ID único do carrinho
 * @returns {Promise<object>} Dados do carrinho
 */
export async function getCart(cartId) {
  const response = await fetchWithTimeout(apiUrl(`/api/cart/${cartId}`));
  if (!response.ok) {
    throw new Error(`Falha ao buscar carrinho: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Adiciona uma foto ou vídeo ao carrinho.
 * @param {string} cartId - ID do carrinho
 * @param {string} photoId - ID da foto/mídia
 * @returns {Promise<object>} Dados atualizados do carrinho
 */
export async function addPhotoToCart(cartId, photoId) {
  const response = await fetchWithTimeout(apiUrl(`/api/cart/${cartId}/add/photo`), {
    method: 'POST',
    headers: getHeaders('POST'),
    body: JSON.stringify({
      reference: photoId,
      item_type: 'photo'
    })
  });

  if (!response.ok) {
    throw new Error(`Falha ao adicionar item ao carrinho: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Remove um item do carrinho no backend.
 * @param {string} cartId - ID do carrinho
 * @param {string} cartItemId - ID do item no carrinho (diferente do ID da foto)
 * @returns {Promise<object>} Dados atualizados do carrinho
 */
export async function removePhotoFromCart(cartId, cartItemId) {
  const response = await fetchWithTimeout(apiUrl(`/api/cart/${cartId}/remove/${cartItemId}`), {
    method: 'DELETE',
    headers: getHeaders('DELETE')
  });

  if (!response.ok) {
    throw new Error(`Falha ao remover item do carrinho: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Aplica um cupom de desconto ao carrinho.
 * @param {string} cartId - ID do carrinho
 * @param {string} couponCode - Código do cupom
 * @returns {Promise<object>} Dados atualizados do carrinho
 */
export async function applyCartCoupon(cartId, couponCode) {
  const response = await fetchWithTimeout(apiUrl(`/api/cart/${cartId}/apply/coupon`), {
    method: 'POST',
    headers: getHeaders('POST'),
    body: JSON.stringify({ coupon: couponCode })
  });

  const data = await response.json();
  if (!response.ok) {
    return { success: false, error: data.detail || 'Cupom inválido!' };
  }
  return { success: true, data };
}

/**
 * Remove o cupom de desconto do carrinho.
 * @param {string} cartId - ID do carrinho
 * @returns {Promise<object>} Dados atualizados do carrinho
 */
export async function removeCartCoupon(cartId) {
  const response = await fetchWithTimeout(apiUrl(`/api/cart/${cartId}/remove/coupon`), {
    method: 'DELETE',
    headers: getHeaders('DELETE')
  });

  if (!response.ok) {
    throw new Error(`Falha ao remover cupom: ${response.statusText}`);
  }
  return response.json();
}
