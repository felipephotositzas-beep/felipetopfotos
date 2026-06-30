/**
 * src/context/CartContext.jsx
 * Contexto global de estado do carrinho de compras.
 * Consome os serviços da camada cartService para persistência no backend.
 */
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { logger } from '../utils/logger';
import {
  getCart,
  addPhotoToCart,
  removePhotoFromCart,
  applyCartCoupon,
  removeCartCoupon
} from '../services/cartService';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartId, setCartId] = useState('');
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [cartSubtotal, setCartSubtotal] = useState(0);
  const [cartDiscount, setCartDiscount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const PHOTO_PRICE = 11.90; // Preço padrão da foto

  const parsePrice = (priceVal, defaultVal = 0) => {
    if (priceVal === undefined || priceVal === null) return defaultVal;
    if (typeof priceVal === 'number') return priceVal;
    const cleanVal = String(priceVal).replace(/\s/g, '').replace(',', '.');
    const parsed = parseFloat(cleanVal);
    return isNaN(parsed) ? defaultVal : parsed;
  };

  const syncCartState = useCallback((backendCart) => {
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
  }, []);

  const [currentEventId, setCurrentEventId] = useState('');

  const loadLocalCart = useCallback((eventId) => {
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
  }, []);

  const fetchAndSyncCart = useCallback(async (targetCartId, eventId = '') => {
    try {
      const data = await getCart(targetCartId);
      
      // Carrega backup local indexado pelo cartId
      const savedBackup = localStorage.getItem('topfotos_cart_backup_' + targetCartId);
      const backupItems = savedBackup ? JSON.parse(savedBackup) : [];
      
      // Self-healing: Sincroniza itens salvos localmente que ainda não estão no backend
      const savedCart = eventId ? localStorage.getItem('topfotos_cart_' + eventId) : null;
      const localItems = savedCart ? JSON.parse(savedCart) : backupItems;
      const backendPhotoIds = data.items ? data.items.map(item => item.photo.id) : [];

      let hasNewAdditions = false;
      let syncSuccessCount = 0;

      for (const item of localItems) {
        if (!backendPhotoIds.includes(item.id)) {
          logger.log(`[Self-Healing] Sincronizando item local no backend: ${item.id}`);
          try {
            await addPhotoToCart(targetCartId, item.id);
            hasNewAdditions = true;
            syncSuccessCount++;
          } catch (e) {
            logger.error('[Self-Healing] Falha ao sincronizar item:', e);
          }
        }
      }

      if (hasNewAdditions && syncSuccessCount > 0) {
        // Busca novamente os dados atualizados
        const updatedData = await getCart(targetCartId);
        syncCartState(updatedData);
        return;
      }

      // Se o backend retornou vazio (sem itens), mas temos itens no backup local,
      // nós mantemos os itens locais como contingência offline resiliente!
      if ((!data.items || data.items.length === 0) && localItems.length > 0) {
        logger.warn('[Sincronização] Backend vazio ou indisponível. Usando contingência local do carrinho.');
        setCartItems(localItems);
        const subtotal = localItems.reduce((sum, item) => sum + item.price, 0);
        setCartSubtotal(subtotal);
        setCartTotal(subtotal);
        setCartDiscount(0);
        return;
      }

      syncCartState(data);
    } catch (err) {
      logger.warn('Erro ao buscar carrinho do backend:', err);
      // Fallback para o backup local se a chamada do getCart falhar por completo
      const savedBackup = localStorage.getItem('topfotos_cart_backup_' + targetCartId);
      if (savedBackup) {
        const items = JSON.parse(savedBackup);
        setCartItems(items);
        const subtotal = items.reduce((sum, item) => sum + item.price, 0);
        setCartSubtotal(subtotal);
        setCartTotal(subtotal);
        setCartDiscount(0);
      } else if (eventId) {
        loadLocalCart(eventId);
      }
    }
  }, [syncCartState, loadLocalCart]);

  const initializeCartForEvent = useCallback(async (eventId) => {
    setCurrentEventId(eventId);
    let currentCartId = localStorage.getItem('cart_by_event_' + eventId);
    if (!currentCartId) {
      currentCartId = crypto.randomUUID();
      localStorage.setItem('cart_by_event_' + eventId, currentCartId);
    }
    setCartId(currentCartId);
    await fetchAndSyncCart(currentCartId, eventId);
  }, [fetchAndSyncCart]);

  const initializeCartWithId = useCallback(async (specificCartId) => {
    setCartId(specificCartId);
    await fetchAndSyncCart(specificCartId);
  }, [fetchAndSyncCart]);

  useEffect(() => {
    if (currentEventId && cartItems.length > 0) {
      localStorage.setItem('topfotos_cart_' + currentEventId, JSON.stringify(cartItems));
    } else if (currentEventId) {
      localStorage.removeItem('topfotos_cart_' + currentEventId);
    }
  }, [cartItems, currentEventId]);

  useEffect(() => {
    if (cartId && cartItems.length > 0) {
      localStorage.setItem('topfotos_cart_backup_' + cartId, JSON.stringify(cartItems));
    }
  }, [cartItems, cartId]);

  const addToCart = useCallback(async (photo) => {
    if (cartItems.some(item => item.id === photo.id)) return;

    // Adição otimista na UI local
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

    // Sincronização em background com o backend
    try {
      const data = await addPhotoToCart(cartId, photo.id);
      syncCartState(data);
    } catch (err) {
      logger.error('Erro ao adicionar item ao carrinho no backend:', err);
    }
  }, [cartItems, cartId, syncCartState]);

  const removeFromCart = useCallback(async (photoId) => {
    const item = cartItems.find(i => i.id === photoId);
    if (!item) return;

    // Remoção otimista na UI local
    const updatedLocal = cartItems.filter(i => i.id !== photoId);
    setCartItems(updatedLocal);
    const subtotal = updatedLocal.reduce((sum, item) => sum + item.price, 0);
    setCartSubtotal(subtotal);
    setCartTotal(subtotal);

    if (item.cartItemId && !item.cartItemId.startsWith('temp-')) {
      try {
        const data = await removePhotoFromCart(cartId, item.cartItemId);
        syncCartState(data);
      } catch (err) {
        logger.error('Erro ao remover item do carrinho no backend:', err);
      }
    }
  }, [cartItems, cartId, syncCartState]);

  const isInCart = useCallback((photoId) => {
    return cartItems.some(item => item.id === photoId);
  }, [cartItems]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setCartSubtotal(0);
    setCartDiscount(0);
    setCartTotal(0);
    setAppliedCoupon(null);
    if (currentEventId) {
      localStorage.removeItem('topfotos_cart_' + currentEventId);
      localStorage.removeItem('cart_by_event_' + currentEventId);
    }
  }, [currentEventId]);

  const applyCoupon = useCallback(async (couponCode) => {
    try {
      const result = await applyCartCoupon(cartId, couponCode);
      if (result.success) {
        syncCartState(result.data);
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      logger.error('Erro ao aplicar cupom:', err);
      return { success: false, error: 'Falha na conexão com o servidor.' };
    }
  }, [cartId, syncCartState]);

  const removeCoupon = useCallback(async () => {
    try {
      const data = await removeCartCoupon(cartId);
      syncCartState(data);
      return { success: true };
    } catch (err) {
      logger.error('Erro ao remover cupom:', err);
      return { success: false };
    }
  }, [cartId, syncCartState]);

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
