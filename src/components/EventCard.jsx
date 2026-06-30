import React from 'react';
import { useNavigate } from 'react-router-dom';

const EventCard = ({ event }) => {
  const navigate = useNavigate();
  const {
    name,
    image,
    city,
    event_date,
    modality,
    owner,
    id
  } = event;

  const dateObj = new Date(event_date);
  const formattedDate = dateObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const handleClick = () => {
    navigate(`/evento/${id}`, { state: { event } });
  };

  return (
    <div className="event-card" onClick={handleClick} style={{ cursor: 'pointer' }}>
      <div className="card-image-container">
        <img src={image} alt={name} className="card-image" loading="lazy" />
      </div>

      <div className="card-content">
        <h3 className="card-title">{name}</h3>
        
        {owner && (
          <div className="card-owner">
            por <span>{owner.name}</span>
          </div>
        )}

        <div className="card-location">
          {city}
        </div>

        <div className="card-footer">
          <div className="event-meta">
            {formattedDate} &bull; {modality?.name || 'Evento'}
          </div>
          <svg className="arrow-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="7" y1="17" x2="17" y2="7"></line>
            <polyline points="7 7 17 7 17 17"></polyline>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
