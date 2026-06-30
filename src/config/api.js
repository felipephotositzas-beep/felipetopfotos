import { Capacitor } from '@capacitor/core';

// No Android (WebView nativo), não há proxy do Vite
// então precisamos da URL absoluta do servidor
const isNative = Capacitor.isNativePlatform();

export const API_BASE = isNative
  ? 'https://painel.topfotos.com.br'
  : '';  // vazio = usa proxy do Vite em /api

/**
 * Monta a URL completa da API.
 * Ex: apiUrl('/api/photo/list/123') → 
 *   Web: '/api/photo/list/123'  (proxy Vite)
 *   Android: 'https://painel.topfotos.com.br/api/photo/list/123'
 */
export function apiUrl(path) {
  return `${API_BASE}${path}`;
}
