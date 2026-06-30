/**
 * src/components/Skeleton.jsx
 * Componentes reutilizáveis de Skeleton Loading com shimmer animado.
 */
import React from 'react';

/**
 * Skeleton que imita o layout do EventCard.
 */
export function EventCardSkeleton() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton-image skeleton-shimmer"></div>
      <div className="skeleton-info">
        <div className="skeleton-line skeleton-line--title skeleton-shimmer"></div>
        <div className="skeleton-line skeleton-line--subtitle skeleton-shimmer"></div>
        <div className="skeleton-line skeleton-line--meta skeleton-shimmer"></div>
      </div>
    </div>
  );
}

/**
 * Skeleton que imita a galeria de fotos em grid (aspect-ratio 1:1).
 * @param {number} count - Número de itens para exibir
 */
export function PhotoGridSkeleton({ count = 6 }) {
  const items = Array.from({ length: count });
  return (
    <div className="skeleton-photo-grid" aria-hidden="true">
      {items.map((_, index) => (
        <div key={index} className="skeleton-photo-item skeleton-shimmer"></div>
      ))}
    </div>
  );
}
