/**
 * src/services/checkoutService.js
 * Serviços de API para o fluxo de checkout e consulta de pedidos do cliente.
 */
import { apiUrl } from '../config/api';
import { getCookie } from '../utils/cookies';
import { fetchWithTimeout } from '../utils/http';

/**
 * Helper para obter os cabeçalhos padrão com CSRF token.
 * @returns {object} Headers configurados
 */
const getPostHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const csrfToken = getCookie('csrftoken');
  if (csrfToken) {
    headers['X-CSRFTOKEN'] = csrfToken;
  }
  return headers;
};

/**
 * Busca as informações de cadastro do cliente a partir do CPF.
 * @param {string} cpf - CPF limpo (só números)
 * @returns {Promise<object>} Dados do cliente
 */
export async function getCustomerInfo(cpf) {
  const response = await fetchWithTimeout(apiUrl('/api/customer/info'), {
    method: 'POST',
    headers: getPostHeaders(),
    body: JSON.stringify({ cpf })
  });

  if (!response.ok) {
    throw new Error(`Cliente não encontrado ou erro na busca: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Busca a lista de pedidos de um cliente a partir de seu CPF.
 * @param {string} cpf - CPF limpo (só números)
 * @returns {Promise<object>} Lista de pedidos
 */
export async function getCustomerOrders(cpf) {
  const response = await fetchWithTimeout(apiUrl('/api/customer/orders'), {
    method: 'POST',
    headers: getPostHeaders(),
    body: JSON.stringify({ cpf })
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar pedidos: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Cria um novo pedido no checkout.
 * @param {object} payload - Dados do pedido (cart_id, total_value, customer_document, nome, email, telefone)
 * @returns {Promise<object>} Dados do pedido criado
 */
export async function createOrder(payload) {
  const response = await fetchWithTimeout(apiUrl('/api/order/checkout'), {
    method: 'POST',
    headers: getPostHeaders(),
    body: JSON.stringify(payload)
  });

  return response;
}

/**
 * Busca os detalhes de status de um pedido específico.
 * @param {string} orderId - ID do pedido
 * @returns {Promise<object>} Detalhes do pedido
 */
export async function getOrderDetails(orderId) {
  const response = await fetchWithTimeout(apiUrl(`/api/order/${orderId}`));
  if (!response.ok) {
    throw new Error(`Erro ao buscar detalhes do pedido: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Busca os dados do pagamento por PIX de um pedido (QR Code e Copia e Cola).
 * @param {string} orderId - ID do pedido
 * @returns {Promise<object>} Dados do PIX
 */
export async function getPixDetails(orderId) {
  try {
    const response = await fetchWithTimeout(apiUrl(`/api/order/checkout-pix/${orderId}`));
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.pix_data || data.order?.pix_data || null;
  } catch {
    return null;
  }
}
