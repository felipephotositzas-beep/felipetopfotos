import React from 'react';

/**
 * CheckoutCpfStep
 * Primeiro passo do Checkout: inserção e identificação do CPF do usuário.
 */
export default function CheckoutCpfStep({ 
  cpf, 
  onChange, 
  onSubmit, 
  isLoading, 
  cartLength 
}) {
  return (
    <div className="checkout-card">
      <h2 className="checkout-title">Identificação</h2>
      <p className="checkout-subtitle">
        Precisamos do seu CPF para iniciar a compra de {cartLength} {cartLength === 1 ? 'item' : 'itens'}.
      </p>
      
      <form onSubmit={onSubmit} className="checkout-form">
        <div className="checkout-form-group">
          <label className="checkout-label">CPF</label>
          <input 
            type="text" 
            value={cpf}
            onChange={onChange}
            placeholder="000.000.000-00"
            className="checkout-input"
            required
            aria-required="true"
          />
        </div>
        <button 
          type="submit" 
          disabled={isLoading || cpf.replace(/\D/g, '').length < 11}
          className="checkout-btn-primary mt-2"
        >
          {isLoading ? <i className="fas fa-spinner fa-spin" aria-hidden="true"></i> : 'Continuar'}
        </button>
      </form>
    </div>
  );
}
