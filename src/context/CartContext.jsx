import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiUrl } from '../config/api';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

// CSRF helper to read csrftoken cookie
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartId, setCartId] = useState('');
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [cartSubtotal, setCartSubtotal] = useState(0);
  const [cartDiscount, setCartDiscount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const PHOTO_PRICE = 11.90; // Default price per photo

  const parsePrice = (priceVal, defaultVal = 0) => {
    if (priceVal === undefined || priceVal === null) return defaultVal;
    if (typeof priceVal === 'number') return priceVal;
    const cleanVal = String(priceVal).replace(/\s/g, '').replace(',', '.');
    const parsed = parseFloat(cleanVal);
    return isNaN(parsed) ? defaultVal : parsed;
  };

  const syncCartState = (backendCart) => {
    if (!backendCart) return;
    
    if (backendCart.items) {
      const items = backendCart.items.map(item => ({
        id: item.photo.id,
        cartItemId: item.id,
        short_reference: item.photo.short_reference,
        watermark_path: item.photo.watermark_path,
        url: item.photo.watermark_path,
        is_video: item.photo.is_video,
        price: parsePrice(item.photo.price, PHOTO_PRICE)
      }));
      setCartItems(items);
      setCartSubtotal(parsePrice(backendCart.value || 0));
      setCartDiscount(parsePrice(backendCart.progressive_discount || 0) + parsePrice(backendCart.coupon_discount || 0));
      setCartTotal(parsePrice(backendCart.total_value || 0));
      setAppliedCoupon(backendCart.coupon || null);
    } else {
      setCartItems([]);
      setCartSubtotal(0);
      setCartDiscount(0);
      setCartTotal(0);
      setAppliedCoupon(null);
    }
  };

  const [currentEventId, setCurrentEventId] = useState('');

  const loadLocalCart = (eventId) => {
    const savedCart = localStorage.getItem('topfotos_cart_' + eventId);
    if (savedCart) {
      const rawItems = JSON.parse(savedCart) || [];
      const items = rawItems.map(item => ({
        ...item,
        price: parsePrice(item.price, PHOTO_PRICE)
      }));
      setCartItems(items);
      const subtotal = items.reduce((sum, item) => sum + item.price, 0);
      setCartSubtotal(subtotal);
      setCartTotal(subtotal);
      setCartDiscount(0);
    } else {
      setCartItems([]);
      setCartSubtotal(0);
      setCartTotal(0);
      setCartDiscount(0);
    }
  };

  const fetchAndSyncCart = async (targetCartId, eventId = '') => {
    try {
      const res = await fetch(apiUrl(`/api/cart/${targetCartId}`));
      if (res.ok) {
        const data = await res.json();
        
        // Self-healing: Check if we have items in localStorage that aren't on the backend yet
        const savedCart = eventId ? localStorage.getItem('topfotos_cart_' + eventId) : null;
        const localItems = savedCart ? JSON.parse(savedCart) : [];
        const backendPhotoIds = data.items ? data.items.map(item => item.photo.id) : [];

        let hasNewAdditions = false;
        const csrfToken = getCookie('csrftoken');
        const headers = { 'Content-Type': 'application/json' };
        if (csrfToken) headers['X-CSRFTOKEN'] = csrfToken;

        for (const item of localItems) {
          if (!backendPhotoIds.includes(item.id)) {
            console.log(`[Self-Healing] Sincronizando item local no backend: ${item.id}`);
            try {
              await fetch(apiUrl(`/api/cart/${targetCartId}/add/photo`), {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  reference: item.id,
                  item_type: 'photo'
                })
              });
              hasNewAdditions = true;
            } catch (e) {
              console.error('[Self-Healing] Falha ao sincronizar item:', e);
            }
          }
        }

        if (hasNewAdditions) {
          // Refetch updated cart data
          const refetchRes = await fetch(apiUrl(`/api/cart/${targetCartId}`));
          if (refetchRes.ok) {
            const refetchData = await refetchRes.json();
            syncCartState(refetchData);
            return;
          }
        }

        syncCartState(data);
      } else {
        if (eventId) loadLocalCart(eventId);
      }
    } catch (err) {
      console.warn('Erro ao buscar carrinho do backend:', err);
      if (eventId) loadLocalCart(eventId);
    }
  };

  const initializeCartForEvent = async (eventId) => {
    setCurrentEventId(eventId);
    let currentCartId = localStorage.getItem('cart_by_event_' + eventId);
    if (!currentCartId) {
      currentCartId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      localStorage.setItem('cart_by_event_' + eventId, currentCartId);
    }
    setCartId(currentCartId);
    await fetchAndSyncCart(currentCartId, eventId);
  };

  const initializeCartWithId = async (specificCartId) => {
    setCartId(specificCartId);
    await fetchAndSyncCart(specificCartId);
  };

  useEffect(() => {
    // Save cart to localStorage whenever it changes
    if (currentEventId && cartItems.length > 0) {
      localStorage.setItem('topfotos_cart_' + currentEventId, JSON.stringify(cartItems));
    } else if (currentEventId) {
      localStorage.removeItem('topfotos_cart_' + currentEventId);
    }
  }, [cartItems, currentEventId]);

  const addToCart = async (photo) => {
    if (cartItems.some(item => item.id === photo.id)) return;

    // Optimistic local add
    const tempCartItemId = `temp-${Date.now()}`;
    const newItem = {
      id: photo.id,
      cartItemId: tempCartItemId,
      short_reference: photo.short_reference,
      watermark_path: photo.watermark_path || photo.url,
      url: photo.watermark_path || photo.url,
      is_video: !!photo.is_video,
      price: parsePrice(photo.price, PHOTO_PRICE)
    };

    const updatedLocal = [...cartItems, newItem];
    setCartItems(updatedLocal);
    const subtotal = updatedLocal.reduce((sum, item) => sum + item.price, 0);
    setCartSubtotal(subtotal);
    setCartTotal(subtotal);

    // Backend sync
    try {
      const csrfToken = getCookie('csrftoken');
      const headers = {
        'Content-Type': 'application/json'
      };
      if (csrfToken) headers['X-CSRFTOKEN'] = csrfToken;

      const response = await fetch(apiUrl(`/api/cart/${cartId}/add/photo`), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          reference: photo.id,
          item_type: 'photo'
        })
      });

      if (response.ok) {
        const data = await response.json();
        syncCartState(data);
      }
    } catch (err) {
      console.error('Erro ao adicionar item ao carrinho no backend:', err);
    }
  };

  const removeFromCart = async (photoId) => {
    const item = cartItems.find(i => i.id === photoId);
    if (!item) return;

    // Optimistic local remove
    const updatedLocal = cartItems.filter(i => i.id !== photoId);
    setCartItems(updatedLocal);
    const subtotal = updatedLocal.reduce((sum, item) => sum + item.price, 0);
    setCartSubtotal(subtotal);
    setCartTotal(subtotal);

    if (item.cartItemId && !item.cartItemId.startsWith('temp-')) {
      try {
        const csrfToken = getCookie('csrftoken');
        const headers = {};
        if (csrfToken) headers['X-CSRFTOKEN'] = csrfToken;

        const response = await fetch(apiUrl(`/api/cart/${cartId}/remove/${item.cartItemId}`), {
          method: 'DELETE',
          headers
        });

        if (response.ok) {
          const data = await response.json();
          syncCartState(data);
        }
      } catch (err) {
        console.error('Erro ao remover item do carrinho no backend:', err);
      }
    }
  };

  const isInCart = (photoId) => {
    return cartItems.some(item => item.id === photoId);
  };

  const clearCart = () => {
    setCartItems([]);
    setCartSubtotal(0);
    setCartDiscount(0);
    setCartTotal(0);
    setAppliedCoupon(null);
    if (currentEventId) {
      localStorage.removeItem('topfotos_cart_' + currentEventId);
      localStorage.removeItem('cart_by_event_' + currentEventId);
    }
  };

  const applyCoupon = async (couponCode) => {
    try {
      const csrfToken = getCookie('csrftoken');
      const headers = {
        'Content-Type': 'application/json'
      };
      if (csrfToken) headers['X-CSRFTOKEN'] = csrfToken;

      const response = await fetch(apiUrl(`/api/cart/${cartId}/apply/coupon`), {
        method: 'POST',
        headers,
        body: JSON.stringify({ coupon: couponCode })
      });

      const data = await response.json();
      if (response.ok) {
        syncCartState(data);
        return { success: true };
      } else {
        return { success: false, error: data.detail || 'Cupom inválido!' };
      }
    } catch (err) {
      console.error('Erro ao aplicar cupom:', err);
      return { success: false, error: 'Falha na conexão com o servidor.' };
    }
  };

  const removeCoupon = async () => {
    try {
      const csrfToken = getCookie('csrftoken');
      const headers = {};
      if (csrfToken) headers['X-CSRFTOKEN'] = csrfToken;

      const response = await fetch(apiUrl(`/api/cart/${cartId}/remove/coupon`), {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        const data = await response.json();
        syncCartState(data);
        return { success: true };
      } else {
        return { success: false };
      }
    } catch (err) {
      console.error('Erro ao remover cupom:', err);
      return { success: false };
    }
  };

  const cartCount = cartItems.length;

  return (
    <CartContext.Provider value={{
      cartItems,
      cartId,
      cartCount,
      cartSubtotal,
      cartDiscount,
      cartTotal,
      addToCart,
      removeFromCart,
      isInCart,
      clearCart,
      isCartModalOpen,
      setIsCartModalOpen,
      initializeCartForEvent,
      initializeCartWithId,
      appliedCoupon,
      applyCoupon,
      removeCoupon
    }}>
      {children}
    </CartContext.Provider>
  );
};
