import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const CartFloatingBar = () => {
  const { cartCount, cartTotal, setIsCartModalOpen } = useCart();

  if (cartCount === 0) return null;

  return (
    <div className="cart-floating-bar">
      <div className="cart-floating-bar-info">
        <span className="cart-floating-bar-count">Itens: {cartCount} {cartCount === 1 ? 'item' : 'itens'}</span>
        <span className="cart-floating-bar-total">Total: {cartTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
      </div>
      <button 
        onClick={() => setIsCartModalOpen(true)}
        className="cart-floating-bar-btn"
      >
        Ver Carrinho
      </button>
    </div>
  );
};

export default CartFloatingBar;
