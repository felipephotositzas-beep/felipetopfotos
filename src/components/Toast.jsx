/**
 * src/components/Toast.jsx
 * Sistema de notificação não-bloqueante para substituir alert() nativo.
 * Compatível com iOS VoiceOver (role="alert", aria-live).
 */
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

let toastIdCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timersRef.current[id]);
    delete timersRef.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ message, type = 'info', duration = 3500 }) => {
      const id = ++toastIdCounter;
      setToasts((prev) => [...prev, { id, message, type }]);
      timersRef.current[id] = setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        className="toast-container"
        role="region"
        aria-label="Notificações"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast--${toast.type}`}
            role="alert"
            onClick={() => dismiss(toast.id)}
          >
            <span className="toast__icon">{icons[toast.type]}</span>
            <span className="toast__message">{toast.message}</span>
            <button
              className="toast__close"
              onClick={() => dismiss(toast.id)}
              aria-label="Fechar notificação"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const icons = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

/**
 * Hook para disparar toasts de qualquer componente.
 * Deve estar dentro de <ToastProvider>.
 *
 * @returns {{ success, error, warning, info }} — funções de conveniência
 *
 * @example
 * const toast = useToast();
 * toast.success('Pagamento confirmado!');
 * toast.error('Erro ao conectar com o servidor.');
 */
export function useToast() {
  const showToast = useContext(ToastContext);
  if (!showToast) {
    throw new Error('useToast deve ser usado dentro de <ToastProvider>');
  }

  return {
    success: (message, duration) => showToast({ message, type: 'success', duration }),
    error: (message, duration) => showToast({ message, type: 'error', duration: duration ?? 5000 }),
    warning: (message, duration) => showToast({ message, type: 'warning', duration }),
    info: (message, duration) => showToast({ message, type: 'info', duration }),
  };
}
