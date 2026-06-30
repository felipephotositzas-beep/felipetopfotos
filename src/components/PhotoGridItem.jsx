import React from 'react';

/**
 * PhotoGridItem
 * Representa um item individual de foto/vídeo no grid da galeria.
 * Memorizado usando React.memo para evitar re-renderizações desnecessárias.
 */
const PhotoGridItem = React.memo(function PhotoGridItem({
  photo,
  index,
  inCart,
  onSelect,
  onAddToCart
}) {
  return (
    <div className="photo-item group">
      <div 
        onClick={() => onSelect(index)} 
        className="photo-wrapper"
        role="button"
        tabIndex={0}
        aria-label={`${photo.is_video ? 'Vídeo' : 'Foto'} de ${photo.photographer_name || 'Fotógrafo'}, referência #${photo.short_reference || photo.id}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(index);
          }
        }}
      >
        <img 
          src={photo.watermark_path} 
          alt={photo.is_video ? `Miniatura do vídeo #${photo.short_reference}` : `Miniatura da foto #${photo.short_reference}`}
          className="photo-img"
          loading="lazy"
        />
        {photo.is_video && (
          <div className="video-badge">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
        {/* Marcador do Fotógrafo */}
        {photo.photographer_name && (
          <div className="photo-photographer-overlay">
            {photo.photographer_image && (
              <img 
                src={photo.photographer_image} 
                alt="" 
                className="photo-photographer-avatar" 
              />
            )}
            <span className="photo-photographer-name">{photo.photographer_name}</span>
          </div>
        )}
      </div>

      {/* Botão de Adição Rápida ao Carrinho */}
      <div className="photo-cart-btn-container">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(photo);
          }}
          disabled={inCart}
          className={`photo-cart-btn ${inCart ? 'photo-cart-btn-active' : ''}`}
          aria-label={inCart ? "Item já adicionado ao carrinho" : "Adicionar item ao carrinho"}
        >
          {inCart ? (
            <i className="fas fa-check text-lg" aria-hidden="true"></i>
          ) : (
            <i className="fas fa-shopping-cart text-lg" aria-hidden="true"></i>
          )}
        </button>
      </div>
    </div>
  );
});

export default PhotoGridItem;
