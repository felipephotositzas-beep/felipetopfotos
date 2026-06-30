import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useCart } from '../context/CartContext';
import { Capacitor } from '@capacitor/core';
import { PrivacyScreen } from '@capacitor-community/privacy-screen';

/**
 * MediaViewer — Visualizador seguro de fotos/vídeos com proteção DRM:
 *  - Bloqueia menu de contexto (botão direito / long-press mobile)
 *  - Bloqueia arrastar imagem
 *  - Bloqueia touch callout (iOS "Salvar Imagem")
 *  - Remove botão "download" do vídeo (controlsList="nodownload")
 *  - Detecta print/screenshot (blur/visibilitychange) e esconde o conteúdo
 *  - CSS anti-print via @media print (no index.css)
 *  - Vídeo: usa JavaScript customizado em vez de <controls> nativo (evita menu "Baixar")
 */
const MediaViewer = ({ photos, currentIndex, onClose, onNavigate }) => {
  const [currentMedia, setCurrentMedia] = useState(photos[currentIndex]);
  const { addToCart, removeFromCart, isInCart } = useCart();
  const [screenshotBlocked, setScreenshotBlocked] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoRef = useRef(null);
  const blockTimerRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Toggle PrivacyScreen for Android Video playback (FLAG_SECURE blocks video rendering)
  useEffect(() => {
    if (Capacitor.isNativePlatform() && currentMedia?.is_video) {
      PrivacyScreen.disable().catch(console.error);
    } else if (Capacitor.isNativePlatform()) {
      PrivacyScreen.enable().catch(console.error);
    }
    
    return () => {
      if (Capacitor.isNativePlatform()) {
        PrivacyScreen.enable().catch(console.error);
      }
    };
  }, [currentMedia]);

  useEffect(() => {
    setCurrentMedia(photos[currentIndex]);
    setVideoPlaying(false);
    setVideoProgress(0);
  }, [currentIndex, photos]);

  const triggerScreenshotBlock = useCallback(() => {
    setScreenshotBlocked(true);
    clearTimeout(blockTimerRef.current);
    blockTimerRef.current = setTimeout(() => {
      setScreenshotBlocked(false);
    }, 2000);
  }, []);

  // ── Teclado ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && currentIndex < photos.length - 1) onNavigate(currentIndex + 1);
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1);
      // Bloquear teclas de screenshot comuns
      if ((e.metaKey || e.ctrlKey) && (e.key === 's' || e.key === 'p' || e.key === 'S' || e.key === 'P')) {
        e.preventDefault();
      }
      // Windows Snipping Tool / PrintScreen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        triggerScreenshotBlock();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, photos.length, onClose, onNavigate]);

  // ── Detectar Screenshot / Print via visibilitychange ─────────────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Quando o app vai para segundo plano (iOS screenshot, Android recents)
      if (document.hidden) {
        triggerScreenshotBlock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [triggerScreenshotBlock]);

  // ── Bloquear menu de contexto global enquanto viewer estiver aberto ───────
  useEffect(() => {
    const block = (e) => e.preventDefault();
    document.addEventListener('contextmenu', block);
    // iOS: bloqueia seleção de texto
    document.body.style.webkitUserSelect = 'none';
    document.body.style.userSelect = 'none';
    return () => {
      document.removeEventListener('contextmenu', block);
      document.body.style.webkitUserSelect = '';
      document.body.style.userSelect = '';
    };
  }, []);

  // ── Controles de vídeo customizados ──────────────────────────────────────
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setVideoPlaying(true);
    } else {
      videoRef.current.pause();
      setVideoPlaying(false);
    }
  };

  const handleVideoProgress = () => {
    if (!videoRef.current) return;
    const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setVideoProgress(isNaN(pct) ? 0 : pct);
  };

  const handleSeek = (e) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    videoRef.current.currentTime = ratio * videoRef.current.duration;
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].screenX;
    if (e.touches.length > 1 && e.cancelable) {
      e.preventDefault(); // pinch zoom block
    }
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e) => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50 && currentIndex < photos.length - 1) {
      onNavigate(currentIndex + 1); // Swipe left
    } else if (diff < -50 && currentIndex > 0) {
      onNavigate(currentIndex - 1); // Swipe right
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  if (!currentMedia) return null;

  const isVideo = currentMedia.is_video;
  const videoUrl = currentMedia.preview_video_path || currentMedia.delivery_path;
  const inCart = isInCart(currentMedia.id);

  return (
    <div
      className="media-viewer-overlay"
      onClick={onClose}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* ── Tela de bloqueio de screenshot ─────────────────────────────── */}
      {screenshotBlocked && (
        <div className="screenshot-block-overlay">
          <div className="screenshot-block-content">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <p>📸 Captura de tela bloqueada</p>
            <span>Adquira a foto para ter acesso completo</span>
          </div>
        </div>
      )}

      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <div className="media-viewer-toolbar" onClick={(e) => e.stopPropagation()}>
        <div className="media-viewer-info">
          <span className="media-badge">{isVideo ? 'Vídeo' : 'Foto'}</span>
          <span className="media-ref">#{currentMedia.short_reference}</span>
          <span className="media-drm-badge">🔒 Protegido</span>
        </div>
        <button className="media-close-btn" onClick={onClose}>
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ── Conteúdo principal ─────────────────────────────────────────── */}
      <div className="media-viewer-content" onClick={(e) => e.stopPropagation()}>
        {currentIndex > 0 && (
          <button className="nav-btn prev-btn" onClick={() => onNavigate(currentIndex - 1)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* ── Media container com proteções ──────────────────────────── */}
        <div
          className="media-container no-select"
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Camada transparente de bloqueio acima da mídia */}
          <div className="media-protect-layer" onContextMenu={(e) => e.preventDefault()} />

          {isVideo ? (
            <>
              {/* Vídeo SEM <controls> nativos para evitar menu "Baixar" */}
              <video
                ref={videoRef}
                key={`video-${currentMedia.id}`}
                src={videoUrl}
                poster={currentMedia.watermark_path}
                playsInline
                webkit-playsinline="true"
                x5-playsinline="true"
                preload="metadata"
                controlsList="nodownload nofullscreen noremoteplayback"
                disablePictureInPicture
                className="media-video-player"
                onContextMenu={(e) => e.preventDefault()}
                onTimeUpdate={handleVideoProgress}
                onPlay={() => setVideoPlaying(true)}
                onPause={() => setVideoPlaying(false)}
                /* Sem controls — usamos controles próprios abaixo */
              />
              {/* Controles customizados de vídeo */}
              <div className="custom-video-controls" onClick={(e) => e.stopPropagation()}>
                <button className="video-play-btn" onClick={togglePlay}>
                  {videoPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </button>
                <div className="video-progress-bar" onClick={handleSeek}>
                  <div className="video-progress-fill" style={{ width: `${videoProgress}%` }} />
                </div>
              </div>
            </>
          ) : (
            <img
              key={`img-${currentMedia.id}`}
              src={currentMedia.watermark_path}
              alt={`Foto ${currentMedia.short_reference}`}
              className="media-image no-select"
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              draggable={false}
            />
          )}

          {/* Overlay de marca d'água */}
          <div className="viewer-watermark-overlay watermark-pattern" />
          
          {/* Faixa diagonal "PRÉVIA - ADQUIRA PARA VER ORIGINAL" */}
          <div className="media-preview-badge">
            PRÉVIA — Adquira para a foto original sem marca d'água
          </div>
        </div>

        {currentIndex < photos.length - 1 && (
          <button className="nav-btn next-btn" onClick={() => onNavigate(currentIndex + 1)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* ── Botão de compra ─────────────────────────────────────────── */}
        <div className="viewer-cart-btn-container">
          <button
            onClick={() => {
              if (inCart) {
                removeFromCart(currentMedia.id);
              } else {
                addToCart({ ...currentMedia, url: currentMedia.watermark_path });
              }
            }}
            className={`viewer-cart-btn ${inCart ? 'viewer-cart-btn-in-cart' : 'viewer-cart-btn-buy'}`}
          >
            {inCart ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>No Carrinho</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>
                  {isVideo ? 'Comprar Vídeo' : 'Comprar Foto'}{' '}
                  (R$ {currentMedia.price ? String(currentMedia.price).replace('.', ',') : '11,90'})
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaViewer;
