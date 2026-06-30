import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import EventCard from '../components/EventCard';
import { apiUrl } from '../config/api';
import { logger } from '../utils/logger';

// Categorias de modalidade esportiva para filtro rápido
const SPORT_FILTERS = [
  { id: '', label: 'Todos', icon: '⚡' },
  { id: 'corrida', label: 'Corrida', icon: '🏃' },
  { id: 'ciclismo', label: 'Ciclismo', icon: '🚴' },
  { id: 'natacao', label: 'Natação', icon: '🏊' },
  { id: 'triathlon', label: 'Triathlon', icon: '🏅' },
  { id: 'futebol', label: 'Futebol', icon: '⚽' },
];

// Mock data: carregado somente em desenvolvimento
const getMockData = async () => {
  if (import.meta.env.DEV) {
    const { mockEventsData, mockModalitiesData } = await import('../data/mockEvents');
    return { mockEventsData, mockModalitiesData };
  }
  return { mockEventsData: { results: [], count: 0, next: null }, mockModalitiesData: { results: [] } };
};

function Home() {
  const [events, setEvents] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [selectedModality, setSelectedModality] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchRef = useRef(null);

  const loadStates = async () => {
    try {
      const response = await fetch(apiUrl('/api/panel/events/states'));
      if (response.ok) {
        const data = await response.json();
        setStates(data || []);
      }
    } catch (error) {
      logger.warn('Falha ao carregar estados', error);
    }
  };

  const loadEvents = async (pageNumber = 1) => {
    if (pageNumber === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams();
      if (searchName) params.append('name', searchName);
      if (selectedModality) params.append('modality', selectedModality);
      params.append('state', selectedState ? selectedState : 'all');
      params.append('photographer', '4b59febb-2dd3-4002-987f-ad8da0840dbd');
      params.append('page', pageNumber.toString());

      const response = await fetch(apiUrl(`/api/pages/events/list?${params.toString()}`));

      if (response.ok) {
        const data = await response.json();
        const newEvents = data.results || [];

        if (pageNumber === 1) {
          setEvents(newEvents);
        } else {
          setEvents(prev => [...prev, ...newEvents]);
        }

        setHasMore(!!data.next);
        setPage(pageNumber);
      } else {
        throw new Error('Falha na API, usando mock local');
      }
    } catch (error) {
      logger.warn('Usando dados simulados porque a API real falhou:', error);
      const { mockEventsData } = await getMockData();
      const removeAccents = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const filtered = mockEventsData.results.filter(event => {
        const safeSearchName = removeAccents(searchName.toLowerCase().trim());
        const safeEventName = removeAccents(event.name.toLowerCase());
        const matchName = safeSearchName === '' || safeEventName.includes(safeSearchName);
        const matchModality = selectedModality === '' || (event.modality && (event.modality.id === selectedModality || event.modality.slug === selectedModality));
        const matchPhotographer = event.owner && event.owner.id === '4b59febb-2dd3-4002-987f-ad8da0840dbd';
        return matchName && matchModality && matchPhotographer;
      });
      setEvents(filtered);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadStates();
  }, []);

  useEffect(() => {
    loadEvents(1);
    // eslint-disable-next-line
  }, [selectedModality]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadEvents(1);
    setSearchExpanded(false);
  };

  const handleClear = () => {
    setSearchName('');
    setSelectedModality('');
    setSelectedState('');
    setActiveFilter('');
    setTimeout(() => {
      loadEvents(1);
    }, 100);
  };

  const handleFilterClick = (filterId) => {
    setActiveFilter(filterId);
    setSelectedModality(filterId);
  };

  // Skeleton grid
  const renderSkeletonMasonry = () => (
    <div className="home-masonry">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="home-masonry__skeleton" />
      ))}
    </div>
  );

  return (
    <div className="home-root">

      {/* ───── TOPBAR ───── */}
      <header className="home-topbar">
        <div className="home-topbar__logo">
          FELIPE<span>PHOTOS</span>
        </div>
        <div className="home-topbar__actions">
          <button
            className="home-topbar__icon-btn"
            aria-label="Buscar evento"
            onClick={() => { setSearchExpanded(v => !v); setTimeout(() => searchRef.current?.focus(), 50); }}
            id="btn-toggle-search"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
          <Link to="/minhas-compras" className="home-topbar__icon-btn" aria-label="Minhas Compras" id="link-purchases">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </Link>
        </div>
      </header>

      {/* ───── PARCEIRO OFICIAL ───── */}
      <div className="home-partner">
        <span className="home-partner__label">Parceiro Oficial</span>
        <img src="/topfotos-logo.png" alt="TOP FOTOS Logo" className="home-partner__logo" />
      </div>

      {/* ───── SEARCH OVERLAY ───── */}
      <div className={`home-search-overlay ${searchExpanded ? 'home-search-overlay--open' : ''}`}>
        <form className="home-search-form" onSubmit={handleSearch}>
          <div className="home-search-input-wrap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              ref={searchRef}
              type="text"
              className="home-search-input"
              placeholder="Buscar evento..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              id="input-search-event"
            />
            {searchName && (
              <button type="button" className="home-search-clear" onClick={() => setSearchName('')} aria-label="Limpar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
          <div className="home-search-row">
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="home-search-select"
              id="select-state"
            >
              <option value="">Todos os estados</option>
              {states.map(state => (
                <option key={state.id} value={state.id}>{state.name}</option>
              ))}
            </select>
            <button type="submit" className="home-search-submit" id="btn-search-submit">Buscar</button>
          </div>
          {(searchName || selectedState || selectedModality) && (
            <button type="button" className="home-search-reset-all" onClick={handleClear} id="btn-clear-all">
              Limpar todos os filtros
            </button>
          )}
        </form>
      </div>

      {/* ───── HERO BANNER ───── */}
      <section className="home-hero" aria-label="Cabeçalho da galeria">
        <div className="home-hero__bg">
          {/* Gradient overlay para garantir leitura do texto */}
          <div className="home-hero__overlay" />
        </div>
        <div className="home-hero__content">
          <span className="home-hero__eyebrow">Fotografia Esportiva</span>
          <h1 className="home-hero__title">Minhas<br/>Coberturas</h1>
          <p className="home-hero__sub">Encontre suas melhores fotos nos eventos que você viveu.</p>
        </div>
        {/* Ondinha decorativa na base do hero */}
        <div className="home-hero__wave">
          <svg viewBox="0 0 600 40" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,20 C150,40 450,0 600,20 L600,40 L0,40 Z" fill="#F7F8F6"/>
          </svg>
        </div>
      </section>

      {/* ───── FILTROS PILL ───── */}
      <div className="home-filters" role="navigation" aria-label="Filtros por modalidade">
        <div className="home-filters__track">
          {SPORT_FILTERS.map(f => (
            <button
              key={f.id}
              className={`home-filters__pill ${activeFilter === f.id ? 'home-filters__pill--active' : ''}`}
              onClick={() => handleFilterClick(f.id)}
              id={`filter-${f.id || 'all'}`}
              type="button"
            >
              <span className="home-filters__pill-icon">{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ───── TÍTULO DA SEÇÃO ───── */}
      <div className="home-section-head">
        <span className="home-section-head__line" />
        <h2 className="home-section-head__title">
          {activeFilter
            ? SPORT_FILTERS.find(f => f.id === activeFilter)?.label
            : 'Todos os Eventos'}
        </h2>
        {events.length > 0 && !loading && (
          <span className="home-section-head__count">{events.length}</span>
        )}
      </div>

      {/* ───── GRID MASONRY ───── */}
      <main className="home-content" aria-label="Lista de eventos">
        {loading ? (
          renderSkeletonMasonry()
        ) : events.length === 0 ? (
          <div className="home-empty">
            <div className="home-empty__icon">📷</div>
            <p className="home-empty__title">Nenhum evento encontrado</p>
            <p className="home-empty__sub">Tente ajustar os filtros ou buscar por outro nome.</p>
            {(searchName || selectedState || selectedModality) && (
              <button className="home-empty__btn" onClick={handleClear} id="btn-empty-clear">
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="home-masonry">
            {events.map((event, i) => (
              <EventCard
                key={event.id}
                event={event}
              />
            ))}
          </div>
        )}

        {/* Botão Carregar Mais */}
        {hasMore && !loading && (
          <div className="home-load-more">
            <button
              className="home-load-more__btn"
              onClick={() => loadEvents(page + 1)}
              disabled={loadingMore}
              id="btn-load-more"
            >
              {loadingMore ? (
                <span className="home-load-more__spinner" />
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                  Ver mais eventos
                </>
              )}
            </button>
          </div>
        )}
      </main>



      {/* ───── WHATSAPP FLOAT ───── */}
      <a
        href="https://api.whatsapp.com/send?phone=5599991596445&text=Oi"
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-float"
        title="Fale conosco no WhatsApp"
        aria-label="Contato via WhatsApp"
      >
        <svg className="whatsapp-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor">
          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zM223.9 413.3c-33.1 0-65.5-8.9-94-25.7l-6.7-4-69.8 18.3L72 334.1l-4.4-7.1c-18.4-29.6-28.1-63.7-28.1-98.9 0-103.5 84.3-187.8 187.9-187.8 50.1 0 97.2 19.5 132.7 55 35.4 35.5 54.9 82.6 54.9 132.8 0 103.5-84.3 187.8-187.8 187.8h-.1zM326.6 280c-5.6-2.8-33.3-16.5-38.5-18.4-5.2-1.9-9-2.8-12.8 2.8s-14.7 18.4-18 22.2c-3.3 3.8-6.6 4.2-12.2 1.4-5.6-2.8-23.8-8.8-45.3-28-16.6-14.9-27.8-33.3-31-38.9-3.3-5.6-.3-8.7 2.5-11.5 2.5-2.5 5.6-6.6 8.4-9.9 2.8-3.3 3.8-5.6 5.6-9.4 1.9-3.8.9-7.1-.5-9.9-1.4-2.8-12.8-30.9-17.5-42.3-4.6-11.2-9.3-9.7-12.8-9.9-3.3-.2-7.1-.2-10.9-.2-3.8 0-10 1.4-15.2 7.1-5.2 5.6-19.9 19.4-19.9 47.3s20.4 54.9 23.2 58.7c2.8 3.8 40.1 61.2 97.1 85.8 13.6 5.8 24.2 9.3 32.5 11.9 13.6 4.3 26 3.7 35.8 2.2 11-1.7 33.3-13.6 38-26.8 4.6-13.2 4.6-24.5 3.3-26.8-1.4-2.3-5.2-3.8-10.8-6.6z"/>
        </svg>
      </a>

      {/* Espaço no fundo para o scroll não ficar encostado no botão float */}
      <div style={{ height: '80px' }} />
    </div>
  );
}

export default Home;
