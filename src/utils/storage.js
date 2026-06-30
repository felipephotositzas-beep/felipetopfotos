/**
 * src/utils/storage.js
 * Armazenamento seguro de dados sensíveis usando @capacitor/preferences.
 * Substitui localStorage para dados pessoais (CPF, tokens).
 *
 * No iOS: usa NSUserDefaults via Capacitor (mais seguro que WKWebView localStorage).
 * No Web: usa localStorage como fallback transparente.
 */
import { Preferences } from '@capacitor/preferences';

export const SecureStorage = {
  /**
   * Salva um valor (serializado em JSON).
   * @param {string} key
   * @param {*} value
   */
  async set(key, value) {
    await Preferences.set({ key, value: JSON.stringify(value) });
  },

  /**
   * Recupera e deserializa um valor.
   * @param {string} key
   * @returns {*} valor ou null se não existir
   */
  async get(key) {
    const { value } = await Preferences.get({ key });
    if (value === null || value === undefined) return null;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  },

  /**
   * Remove um valor.
   * @param {string} key
   */
  async remove(key) {
    await Preferences.remove({ key });
  },

  /**
   * Remove todos os valores do app.
   */
  async clear() {
    await Preferences.clear();
  },
};
