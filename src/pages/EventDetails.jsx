import React, { useState, useEffect } from 'react';
import { apiUrl } from '../config/api';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import CameraCapture from '../components/CameraCapture';
import MediaViewer from '../components/MediaViewer';
import CartFloatingBar from '../components/CartFloatingBar';
import CartModal from '../components/CartModal';
import { useCart } from '../context/CartContext';
import { mockEventsData } from '../data/mockEvents';

const formatPhone = (phoneStr) => {
  if (!phoneStr) return '';
  const clean = phoneStr.replace(/\D/g, '');
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  }
  if (clean.length === 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  }
  return phoneStr;
};

const EVENTS_WITH_PROGRESSIVE_DISCOUNT = [
  '4392c0ac-30b2-456e-ab21-71fe11a7ac21', // ALPHA RUN 2026 ID
  'alpha-run-2026-metasport'              // ALPHA RUN 2026 Slug
];

const EventDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [eventData, setEventData] = useState(location.state?.event);

  const hasProgressiveDiscount = 
    eventData?.has_progressive_discount || 
    EVENTS_WITH_PROGRESSIVE_DISCOUNT.includes(id) || 
    EVENTS_WITH_PROGRESSIVE_DISCOUNT.includes(eventData?.slug);


  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalPhotos, setTotalPhotos] = useState(0);
  
  // Cart & Filters
  const { addToCart, isInCart, initializeCartForEvent } = useCart();
  const [mediaFilter, setMediaFilter] = useState('all');
  
  // States for Facial Recognition
  const [isSearchingFace, setIsSearchingFace] = useState(false);
  const [isFaceSearchActive, setIsFaceSearchActive] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(null);
  const fileInputRef = React.useRef(null);
  const cameraInputRef = React.useRef(null);

  useEffect(() => {
    if (id) {
      initializeCartForEvent(id);
    }
    loadPhotos(1);
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    if (!eventData && id) {
      const fetchEventData = async () => {
        try {
          const response = await fetch(apiUrl('/api/pages/events/list'));
          if (response.ok) {
            const data = await response.json();
            const found = data.results?.find(e => e.id === id);
            if (found) {
              setEventData(found);
            } else {
              const mockFound = mockEventsData.results.find(e => e.id === id);
              if (mockFound) {
                setEventData(mockFound);
              }
            }
          }
        } catch (error) {
          console.warn('Erro ao buscar detalhes do evento:', error);
          const mockFound = mockEventsData.results.find(e => e.id === id);
          if (mockFound) {
            setEventData(mockFound);
          }
        }
      };
      fetchEventData();
    }
  }, [id, eventData]);

  const loadPhotos = async (pageNumber = 1) => {
    if (pageNumber === 1) {
      setLoading(true);
      setIsFaceSearchActive(false);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await fetch(apiUrl(`/api/photo/list/${id}?page=${pageNumber}`));
      
      if (response.ok) {
        const data = await response.json();
        const newPhotos = data.results || [];
        
        // Sempre substituir as fotos para ter paginação real
        setPhotos(newPhotos);
        if (pageNumber === 1) {
          setTotalPhotos(data.count || 0);
        }
        
        setHasMore(pageNumber < data.num_pages);
        setPage(pageNumber);
      }
    } catch (error) {
      console.warn('Erro ao carregar fotos:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      // Rolar para o topo da galeria ao mudar de página
      if (pageNumber !== 1 && !isFaceSearchActive) {
        window.scrollTo({ top: 300, behavior: 'smooth' });
      }
    }
  };

  const processFaceSearch = async (dataUrl) => {
    setIsSearchingFace(true);
    try {
      const formData = new FormData();
      // O backend espera a string em base64 (data:image/...) diretamente no form-data, e não um binário
      formData.append('photo', dataUrl);

      const response = await fetch(apiUrl(`/api/photo/search-by-photo/${id}`), {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        const results = Array.isArray(data) ? data : (data.results || []);
        setPhotos(results);
        setIsFaceSearchActive(true);
        setHasMore(false); // Disable pagination for search results
      } else {
        alert('Erro ao buscar fotos por reconhecimento facial.');
      }
    } catch (error) {
      console.error('Face search error:', error);
      alert('Falha na conexão com o servidor.');
    } finally {
      setIsSearchingFace(false);
      setIsCameraOpen(false); // Garante que a câmera seja fechada
    }
  };

  const handleFaceSearchFromFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Reset file inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';

    const reader = new FileReader();
    reader.onload = (e) => {
      processFaceSearch(e.target.result);
    };
    reader.onerror = () => {
      alert('Erro ao ler a imagem.');
    };
    reader.readAsDataURL(file);
  };

  const handleCapturedImage = (dataUrl) => {
    processFaceSearch(dataUrl);
  };

  const clearFaceSearch = () => {
    loadPhotos(1);
  };

  const handleShare = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent('Olha esse evento Top!');
    const whatsappUrl = `https://wa.me/?text=${text} ${url}`;
    window.open(whatsappUrl, '_blank');
  };

  // Format date if available
  const dateObj = eventData?.event_date ? new Date(eventData.event_date) : null;
  const formattedDate = dateObj ? dateObj.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';

  return (
    <div className="app-container event-details-page">
      {isCameraOpen && (
        <CameraCapture 
          onCapture={handleCapturedImage} 
          onClose={() => setIsCameraOpen(false)} 
        />
      )}
      <header className="header" style={{ justifyContent: 'space-between' }}>
        <button className="back-btn" onClick={() => navigate('/')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <img src="/logo.png" alt="Top Fotos" className="logo-img" style={{ cursor: 'pointer' }} onClick={() => navigate('/')} />
        <button className="header-compras-btn-icon" onClick={() => navigate('/minhas-compras')} title="Minhas Compras">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </button>
      </header>
      <div className="event-header">
        <div className="event-header-content">
          <div className="event-details-left">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
              <h1 className="event-details-title" style={{ margin: 0, lineHeight: 1.2 }}>
                {eventData ? eventData.name : 'Carregando evento...'}
              </h1>
              <button className="share-btn-modern" onClick={handleShare} title="Compartilhar">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>

            <div className="event-badges" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
              {totalPhotos > 0 && (
                <span className="badge">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {totalPhotos} fotos
                </span>
              )}
              {formattedDate && (
                <span className="badge capitalize-first">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="4" width="16" height="14" rx="2" ry="2" />
                    <line x1="2" y1="8" x2="18" y2="8" />
                    <line x1="6" y1="2" x2="6" y2="6" />
                    <line x1="14" y1="2" x2="14" y2="6" />
                  </svg>
                  {formattedDate}
                </span>
              )}
              {eventData?.city && (
                <span className="badge">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="1.5">
                    <path d="M10 2C6.686 2 4 4.686 4 8C4 12.5 10 18 10 18C10 18 16 12.5 16 8C16 4.686 13.314 2 10 2Z" />
                    <circle cx="10" cy="8" r="2" fill="currentColor" />
                  </svg>
                  {eventData.city}
                </span>
              )}
            </div>
          </div>

          {eventData?.owner && (
            <div className="event-organizer-box">
              {eventData.owner.image && (
                <img 
                  src={eventData.owner.image} 
                  alt={eventData.owner.name} 
                  className="event-organizer-avatar" 
                />
              )}
              <div className="event-organizer-info">
                <span className="event-organizer-name">{eventData.owner.name}</span>
                {eventData.owner.email && (
                  <span className="event-organizer-email">{eventData.owner.email}</span>
                )}
                {eventData.owner.phone && (
                  <a 
                    href={`https://wa.me/55${eventData.owner.phone.replace(/\D/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="event-organizer-phone"
                  >
                    {formatPhone(eventData.owner.phone)}
                    <i className="fab fa-whatsapp whatsapp-color-icon"></i>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Face Search Section */}
        <div className="face-search-card">
          <div className="face-search-header">
            <div>
              <h3 className="face-search-title">Reconhecimento Facial</h3>
              <p className="face-search-subtitle">Encontre suas fotos instantaneamente.</p>
            </div>
            <div className="face-search-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8V6a2 2 0 012-2h2M3 16v2a2 2 0 002 2h2M21 8V6a2 2 0 00-2-2h-2M21 16v2a2 2 0 01-2 2h-2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9a3 3 0 116 0 3 3 0 01-6 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 15c-1.667-1-4.333-1-6 0" />
              </svg>
            </div>
          </div>
          
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleFaceSearchFromFile} 
            style={{ display: 'none' }} 
          />

          <input 
            type="file" 
            accept="image/*" 
            capture="user"
            ref={cameraInputRef} 
            onChange={handleFaceSearchFromFile} 
            style={{ display: 'none' }} 
          />
          
          <div className="face-search-actions">
            {isFaceSearchActive ? (
              <button onClick={clearFaceSearch} className="btn-action btn-clear-search">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Limpar Busca
              </button>
            ) : (
              <>
                <button 
                  className="btn-action btn-primary" 
                  onClick={() => setIsCameraOpen(true)}
                  disabled={isSearchingFace}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {isSearchingFace ? 'Analisando...' : 'Tirar Selfie'}
                </button>
                <button 
                  className="btn-action btn-secondary" 
                  onClick={() => fileInputRef.current.click()}
                  disabled={isSearchingFace}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Galeria
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <main className="gallery-section">
        {/* Progressive Discount Banner */}
        {!loading && !isFaceSearchActive && hasProgressiveDiscount && (
          <div className="progressive-discount-banner">
            <div className="discount-info-block">
              <h2 className="desconto-progressivo-title">Desconto Progressivo</h2>
              <p className="desconto-progressivo-subtitle">O desconto será adicionado automaticamente no carrinho.</p>
            </div>
            <div className="discount-tiers-grid">
              <div className="discount-tier-card">
                <h1 className="discount-tier-value">5<span className="discount-tier-pct">%</span></h1>
                <p className="discount-tier-text">ao comprar 3 ou mais fotos</p>
              </div>
              <div className="discount-tier-card">
                <h1 className="discount-tier-value">10<span className="discount-tier-pct">%</span></h1>
                <p className="discount-tier-text">ao comprar 5 ou mais fotos</p>
              </div>
              <div className="discount-tier-card">
                <h1 className="discount-tier-value">15<span className="discount-tier-pct">%</span></h1>
                <p className="discount-tier-text">ao comprar 8 ou mais fotos</p>
              </div>
            </div>
          </div>
        )}

        {/* Media Filter Tabs - New Design */}
        {!loading && !isFaceSearchActive && totalPhotos > 0 && (
          <div className="media-filter-container">
            {/* Fotos Button */}
            <button 
              onClick={() => setMediaFilter('photo')}
              className={`media-filter-card ${mediaFilter === 'photo' || mediaFilter === 'all' ? 'media-filter-card-active' : ''}`}
            >
              <div className="media-filter-info-wrapper">
                <div className="media-filter-icon">
                  <i className="fas fa-camera"></i>
                </div>
                <span className="media-filter-label">Ver fotos</span>
              </div>
              <div className="media-filter-badge">
                {photos.filter(p => !p.is_video).length || totalPhotos}
              </div>
            </button>

            {/* Vídeos Button */}
            <button 
              onClick={() => setMediaFilter('video')}
              className={`media-filter-card ${mediaFilter === 'video' ? 'media-filter-card-active' : ''}`}
            >
              <div className="media-filter-info-wrapper">
                <div className="media-filter-icon">
                  <i className="fas fa-video"></i>
                </div>
                <span className="media-filter-label">Ver vídeos</span>
              </div>
              <div className="media-filter-badge">
                {photos.filter(p => p.is_video).length}
              </div>
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading-state">Buscando fotos...</div>
        ) : photos.length === 0 ? (
          <div className="empty-state">Nenhuma foto encontrada.</div>
        ) : (
          <>
            <div className="photos-grid">
              {photos.filter(p => mediaFilter === 'all' ? true : (mediaFilter === 'photo' ? !p.is_video : p.is_video)).map((photo, index) => (
                <div 
                  key={photo.id} 
                  className="photo-item group" 
                >
                  <div onClick={() => setSelectedMediaIndex(index)} className="photo-wrapper">
                    <img 
                      src={photo.watermark_path} 
                      alt={photo.index} 
                      className="photo-img"
                      loading="lazy"
                    />
                    {photo.is_video && (
                      <div className="video-badge">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    )}
                    {/* Photographer Overlay */}
                    {photo.photographer_name && (
                      <div className="photo-photographer-overlay">
                        {photo.photographer_image && (
                          <img 
                            src={photo.photographer_image} 
                            alt={photo.photographer_name} 
                            className="photo-photographer-avatar" 
                          />
                        )}
                        <span className="photo-photographer-name">{photo.photographer_name}</span>
                      </div>
                    )}
                  </div>
                  {/* Add to Cart Overlay - Always visible on mobile */}
                  <div className="photo-cart-btn-container">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart({ ...photo, url: photo.watermark_path });
                      }}
                      disabled={isInCart(photo.id)}
                      className={`photo-cart-btn ${isInCart(photo.id) ? 'photo-cart-btn-active' : ''}`}
                    >
                      {isInCart(photo.id) ? (
                        <i className="fas fa-check text-lg"></i>
                      ) : (
                        <i className="fas fa-shopping-cart text-lg"></i>
                      )}
                    </button>
                  </div>
                </div>

              ))}
            </div>
            
            {/* Pagination Controls */}
            {!isFaceSearchActive && (
              <div className="pagination-controls">
                <button 
                  className="btn-pagination" 
                  onClick={() => loadPhotos(page - 1)}
                  disabled={page === 1 || loadingMore}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Anterior
                </button>
                
                <span className="page-indicator">Página {page}</span>
                
                <button 
                  className="btn-pagination" 
                  onClick={() => loadPhotos(page + 1)}
                  disabled={!hasMore || loadingMore}
                >
                  Próxima
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {selectedMediaIndex !== null && (
        <MediaViewer 
          photos={photos.filter(p => mediaFilter === 'all' ? true : (mediaFilter === 'photo' ? !p.is_video : p.is_video))} 
          currentIndex={selectedMediaIndex} 
          onNavigate={(index) => setSelectedMediaIndex(index)}
          onClose={() => setSelectedMediaIndex(null)} 
        />
      )}

      <CartFloatingBar />
      <CartModal />
    </div>
  );
};

export default EventDetails;
