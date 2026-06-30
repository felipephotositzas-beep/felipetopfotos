/**
 * src/pages/Checkout.jsx
 * Página principal e orquestradora do fluxo de Checkout.
 * Utiliza sub-componentes especializados (CheckoutCpfStep, CheckoutUserDataStep, CheckoutPixStep)
 * e o serviço checkoutService para comunicação de rede (SOLID/Clean Code).
 */
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/Toast';
import { logger } from '../utils/logger';
import { maskCpf, maskPhone } from '../utils/masks';
import { resolveUrl } from '../utils/urls';
import { getCookie } from '../utils/cookies';
import { SecureStorage } from '../utils/storage';
import { downloadAllPhotos } from '../utils/download';

// Import dos sub-componentes especializados
import CheckoutCpfStep from './checkout/CheckoutCpfStep';
import CheckoutUserDataStep from './checkout/CheckoutUserDataStep';
import CheckoutPixStep from './checkout/CheckoutPixStep';

// Import do serviço de API do Checkout
import {
  getCustomerInfo,
  getCustomerOrders,
  createOrder,
  getOrderDetails,
  getPixDetails
} from '../services/checkoutService';

const isRedacted = (val) => {
  if (!val) return false;
  return val.includes('*') || val.includes('X');
};

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const cartId = searchParams.get('cart_id');
  const toast = useToast();
  const navigate = useNavigate();

  const { 
    cartItems, 
    cartSubtotal, 
    cartDiscount, 
    cartTotal, 
    clearCart, 
    initializeCartWithId,
    appliedCoupon,
    applyCoupon,
    removeCoupon
  } = useCart();

  // Estados de controle de fluxo e formulários
  const [step, setStep] = useState('cpf'); // 'cpf' | 'userData' | 'pix'
  const [cpf, setCpf] = useState('');
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Estados de Cupom
  const [couponCode, setCouponCode] = useState('');
  const [isCouponLoading, setIsCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Estados dos dados do cliente
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Estados do pedido gerado
  const [order, setOrder] = useState(null);
  const [pixData, setPixData] = useState(null);
  const [orderStatus, setOrderStatus] = useState('PENDING_PAYMENT');

  const pollIntervalRef = useRef(null);
  const startTimeRef = useRef(null);

  // Carrega cupom do CartContext caso já esteja aplicado
  useEffect(() => {
    if (appliedCoupon) {
      setCouponCode(appliedCoupon.name || '');
    }
  }, [appliedCoupon]);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsCouponLoading(true);
    setCouponError('');
    const res = await applyCoupon(couponCode);
    setIsCouponLoading(false);
    if (!res.success) {
      setCouponError(res.error);
    } else {
      setCouponCode('');
    }
  };

  const handleRemoveCoupon = async () => {
    setIsCouponLoading(true);
    await removeCoupon();
    setIsCouponLoading(false);
  };

  const checkExistingOrderForCart = async (targetCartId, optCpf) => {
    let savedOrderStr = localStorage.getItem(`order_by_cart_${targetCartId}`);
    let orderId = null;
    
    if (savedOrderStr) {
      try {
        const savedOrder = JSON.parse(savedOrderStr);
        orderId = savedOrder.id;
      } catch {}
    }
    const savedCpf = optCpf || await SecureStorage.get('customer_cpf') || getCookie('customer_document');
    if (!orderId && savedCpf) {
      try {
        const data = await getCustomerOrders(savedCpf.replace(/\D/g, ''));
        const results = Array.isArray(data) ? data : (data.results || []);
        const found = results.find(o => o.cart_data?.id === targetCartId);
        if (found) {
          orderId = found.id;
          localStorage.setItem(`order_by_cart_${targetCartId}`, JSON.stringify(found));
        }
      } catch {}
    }
    
    if (orderId) {
      try {
        const orderData = await getOrderDetails(orderId);
        setOrder(orderData);
        setOrderStatus(orderData.status);
        
        if (orderData.status === 'PAID') {
          setStep('pix');
          return true;
        } else {
          const activePix = await getPixDetails(orderId);
          if (activePix) {
            setPixData(activePix);
            setStep('pix');
            startTimeRef.current = Date.now();
            return true;
          }
        }
      } catch (err) {
        logger.error('Erro ao buscar pedido existente:', err);
      }
    }
    return false;
  };

  useEffect(() => {
    if (cartId) {
      const load = async () => {
        setIsLoading(true);
        const hasOrder = await checkExistingOrderForCart(cartId);
        if (!hasOrder) {
          await initializeCartWithId(cartId);
        }
        setIsLoading(false);
      };
      load();
    }
  }, [cartId, initializeCartWithId]);

  const handleCpfChange = (e) => {
    setCpf(maskCpf(e.target.value));
  };

  const handlePhoneChange = (e) => {
    setPhone(maskPhone(e.target.value));
  };

  const handleDownloadAll = async (items, orderNumber) => {
    const paidItems = items.filter(item => item.photo?.delivery_path);
    if (paidItems.length === 0) {
      toast.warning('Nenhuma foto disponível para download.');
      return;
    }
    const downloadItems = paidItems.map((item, i) => {
      const url = resolveUrl(item.photo.delivery_path);
      const ext = url.split('.').pop().split('?')[0] || 'jpg';
      return { url, filename: `pedido-${orderNumber}-foto-${i + 1}.${ext}` };
    });
    await downloadAllPhotos(downloadItems);
  };

  const handleCpfSubmit = async (e) => {
    e.preventDefault();
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length < 11) {
      toast.warning('Digite um CPF válido com 11 dígitos.');
      return;
    }
    
    setIsLoading(true);
    try {
      const customer = await getCustomerInfo(cleanCpf);
      setIsExistingUser(true);
      setName(customer?.customer_name || '');
      setEmail(customer?.customer_email || '');
      setPhone(customer?.customer_phone ? (isRedacted(customer.customer_phone) ? customer.customer_phone : maskPhone(customer.customer_phone)) : '');
      
      await SecureStorage.set('customer_cpf', cleanCpf);
      const hasOrder = await checkExistingOrderForCart(cartId, cleanCpf);
      if (!hasOrder) {
        setStep('userData');
      }
    } catch (error) {
      logger.warn('CPF não possui cadastro completo ou ocorreu erro:', error);
      setIsExistingUser(false);
      setName('');
      setEmail('');
      setPhone('');
      await SecureStorage.set('customer_cpf', cleanCpf);
      setStep('userData');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalize = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    
    const cleanCpf = cpf.replace(/\D/g, '');
    const cleanPhone = (val) => {
      if (isRedacted(val)) {
        return val.replace(/[\s\-()]/g, '');
      }
      return val.replace(/\D/g, '');
    };

    const formattedCpf = cleanCpf.length === 11
      ? `${cleanCpf.slice(0,3)}.${cleanCpf.slice(3,6)}.${cleanCpf.slice(6,9)}-${cleanCpf.slice(9)}`
      : cpf;

    const formattedTotal = typeof cartTotal === 'number'
      ? cartTotal.toFixed(2)
      : String(cartTotal);

    const payload = {
      cart_id: cartId,
      total_value: formattedTotal,
      customer_document: formattedCpf
    };

    const shouldUseStoredCustomer = isExistingUser || isRedacted(name) || isRedacted(email) || isRedacted(phone);

    if (!shouldUseStoredCustomer) {
      payload.customer_name = name;
      payload.customer_email = email;
      payload.customer_phone = cleanPhone(phone);
    }

    try {
      const checkoutResponse = await createOrder(payload);

      if (checkoutResponse.ok) {
        const orderData = await checkoutResponse.json();
        setOrder(orderData);
        localStorage.setItem(`order_by_cart_${cartId}`, JSON.stringify(orderData));
        await SecureStorage.set('customer_cpf', cleanCpf);

        const activePix = await getPixDetails(orderData.id);
        if (activePix) {
          setPixData(activePix);
          setStep('pix');
          startTimeRef.current = Date.now();
          clearCart();
        } else {
          toast.error('Erro ao gerar QR Code do Pix.');
        }
      } else {
        let errMsg = 'Erro ao processar o checkout.';
        let hasMissingDataErr = false;
        try {
          const errData = await checkoutResponse.json();
          if (typeof errData === 'object' && errData !== null) {
            if (errData.non_field_errors) {
              errMsg = errData.non_field_errors.join(', ');
              const isCartNotFound = errData.non_field_errors.some(err =>
                err.includes('Carrinho não encontrado') || err.includes('Carrinho')
              );
              hasMissingDataErr = !isCartNotFound && errData.non_field_errors.some(err => 
                err.includes('Dados do cliente') || err.includes('cliente ausentes')
              );
            } else {
              errMsg = errData.error || errData.detail || JSON.stringify(errData);
            }
          }
        } catch {
          try {
            const errText = await checkoutResponse.text();
            if (errText) errMsg = errText;
          } catch {}
        }
        
        if (hasMissingDataErr) {
          setIsExistingUser(false);
          setName(prev => isRedacted(prev) ? '' : prev);
          setEmail(prev => isRedacted(prev) ? '' : prev);
          setPhone(prev => isRedacted(prev) || prev.replace(/\D/g, '').length < 11 ? '' : prev);
          toast.warning('Por favor, verifique os seus dados de contato para prosseguir.');
        } else {
          toast.error(errMsg);
        }
      }
    } catch (error) {
      logger.error('Checkout error:', error);
      toast.error('Falha na conexão com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  // Polling de status do pedido de PIX pendente
  useEffect(() => {
    if (step === 'pix' && order?.id) {
      const checkStatus = async () => {
        // Encerra polling após 10 minutos
        if (Date.now() - startTimeRef.current > 600000) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          return;
        }

        try {
          const data = await getOrderDetails(order.id);
          if (data.status === 'PAID') {
            setOrder(data);
            setOrderStatus('PAID');
            localStorage.setItem(`order_by_cart_${cartId}`, JSON.stringify(data));
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          }
        } catch (err) {
          logger.warn('Erro ao consultar status do pedido:', err);
        }
      };

      pollIntervalRef.current = setInterval(checkStatus, 5000);

      return () => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      };
    }
  }, [step, order, cartId]);

  const handleEditCpf = () => {
    setStep('cpf');
  };

  const handleEditUserData = () => {
    setIsExistingUser(false);
    setName(prev => isRedacted(prev) ? '' : prev);
    setEmail(prev => isRedacted(prev) ? '' : prev);
    setPhone(prev => isRedacted(prev) ? '' : prev);
  };

  return (
    <div className="checkout-page">
      <header className="checkout-header">
        <button onClick={() => navigate(-1)} className="checkout-back-btn" aria-label="Voltar para a página anterior">
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1 className="checkout-header-title">Finalizar Pedido</h1>
        <div style={{ width: '40px' }}></div>
      </header>

      <main className="checkout-container">
        {/* Passos do Checkout (indicador gráfico) */}
        {step !== 'pix' && (
          <div className="checkout-steps-indicator">
            <div className={`checkout-step-dot ${step === 'cpf' || step === 'userData' || step === 'pix' ? 'active' : ''}`}></div>
            <div className={`checkout-step-line ${step === 'userData' || step === 'pix' ? 'active' : ''}`}></div>
            <div className={`checkout-step-dot ${step === 'userData' || step === 'pix' ? 'active' : ''}`}></div>
            <div className={`checkout-step-line ${step === 'pix' ? 'active' : ''}`}></div>
            <div className={`checkout-step-dot ${step === 'pix' ? 'active' : ''}`}></div>
          </div>
        )}

        {/* Step 1: CPF */}
        {step === 'cpf' && (
          <CheckoutCpfStep 
            cpf={cpf}
            onChange={handleCpfChange}
            onSubmit={handleCpfSubmit}
            isLoading={isLoading}
            cartLength={cartItems.length}
          />
        )}

        {/* Step 2: Dados cadastrais */}
        {step === 'userData' && (
          <CheckoutUserDataStep 
            isExistingUser={isExistingUser}
            name={name}
            setName={setName}
            email={email}
            setEmail={setEmail}
            phone={phone}
            onChangePhone={handlePhoneChange}
            cpf={cpf}
            onEditUserData={handleEditUserData}
            onEditCpf={handleEditCpf}
            onSubmit={handleFinalize}
            cartItems={cartItems}
            cartSubtotal={cartSubtotal}
            cartDiscount={cartDiscount}
            cartTotal={cartTotal}
            appliedCoupon={appliedCoupon}
            couponCode={couponCode}
            setCouponCode={setCouponCode}
            isCouponLoading={isCouponLoading}
            couponError={couponError}
            onApplyCoupon={handleApplyCoupon}
            onRemoveCoupon={handleRemoveCoupon}
            isLoading={isLoading}
          />
        )}

        {/* Step 3: PIX / Confirmação */}
        {step === 'pix' && (
          <CheckoutPixStep 
            orderStatus={orderStatus}
            order={order}
            pixData={pixData}
            resolveUrl={resolveUrl}
            onDownloadAll={handleDownloadAll}
            onNavigateHome={() => navigate('/')}
            onCopyPix={() => {
              navigator.clipboard.writeText(pixData.qrcode_data)
                .then(() => toast.success('Chave Pix copiada!'))
                .catch(() => toast.error('Não foi possível copiar.'));
            }}
          />
        )}
      </main>
    </div>
  );
};

export default Checkout;
