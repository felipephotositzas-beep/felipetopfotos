import React from 'react';

/**
 * CheckoutUserDataStep
 * Segundo passo do Checkout: Informações de contato e revisão de valores / Cupom.
 */
export default function CheckoutUserDataStep({
  isExistingUser,
  name,
  setName,
  email,
  setEmail,
  phone,
  onChangePhone,
  cpf,
  onEditUserData,
  onEditCpf,
  onSubmit,
  cartItems,
  cartSubtotal,
  cartDiscount,
  cartTotal,
  appliedCoupon,
  couponCode,
  setCouponCode,
  isCouponLoading,
  couponError,
  onApplyCoupon,
  onRemoveCoupon,
  isLoading
}) {
  return (
    <div className="checkout-section">
      {/* Bloco de Dados do Usuário */}
      <div className="checkout-card">
        <div className="checkout-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="checkout-title" style={{ margin: 0 }}>Seus Dados</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            {isExistingUser && (
              <button 
                onClick={onEditUserData} 
                className="checkout-change-link"
                style={{ color: '#059669', marginRight: '4px' }}
              >
                Editar Dados
              </button>
            )}
            <button 
              onClick={onEditCpf} 
              className="checkout-change-link"
            >
              Alterar CPF
            </button>
          </div>
        </div>

        {isExistingUser ? (
          <div className="checkout-existing-user-box">
            <div className="checkout-info-row">
              <i className="fas fa-user" aria-hidden="true"></i>
              <span className="font-medium">{name || 'Dados Cadastrados'}</span>
            </div>
            <div className="checkout-info-row">
              <i className="fas fa-id-card" aria-hidden="true"></i>
              <span className="font-medium">{cpf}</span>
            </div>
            <div className="checkout-info-row">
              <i className="fas fa-envelope" aria-hidden="true"></i>
              <span className="font-medium">{email || 'E-mail cadastrado'}</span>
            </div>
            <div className="checkout-info-row">
              <i className="fab fa-whatsapp" aria-hidden="true"></i>
              <span className="font-medium">{phone || 'WhatsApp cadastrado'}</span>
            </div>
          </div>
        ) : (
          <form id="checkout-form" onSubmit={onSubmit} className="checkout-form">
            <div className="checkout-form-group">
              <label className="checkout-label">Nome Completo</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Insira seu nome completo"
                className="checkout-input"
                required
                aria-required="true"
              />
            </div>
            <div className="checkout-form-group">
              <label className="checkout-label">E-mail</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Insira seu e-mail"
                className="checkout-input"
                required
                aria-required="true"
              />
            </div>
            <div className="checkout-form-group">
              <label className="checkout-label">WhatsApp (DDD + Número)</label>
              <input 
                type="tel" 
                value={phone}
                onChange={onChangePhone}
                placeholder="(00) 00000-0000"
                className="checkout-input"
                required
                aria-required="true"
              />
            </div>
          </form>
        )}
      </div>

      {/* Bloco explicativo sobre PIX */}
      <div className="checkout-card">
        <h2 className="checkout-title" style={{ marginBottom: '16px' }}>Pagamento via PIX</h2>
        <div className="checkout-pix-info">
          <i className="fab fa-pix" aria-hidden="true"></i>
          <div>
            <p className="checkout-pix-title">Rápido e Seguro</p>
            <p className="checkout-pix-subtitle">Aprovação imediata do seu pedido.</p>
          </div>
        </div>
      </div>

      {/* Resumo do Pedido e Pagamento */}
      <div className="checkout-card checkout-summary-card">
        <div className="checkout-summary-row">
          <span>Subtotal ({cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'})</span>
          <span>{cartSubtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
        </div>
        <div className="checkout-summary-row">
          <span>Desconto</span>
          <span style={{ color: '#16a34a' }}>- {cartDiscount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
        </div>
        
        {/* Cupom Section */}
        <div className="checkout-coupon-container">
          {appliedCoupon ? (
            <div className="checkout-coupon-applied">
              <span className="coupon-badge">
                <i className="fas fa-ticket-alt" aria-hidden="true"></i> {appliedCoupon.name || (typeof appliedCoupon === 'string' ? appliedCoupon : 'Cupom Ativo')}
              </span>
              <button onClick={onRemoveCoupon} className="coupon-remove-btn" type="button" disabled={isCouponLoading}>
                Remover
              </button>
            </div>
          ) : (
            <div className="checkout-coupon-input-group">
              <input 
                type="text" 
                placeholder="DIGITE O CUPOM" 
                value={couponCode} 
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="checkout-coupon-input"
              />
              <button 
                onClick={onApplyCoupon} 
                disabled={isCouponLoading || !couponCode}
                className="checkout-coupon-apply-btn"
                type="button"
              >
                {isCouponLoading ? <i className="fas fa-spinner fa-spin" aria-hidden="true"></i> : 'Aplicar'}
              </button>
            </div>
          )}
          {couponError && <p className="coupon-error-msg">{couponError}</p>}
        </div>

        <div className="checkout-divider"></div>
        <div className="checkout-total-row">
          <span className="checkout-total-label">Total</span>
          <span className="checkout-total-value">{cartTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
        </div>
        
        <button 
          type="submit" 
          form={!isExistingUser ? "checkout-form" : undefined}
          onClick={isExistingUser ? onSubmit : undefined}
          disabled={isLoading}
          className="checkout-btn-primary"
        >
          {isLoading ? <i className="fas fa-spinner fa-spin" aria-hidden="true"></i> : (
            <>
              <i className="fab fa-pix" aria-hidden="true"></i>
              Finalizar via PIX
            </>
          )}
        </button>
      </div>
    </div>
  );
}
