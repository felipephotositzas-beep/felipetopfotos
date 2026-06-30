/**
 * src/utils/logger.js
 * Logger condicional — ativo apenas em desenvolvimento.
 * Em produção, suprime todos os logs para não expor informações.
 */

const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args) => {
    if (isDev) console.log(...args);
  },
  warn: (...args) => {
    if (isDev) console.warn(...args);
  },
  error: (...args) => {
    if (isDev) console.error(...args);
  },
  info: (...args) => {
    if (isDev) console.info(...args);
  },
};
