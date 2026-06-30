import React from 'react';
import { useNavigate } from 'react-router-dom';

const EventCard = ({ event, size = 'normal' }) => {
  const navigate = useNavigate();
  const {
    name,
    image,
    city,
    event_date,
    modality,
    id
  } = event;

  const dateObj = new Date(event_date);
  const formattedDate = dateObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const handleClick = () => {
    navigate(`/evento/${id}`, { state: { event } });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={`ev-card ev-card--${size}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Evento: ${name}, ${formattedDate}, cidade ${city}`}
    >
      {/* Imagem de fundo full-bleed */}
      <div className="ev-card__bg">
        {image ? (
          <img src={image} alt="" className="ev-card__img" loading="lazy" />
        ) : (
          <div className="ev-card__img-placeholder">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
        )}
      </div>

      {/* Badge de modalidade */}
      {modality?.name && (
        <div className="ev-card__badge">{modality.name}</div>
      )}

      {/* Glass overlay inferior com informações */}
      <div className="ev-card__glass">
        <h3 className="ev-card__title">{name}</h3>
        <div className="ev-card__meta">
          {city && (
            <span className="ev-card__meta-item">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {city}
            </span>
          )}
          <span className="ev-card__meta-item">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {formattedDate}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
