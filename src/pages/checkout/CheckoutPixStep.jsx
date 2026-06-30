import React from 'react';

/**
 * CheckoutPixStep
 * Terceiro passo do Checkout: Exibição do Pix pendente (com QR code / Copia e Cola) ou confirmação de Pedido Pago.
 */
export default function CheckoutPixStep({
  orderStatus,
  order,
  pixData,
  resolveUrl,
  onDownloadAll,
  onNavigateHome,
  onCopyPix
}) {
  return (
    <div className="checkout-success-card animate-slide-up">
      {orderStatus === 'PAID' ? (
        <>
          <div className="checkout-success-icon" style={{ backgroundColor: '#e6f4ed', color: '#10b981', boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)' }}>
            <i className="fas fa-check" aria-hidden="true"></i>
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
                    alt={order.items[0].description || 'Item comprado'} 
                    className="foto-thumbnail" 
                  />
                  {order.items[0].photo?.is_video && (
                    <span className="media-video-badge-purchases">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
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
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
              {order?.items?.map((item) => (
                <div key={item.id} className="foto-comprada-item" style={{ textAlign: 'left' }}>
                  <div className="foto-thumbnail-wrapper">
                    <img 
                      src={resolveUrl(item.photo?.delivery_path || item.photo?.watermark_path)} 
                      alt={item.description || 'Item comprado'} 
                      className="foto-thumbnail" 
                    />
                    {item.photo?.is_video && (
                      <span className="media-video-badge-purchases">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
                onClick={onNavigateHome}
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
                onClick={() => onDownloadAll(order?.items || [], order?.order_number)}
                className="checkout-btn-primary"
                style={{ backgroundColor: '#28cc63', flex: 1, boxShadow: '0 4px 6px -1px rgba(40, 204, 99, 0.2)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Baixar Todas
              </button>
              <button 
                onClick={onNavigateHome}
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
            <i className="fas fa-wallet animate-pulse" aria-hidden="true"></i>
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
                  onClick={onCopyPix}
                  className="checkout-copy-btn"
                  title="Copiar"
                >
                  <i className="far fa-copy" aria-hidden="true"></i>
                  <span>Copiar</span>
                </button>
              </div>
            </>
          )}

          <button 
            onClick={onNavigateHome}
            className="checkout-link-home"
          >
            Voltar para a página inicial
          </button>
        </>
      )}
    </div>
  );
}
