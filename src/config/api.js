import { Capacitor } from '@capacitor/core';

// No Android/iOS (WebView nativo) ou na Web em Produção, precisamos da URL absoluta do servidor.
// Em desenvolvimento local na Web, usa-se a string vazia para usar o proxy do Vite.
const isNative = Capacitor.isNativePlatform();
const isProd = import.meta.env.PROD;

export const API_BASE = (isNative || isProd)
  ? 'https://painel.topfotos.com.br'
  : '';

/**
 * Monta a URL completa da API.
 */
export function apiUrl(path) {
  return `${API_BASE}${path}`;
}
