import React, { useState, useEffect, useRef } from 'react';
import { apiUrl } from '../config/api';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

const isRedacted = (val) => {
  if (!val) return false;
  return val.includes('*') || val.includes('X');
};

const resolveUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('/')) {
    return `https://painel.topfotos.com.br${url}`;
  }
  return url;
};

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const cartId = searchParams.get('cart_id');
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
  const navigate = useNavigate();

  const [step, setStep] = useState('cpf'); // 'cpf' | 'userData' | 'pix'
  const [cpf, setCpf] = useState('');
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [isCouponLoading, setIsCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

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

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Order & Pix details
  const [order, setOrder] = useState(null);
  const [pixData, setPixData] = useState(null);
  const [orderStatus, setOrderStatus] = useState('PENDING_PAYMENT');

  const pollIntervalRef = useRef(null);
  const startTimeRef = useRef(null);

  const getPixDetails = async (orderId, initialPixData) => {
    if (initialPixData && initialPixData.qrcode_data) {
      return initialPixData;
    }
    try {
      const pixResponse = await fetch(apiUrl(`/api/order/checkout-pix/${orderId}`));
      if (pixResponse.ok) {
        const pixDetails = await pixResponse.json();
        return pixDetails.pix_data || pixDetails.order?.pix_data || null;
      }
    } catch (e) {
      console.error('Erro ao buscar checkout-pix:', e);
    }
    return null;
  };

  const checkExistingOrderForCart = async (targetCartId, optCpf) => {
    let savedOrderStr = localStorage.getItem(`order_by_cart_${targetCartId}`);
    let orderId = null;
    
    if (savedOrderStr) {
      try {
        const savedOrder = JSON.parse(savedOrderStr);
        orderId = savedOrder.id;
      } catch (e) {}
    }
    
    const savedCpf = optCpf || localStorage.getItem('customer_cpf') || getCookie('customer_document');
    if (!orderId && savedCpf) {
      try {
        const response = await fetch(apiUrl('/api/customer/orders'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cpf: savedCpf.replace(/\D/g, '') })
        });
        if (response.ok) {
          const data = await response.json();
          const found = data.results?.find(o => o.cart_data?.id === targetCartId);
          if (found) {
            orderId = found.id;
            localStorage.setItem(`order_by_cart_${targetCartId}`, JSON.stringify(found));
          }
        }
      } catch (e) {}
    }
    
    if (orderId) {
      try {
        const response = await fetch(apiUrl(`/api/order/${orderId}`));
        if (response.ok) {
          const orderData = await response.json();
          setOrder(orderData);
          setOrderStatus(orderData.status);
          
          if (orderData.status === 'PAID') {
            setStep('pix');
            return true;
          } else {
            const activePix = await getPixDetails(orderId, orderData.pix_data);
            if (activePix) {
              setPixData(activePix);
              setStep('pix');
              startTimeRef.current = Date.now();
              return true;
            }
          }
        }
      } catch (err) {
        console.error('Erro ao buscar pedido existente:', err);
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
  }, [cartId]);

  const maskCpf = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const maskPhone = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const handleCpfChange = (e) => {
    setCpf(maskCpf(e.target.value));
  };

  const handlePhoneChange = (e) => {
    setPhone(maskPhone(e.target.value));
  };

  const handleDownloadAll = async (items, orderNumber) => {
    const paidItems = items.filter(item => item.photo?.delivery_path);
    if (paidItems.length === 0) {
      alert('Nenhuma foto disponível para download.');
      return;
    }

    for (let i = 0; i < paidItems.length; i++) {
      const item = paidItems[i];
      const url = resolveUrl(item.photo.delivery_path);
      const a = document.createElement('a');
      a.href = url;
      const extension = url.split('.').pop().split('?')[0] || 'jpg';
      a.download = `pedido-${orderNumber}-foto-${i + 1}.${extension}`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      await new Promise(resolve => setTimeout(resolve, 400));
    }
  };

  const handleCpfSubmit = async (e) => {
    e.preventDefault();
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length < 11) return alert('Digite um CPF válido');
    
    setIsLoading(true);
    try {
      const response = await fetch(apiUrl('/api/customer/info'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cpf: cleanCpf })
      });
      
      if (response.ok) {
        const customer = await response.json();
        setIsExistingUser(true);
        setName(customer?.customer_name || '');
        setEmail(customer?.customer_email || '');
        setPhone(customer?.customer_phone ? (isRedacted(customer.customer_phone) ? customer.customer_phone : maskPhone(customer.customer_phone)) : '');
      } else {
        setIsExistingUser(false);
        setName('');
        setEmail('');
        setPhone('');
      }
      localStorage.setItem('customer_cpf', cleanCpf);
      const hasOrder = await checkExistingOrderForCart(cartId, cleanCpf);
      if (!hasOrder) {
        setStep('userData');
      }
    } catch (error) {
      console.warn('Erro ao buscar cliente:', error);
      setIsExistingUser(false);
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

    // Format CPF with mask: xxx.xxx.xxx-xx
    const formattedCpf = cleanCpf.length === 11
      ? `${cleanCpf.slice(0,3)}.${cleanCpf.slice(3,6)}.${cleanCpf.slice(6,9)}-${cleanCpf.slice(9)}`
      : cpf;

    // Format total as decimal string: "10.00"
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
      const csrfToken = getCookie('csrftoken');
      const headers = {
        'Content-Type': 'application/json'
      };
      if (csrfToken) headers['X-CSRFTOKEN'] = csrfToken;

      const checkoutResponse = await fetch(apiUrl('/api/order/checkout'), {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (checkoutResponse.ok) {
        const orderData = await checkoutResponse.json();
        setOrder(orderData);
        localStorage.setItem(`order_by_cart_${cartId}`, JSON.stringify(orderData));
        localStorage.setItem('customer_cpf', cleanCpf);

        const activePix = await getPixDetails(orderData.id, orderData.pix_data);
        if (activePix) {
          setPixData(activePix);
          setStep('pix');
          startTimeRef.current = Date.now();
          clearCart();
        } else {
          alert('Erro ao gerar QR Code do Pix.');
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
        } catch (e) {
          try {
            const errText = await checkoutResponse.text();
            if (errText) errMsg = errText;
          } catch (textErr) {}
        }
        
        if (hasMissingDataErr) {
          setIsExistingUser(false);
          setName(prev => isRedacted(prev) ? '' : prev);
          setEmail(prev => isRedacted(prev) ? '' : prev);
          setPhone(prev => isRedacted(prev) || prev.replace(/\D/g, '').length < 11 ? '' : prev);
          alert('Por favor, verifique os seus dados de contato para prosseguir.');
        } else {
          alert(errMsg);
        }
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Falha na conexão com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  // Poll order status
  useEffect(() => {
    if (step === 'pix' && order?.id) {
      const checkStatus = async () => {
        // Stop polling after 10 minutes (600,000 ms)
        if (Date.now() - startTimeRef.current > 600000) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          return;
        }

        try {
          const res = await fetch(apiUrl(`/api/order/${order.id}`));
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'PAID') {
              setOrder(data);
              setOrderStatus('PAID');
              localStorage.setItem(`order_by_cart_${cartId}`, JSON.stringify(data));
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            }
          }
        } catch (err) {
          console.warn('Erro ao consultar status do pedido:', err);
        }
      };

      // Poll every 5 seconds
      pollIntervalRef.current = setInterval(checkStatus, 5000);

      return () => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      };
    }
  }, [step, order]);

  const handleEditCpf = () => {
    setStep('cpf');
    setIsExistingUser(false);
  };

  return (
    <div className="checkout-container">
      <header className="checkout-header">
        <button onClick={() => navigate(-1)} className="checkout-back-btn">
          <i className="fas fa-arrow-left text-xl"></i>
        </button>
        <img 
          src="https://ik.imagekit.io/yg7h35ptj/public/assets/company/topfotos-gree2_QNePwTu.png" 
          alt="Top Fotos" 
          className="checkout-header-logo" 
        />
        <div style={{ width: '40px' }}></div>
      </header>

      <main className="checkout-main">
        {/* Step Indicator */}
        {orderStatus !== 'PAID' && (
          <div className="checkout-steps">
            <div className={`checkout-step-dot ${step === 'cpf' || step === 'userData' || step === 'pix' ? 'active' : ''}`}></div>
            <div className={`checkout-step-line ${step === 'userData' || step === 'pix' ? 'active' : ''}`}></div>
            <div className={`checkout-step-dot ${step === 'userData' || step === 'pix' ? 'active' : ''}`}></div>
            <div className={`checkout-step-line ${step === 'pix' ? 'active' : ''}`}></div>
            <div className={`checkout-step-dot ${step === 'pix' ? 'active' : ''}`}></div>
          </div>
        )}

        {step === 'cpf' && (
          <div className="checkout-card">
            <h2 className="checkout-title">Identificação</h2>
            <p className="checkout-subtitle">Precisamos do seu CPF para iniciar a compra de {cartItems.length} itens.</p>
            
            <form onSubmit={handleCpfSubmit} className="checkout-form">
              <div className="checkout-form-group">
                <label className="checkout-label">CPF</label>
                <input 
                  type="text" 
                  value={cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  className="checkout-input"
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={isLoading || cpf.replace(/\D/g, '').length < 11}
                className="checkout-btn-primary mt-2"
              >
                {isLoading ? <i className="fas fa-spinner fa-spin"></i> : 'Continuar'}
              </button>
            </form>
          </div>
        )}

        {step === 'userData' && (
          <div className="checkout-section">
            <div className="checkout-card">
              <div className="checkout-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="checkout-title" style={{ margin: 0 }}>Seus Dados</h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {isExistingUser && (
                    <button 
                      onClick={() => {
                        setIsExistingUser(false);
                        setName(prev => isRedacted(prev) ? '' : prev);
                        setEmail(prev => isRedacted(prev) ? '' : prev);
                        setPhone(prev => isRedacted(prev) ? '' : prev);
                      }} 
                      className="checkout-change-link"
                      style={{ color: '#059669', marginRight: '4px' }}
                    >
                      Editar Dados
                    </button>
                  )}
                  <button 
                    onClick={handleEditCpf} 
                    className="checkout-change-link"
                  >
                    Alterar CPF
                  </button>
                </div>
              </div>

              {isExistingUser ? (
                <div className="checkout-existing-user-box">
                  <div className="checkout-info-row">
                    <i className="fas fa-user"></i>
                    <span className="font-medium">{name || 'Dados Cadastrados'}</span>
                  </div>
                  <div className="checkout-info-row">
                    <i className="fas fa-id-card"></i>
                    <span className="font-medium">{cpf}</span>
                  </div>
                  <div className="checkout-info-row">
                    <i className="fas fa-envelope"></i>
                    <span className="font-medium">{email || 'E-mail cadastrado'}</span>
                  </div>
                  <div className="checkout-info-row">
                    <i className="fab fa-whatsapp"></i>
                    <span className="font-medium">{phone || 'WhatsApp cadastrado'}</span>
                  </div>
                </div>
              ) : (
                <form id="checkout-form" onSubmit={handleFinalize} className="checkout-form">
                  <div className="checkout-form-group">
                    <label className="checkout-label">Nome Completo</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Insira seu nome completo"
                      className="checkout-input"
                      required
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
                    />
                  </div>
                  <div className="checkout-form-group">
                    <label className="checkout-label">WhatsApp (DDD + Número)</label>
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder="(00) 00000-0000"
                      className="checkout-input"
                      required
                    />
                  </div>
                </form>
              )}
            </div>

            <div className="checkout-card">
              <h2 className="checkout-title" style={{ marginBottom: '16px' }}>Pagamento via PIX</h2>
              <div className="checkout-pix-info">
                <i className="fab fa-pix"></i>
                <div>
                  <p className="checkout-pix-title">Rápido e Seguro</p>
                  <p className="checkout-pix-subtitle">Aprovação imediata do seu pedido.</p>
                </div>
              </div>
            </div>

            <div className="checkout-card checkout-summary-card">
              <div className="checkout-summary-row">
                <span>Subtotal ({cartItems.length} itens)</span>
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
                      <i className="fas fa-ticket-alt"></i> {appliedCoupon.name || (typeof appliedCoupon === 'string' ? appliedCoupon : 'Cupom Ativo')}
                    </span>
                    <button onClick={handleRemoveCoupon} className="coupon-remove-btn" type="button" disabled={isCouponLoading}>
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
                      onClick={handleApplyCoupon} 
                      disabled={isCouponLoading || !couponCode}
                      className="checkout-coupon-apply-btn"
                      type="button"
                    >
                      {isCouponLoading ? <i className="fas fa-spinner fa-spin"></i> : 'Aplicar'}
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
                onClick={isExistingUser ? handleFinalize : undefined}
                disabled={isLoading}
                className="checkout-btn-primary"
              >
                {isLoading ? <i className="fas fa-spinner fa-spin"></i> : (
                  <>
                    <i className="fab fa-pix"></i>
                    Finalizar via PIX
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'pix' && (
          <div className="checkout-success-card animate-slide-up">
            {orderStatus === 'PAID' ? (
              <>
                <div className="checkout-success-icon" style={{ backgroundColor: '#e6f4ed', color: '#10b981', boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)' }}>
                  <i className="fas fa-check"></i>
                </div>
                <h2 className="checkout-title" style={{ marginBottom: '8px' }}>Pagamento Confirmado!</h2>
                <p className="checkout-subtitle" style={{ marginBottom: '20px' }}>
                  Seu pagamento foi recebido com sucesso. O pedido <strong>{order?.order_number}</strong> já está liberado para download abaixo:
                </p>

                {order?.items?.length === 1 ? (
                  /* Single Item Centered Layout */
                  <div className="pedido-photos-single" style={{ width: '100%', maxWidth: '300px', margin: '0 auto 24px auto' }}>
                    <div className="foto-comprada-item" style={{ textAlign: 'left' }}>
                      <div className="foto-thumbnail-wrapper">
                        <img 
                          src={resolveUrl(order.items[0].photo?.delivery_path || order.items[0].photo?.watermark_path)} 
                          alt={order.items[0].description} 
                          className="foto-thumbnail" 
                        />
                        {order.items[0].photo?.is_video && (
                          <span className="media-video-badge-purchases">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                            VÍDEO
                          </span>
                        )}
                      </div>
                      <div className="foto-info">
                        <div className="photographer-tag">
                          {order.items[0].photo?.photographer_image && (
                            <img src={order.items[0].photo.photographer_image} alt="" className="photographer-avatar-sm" />
                          )}
                          <span>{order.items[0].photo?.photographer_name || 'Fotógrafo'}</span>
                        </div>
                        {order.items[0].photo?.delivery_path ? (
                          <a 
                            href={resolveUrl(order.items[0].photo.delivery_path)} 
                            download 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="foto-download-btn"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Baixar
                          </a>
                        ) : (
                          <span className="foto-preparing">Preparando imagem...</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Multiple Items Grid Layout */
                  <div className="pedido-photos-grid" style={{ width: '100%', marginBottom: '24px' }}>
                    {order?.items?.map((item, idx) => (
                      <div key={item.id} className="foto-comprada-item" style={{ textAlign: 'left' }}>
                        <div className="foto-thumbnail-wrapper">
                          <img 
                            src={resolveUrl(item.photo?.delivery_path || item.photo?.watermark_path)} 
                            alt={item.description} 
                            className="foto-thumbnail" 
                          />
                          {item.photo?.is_video && (
                            <span className="media-video-badge-purchases">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                              VÍDEO
                            </span>
                          )}
                        </div>
                        <div className="foto-info">
                          <div className="photographer-tag">
                            {item.photo?.photographer_image && (
                              <img src={item.photo.photographer_image} alt="" className="photographer-avatar-sm" />
                            )}
                            <span>{item.photo?.photographer_name || 'Fotógrafo'}</span>
                          </div>
                          {item.photo?.delivery_path ? (
                            <a 
                              href={resolveUrl(item.photo.delivery_path)} 
                              download 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="foto-download-btn"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Baixar
                            </a>
                          ) : (
                            <span className="foto-preparing">Preparando imagem...</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {order?.items?.length === 1 ? (
                  /* Single Item Bottom Button */
                  <div style={{ width: '100%', maxWidth: '280px', margin: '0 auto' }}>
                    <button 
                      onClick={() => navigate('/')}
                      className="checkout-btn-secondary"
                      style={{ width: '100%' }}
                    >
                      Voltar ao Início
                    </button>
                  </div>
                ) : (
                  /* Multiple Items Bottom Buttons */
                  <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '480px', margin: '0 auto' }}>
                    <button 
                      onClick={() => handleDownloadAll(order?.items || [], order?.order_number)}
                      className="checkout-btn-primary"
                      style={{ backgroundColor: '#28cc63', flex: 1, boxShadow: '0 4px 6px -1px rgba(40, 204, 99, 0.2)' }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Baixar Todas
                    </button>
                    <button 
                      onClick={() => navigate('/')}
                      className="checkout-btn-secondary"
                      style={{ flex: 1 }}
                    >
                      Voltar ao Início
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="checkout-success-icon" style={{ backgroundColor: '#fffbeb', color: '#f59e0b' }}>
                  <i className="fas fa-wallet animate-pulse"></i>
                </div>
                <h2 className="checkout-title" style={{ marginBottom: '8px' }}>Pedido Gerado!</h2>
                <p className="checkout-subtitle" style={{ marginBottom: '24px' }}>
                  Aguardando confirmação do PIX. O acesso às fotos será liberado automaticamente após o pagamento.
                </p>
                
                {pixData && (
                  <>
                    <div className="checkout-qrcode-wrapper">
                      {pixData.qrcode_data ? (
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(pixData.qrcode_data)}`} 
                          alt="QR Code Pix" 
                          className="checkout-qrcode-img" 
                        />
                      ) : pixData.qrcode_url ? (
                        <img 
                          src={resolveUrl(pixData.qrcode_url)} 
                          alt="QR Code Pix" 
                          className="checkout-qrcode-img" 
                        />
                      ) : null}
                    </div>

                    <div className="checkout-copy-box">
                      <p className="checkout-copy-label">Chave Pix (Copia e Cola)</p>
                      <p className="checkout-copy-code">{pixData.qrcode_data}</p>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(pixData.qrcode_data);
                          alert("Chave Pix copiada para a área de transferência!");
                        }}
                        className="checkout-copy-btn"
                        title="Copiar"
                      >
                        <i className="far fa-copy"></i>
                        <span>Copiar</span>
                      </button>
                    </div>
                  </>
                )}

                <button 
                  onClick={() => navigate('/')}
                  className="checkout-link-home"
                >
                  Voltar para a página inicial
                </button>
              </>
            )}
          </div>
        )}

      </main>
    </div>
  );
};

export default Checkout;
