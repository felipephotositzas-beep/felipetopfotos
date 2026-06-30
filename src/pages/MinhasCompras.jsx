import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { maskCpf } from '../utils/masks';
import { resolveUrl } from '../utils/urls';
import { SecureStorage } from '../utils/storage';
import { useToast } from '../components/Toast';
import { downloadAllPhotos } from '../utils/download';
import { logger } from '../utils/logger';
import { getCustomerOrders, getPixDetails, getOrderDetails } from '../services/checkoutService';


const MinhasCompras = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [searched, setSearched] = useState(false);
  const [activeTab, setActiveTab] = useState('paid'); // 'paid' | 'pending'

  // Pix details state
  const [viewingPixOrderId, setViewingPixOrderId] = useState(null);
  const [pixData, setPixData] = useState(null);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixError, setPixError] = useState(null);
  const [copiedOrderId, setCopiedOrderId] = useState(null);

  // Polling state for active Pix order
  const pollIntervalRef = useRef(null);
  const pollStartRef = useRef(null);

  // Load CPF from SecureStorage on mount
  useEffect(() => {
    const loadSavedCpf = async () => {
      const savedCpf = await SecureStorage.get('customer_cpf');
      if (savedCpf) {
        const masked = maskCpf(savedCpf);
        setCpf(masked);
        fetchOrders(savedCpf);
      }
    };
    loadSavedCpf();
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleCpfChange = (e) => {
    setCpf(maskCpf(e.target.value));
  };

  const fetchOrders = async (cleanCpf) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCustomerOrders(cleanCpf);
      const results = Array.isArray(data) ? data : (data.results || []);
      setOrders(results);
      setSearched(true);
      await SecureStorage.set('customer_cpf', cleanCpf);
    } catch (err) {
      logger.error(err);
      setError(err.message || 'Erro ao carregar compras. Verifique o CPF informado.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = cpf.replace(/\D/g, '');
    if (clean.length < 11) {
      toast.warning('Digite um CPF válido com 11 dígitos.');
      return;
    }
    fetchOrders(clean);
  };

  const handleLogout = async () => {
    await SecureStorage.remove('customer_cpf');
    setCpf('');
    setOrders([]);
    setSearched(false);
    setViewingPixOrderId(null);
    setPixData(null);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  // Fetch Pix details for pending order
  const handleViewPix = async (orderId) => {
    // If clicking again, toggle closed
    if (viewingPixOrderId === orderId) {
      setViewingPixOrderId(null);
      setPixData(null);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      return;
    }

    setViewingPixOrderId(orderId);
    setPixLoading(true);
    setPixError(null);
    setPixData(null);

    // Stop existing polling
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    try {
      const extractedPix = await getPixDetails(orderId);
      if (extractedPix) {
        setPixData(extractedPix);
        startPolling(orderId);
      } else {
        setPixError('Dados do Pix não encontrados.');
      }
    } catch (err) {
      setPixError(err.message || 'Erro de conexão.');
    } finally {
      setPixLoading(false);
    }
  };

  // Poll status of pending order
  const startPolling = (orderId) => {
    pollStartRef.current = Date.now();
    pollIntervalRef.current = setInterval(async () => {
      // Timeout after 5 minutes
      if (Date.now() - pollStartRef.current > 300000) {
        clearInterval(pollIntervalRef.current);
        return;
      }

      try {
        const data = await getOrderDetails(orderId);
        if (data.status === 'PAID') {
          clearInterval(pollIntervalRef.current);
          toast.success('Pagamento Pix confirmado com sucesso!');
          setViewingPixOrderId(null);
          setPixData(null);
          const clean = cpf.replace(/\D/g, '');
          fetchOrders(clean);
        }
      } catch (err) {
        logger.warn('Erro ao consultar status:', err);
      }
    }, 5000);
  };

  // Copy Pix key
  const handleCopyPix = (code, orderId) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedOrderId(orderId);
      setTimeout(() => setCopiedOrderId(null), 2000);
    }).catch(err => {
      logger.error('Erro ao copiar:', err);
      toast.error('Não foi possível copiar o código.');
    });
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

  // Separate orders
  const paidOrders = orders.filter(o => o.status === 'PAID');
  const pendingOrders = orders.filter(o => o.status !== 'PAID');

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="app-container compras-page">
      <header className="header" style={{ justifyContent: 'space-between' }}>
        <button className="back-btn" onClick={() => navigate('/')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="logo-felipe-photos" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>FELIPE<span>PHOTOS</span></div>
        {searched ? (
          <button className="compras-logout-btn" onClick={handleLogout} title="Sair / Buscar outro CPF">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        ) : (
          <div style={{ width: 24 }}></div>
        )}
      </header>

      <main className="compras-content">
        {!searched ? (
          <div className="compras-search-card">
            <div className="compras-search-header">
              <div className="compras-search-icon-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" className="compras-search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h2 className="compras-search-title">Minhas Compras</h2>
              <p className="compras-search-subtitle">Consulte e baixe fotos digitando seu CPF abaixo.</p>
            </div>

            <form onSubmit={handleSubmit} className="compras-form">
              <div className="compras-input-group">
                <label htmlFor="cpf" className="compras-label">CPF</label>
                <input
                  type="text"
                  id="cpf"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={handleCpfChange}
                  className="compras-input"
                  maxLength={14}
                  required
                />
              </div>

              {error && <div className="compras-error-message">{error}</div>}

              <button type="submit" className="compras-btn-search" disabled={loading}>
                {loading ? (
                  <span className="spinner-border"></span>
                ) : (
                  'Consultar Pedidos'
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="compras-results-container">
            <div className="compras-results-header">
              <h3>Meus Pedidos</h3>
              <p className="compras-results-subtitle">CPF: {cpf}</p>
            </div>

            <div className="compras-tabs">
              <button
                className={`compras-tab-btn ${activeTab === 'paid' ? 'compras-tab-btn-active' : ''}`}
                onClick={() => setActiveTab('paid')}
              >
                Pagas ({paidOrders.length})
              </button>
              <button
                className={`compras-tab-btn ${activeTab === 'pending' ? 'compras-tab-btn-active' : ''}`}
                onClick={() => setActiveTab('pending')}
              >
                Pendentes ({pendingOrders.length})
              </button>
            </div>

            <div className="compras-tab-content">
              {activeTab === 'paid' && (
                paidOrders.length === 0 ? (
                  <div className="compras-empty-state">
                    <p>Nenhum pedido pago encontrado.</p>
                  </div>
                ) : (
                  paidOrders.map(order => (
                    <div key={order.id} className="pedido-card">
                      <div className="pedido-header">
                        <div className="pedido-meta-left">
                          <span className="pedido-number">Pedido {order.order_number}</span>
                          <span className="pedido-date">{formatDate(order.created_at)}</span>
                        </div>
                        <div className="pedido-meta-right">
                          <span className="pedido-total">R$ {order.total_value}</span>
                          <button
                            className="btn-download-all"
                            onClick={() => handleDownloadAll(order.items, order.order_number)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Baixar Todas
                          </button>
                        </div>
                      </div>

                      <div className="pedido-photos-grid">
                        {order.items.map(item => (
                          <div key={item.id} className="foto-comprada-item">
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
                    </div>
                  ))
                )
              )}

              {activeTab === 'pending' && (
                pendingOrders.length === 0 ? (
                  <div className="compras-empty-state">
                    <p>Nenhum pedido pendente encontrado.</p>
                  </div>
                ) : (
                  pendingOrders.map(order => (
                    <div key={order.id} className="pedido-card">
                      <div className="pedido-header">
                        <div className="pedido-meta-left">
                          <span className="pedido-number">Pedido {order.order_number}</span>
                          <span className="pedido-date">{formatDate(order.created_at)}</span>
                        </div>
                        <div className="pedido-meta-right">
                          <span className="pedido-total">R$ {order.total_value}</span>
                          <button
                            className={`btn-ver-pix ${viewingPixOrderId === order.id ? 'btn-ver-pix-active' : ''}`}
                            onClick={() => handleViewPix(order.id)}
                          >
                            {viewingPixOrderId === order.id ? 'Fechar Pix' : 'Ver Pix'}
                          </button>
                        </div>
                      </div>

                      {viewingPixOrderId === order.id && (
                        <div className="pedido-pix-details-panel">
                          {pixLoading && (
                            <div className="pix-loading-wrapper">
                              <span className="spinner-border"></span>
                              <p>Carregando dados de pagamento...</p>
                            </div>
                          )}

                          {pixError && (
                            <div className="pix-error-wrapper">
                              <p>{pixError}</p>
                              <button onClick={() => handleViewPix(order.id)} className="btn-retry-pix">
                                Tentar novamente
                              </button>
                            </div>
                          )}

                          {pixData && (
                            <div className="pix-details-layout">
                              <div className="pix-qr-section">
                                <img
                                  src={resolveUrl(pixData.qrcode_url)}
                                  alt="QR Code Pix"
                                  className="pix-qr-img"
                                />
                                <div className="pix-alert-banner">
                                  <span className="pix-radar-pulse"></span>
                                  Aguardando confirmação de pagamento...
                                </div>
                              </div>
                              <div className="pix-info-section">
                                <p className="pix-instruction-title">Como pagar com Pix?</p>
                                <ol className="pix-instructions-list">
                                  <li>Abra o app do seu banco ou carteira digital.</li>
                                  <li>Selecione a opção de pagar com **Pix Copia e Cola** ou escaneie o **QR Code**.</li>
                                  <li>Cole o código abaixo e confirme as informações do pagamento.</li>
                                </ol>

                                <div className="pix-code-container">
                                  <textarea
                                    readOnly
                                    value={pixData.qrcode_data}
                                    className="pix-code-textarea"
                                    onClick={(e) => e.target.select()}
                                  />
                                  <button
                                    className={`pix-copy-action-btn ${copiedOrderId === order.id ? 'copied' : ''}`}
                                    onClick={() => handleCopyPix(pixData.qrcode_data, order.id)}
                                  >
                                    {copiedOrderId === order.id ? (
                                      <>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                        Copiado!
                                      </>
                                    ) : (
                                      <>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m-2 4h5m-3-3l3 3m0 0l-3 3" />
                                        </svg>
                                        Copiar Código Pix
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="pedido-items-summary">
                        <span className="items-summary-label">Itens do pedido:</span>
                        <div className="items-summary-list">
                          {order.items.map(item => (
                            <div key={item.id} className="item-summary-line">
                              • {item.description}
                              {item.photo?.is_video && <span className="media-video-badge-inline">VÍDEO</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MinhasCompras;
