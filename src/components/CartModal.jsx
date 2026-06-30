import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const CartModal = () => {
  const { cartItems, cartTotal, removeFromCart, isCartModalOpen, setIsCartModalOpen, cartId } = useCart();
  const navigate = useNavigate();

  if (!isCartModalOpen) return null;

  const handleCheckout = () => {
    setIsCartModalOpen(false);
    navigate(`/checkout?cart_id=${cartId}`);
  };

  return (
    <div className="cart-modal-backdrop">
      {/* Backdrop area click-to-close */}
      <div 
        style={{ position: 'absolute', inset: 0 }}
        onClick={() => setIsCartModalOpen(false)}
      ></div>
      
      {/* Drawer */}
      <div className="cart-modal-drawer animate-slide-in-right">
        {/* Header */}
        <div className="cart-modal-header">
          <h2 className="cart-modal-title">Seu Carrinho</h2>
          <button 
            onClick={() => setIsCartModalOpen(false)}
            className="cart-modal-close-btn"
            aria-label="Fechar carrinho"
          >
            <i className="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>

        {/* Cart Items */}
        <div className="cart-modal-content">
          {cartItems.length === 0 ? (
            <div className="cart-modal-empty">
              <i className="fas fa-shopping-cart" aria-hidden="true"></i>
              <p>Seu carrinho está vazio.</p>
            </div>
          ) : (
            <ul className="cart-items-list">
              {cartItems.map((item) => (
                <li key={item.id} className="cart-item-card">
                  <img 
                    src={item.url} 
                    alt={item.is_video ? `Miniatura do vídeo #${item.short_reference}` : `Miniatura da foto #${item.short_reference}`} 
                    className="cart-item-thumb"
                  />
                  <div className="cart-item-details">
                    <div className="cart-item-header">
                      <span className="cart-item-name">
                        {item.is_video ? `Vídeo #${item.short_reference}` : `Foto #${item.short_reference}`}
                      </span>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="cart-item-remove-btn"
                        title="Remover"
                        aria-label={`Remover ${item.is_video ? 'vídeo' : 'foto'} #${item.short_reference} do carrinho`}
                      >
                        <i className="fas fa-trash-alt" aria-hidden="true"></i>
                      </button>
                    </div>
                    <span className="cart-item-price">
                      {item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="cart-modal-footer">
            <div className="cart-total-container">
              <span className="cart-total-label">Total:</span>
              <span className="cart-total-price">
                {cartTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
            <button 
              onClick={handleCheckout}
              className="cart-checkout-btn"
            >
              Finalizar Compra
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartModal;
