import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EventCard from '../components/EventCard';
import { mockEventsData, mockModalitiesData } from '../data/mockEvents';
import { apiUrl } from '../config/api';

function App() {
  const [events, setEvents] = useState([]);
  const [modalities, setModalities] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [selectedModality, setSelectedModality] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const loadStates = async () => {
    try {
      const response = await fetch(apiUrl('/api/panel/events/states'));
      if (response.ok) {
        const data = await response.json();
        setStates(data || []);
      }
    } catch (error) {
      console.warn('Falha ao carregar estados', error);
    }
  };

  const loadModalities = async () => {
    try {
      const response = await fetch(apiUrl('/api/panel/modality'));
      if (response.ok) {
        const data = await response.json();
        setModalities(data.results || []);
      } else {
        throw new Error('Falha na API de modalidades');
      }
    } catch (error) {
      console.warn('Usando modalidades mockadas:', error);
      setModalities(mockModalitiesData.results);
    }
  };

  const loadEvents = async (pageNumber = 1) => {
    if (pageNumber === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams();
      if (searchName) params.append('name', searchName);
      if (selectedModality) params.append('modality', selectedModality);
      
      // Se não houver um estado específico selecionado, enviar "all" conforme o padrão da API
      params.append('state', selectedState ? selectedState : 'all');
      
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
      console.warn('Usando dados simulados porque a API real falhou:', error);
      
      const removeAccents = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const filtered = mockEventsData.results.filter(event => {
        const safeSearchName = removeAccents(searchName.toLowerCase().trim());
        const safeEventName = removeAccents(event.name.toLowerCase());
        const matchName = safeSearchName === '' || safeEventName.includes(safeSearchName);
        
        const matchModality = selectedModality === '' || (event.modality && (event.modality.id === selectedModality || event.modality.slug === selectedModality));

        return matchName && matchModality;
      });

      setEvents(filtered);
      setHasMore(false); // mock não tem paginação
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadStates();
    loadModalities();
  }, []);

  useEffect(() => {
    loadEvents(1);
    // eslint-disable-next-line
  }, [selectedModality]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadEvents(1);
  };

  const handleClear = () => {
    setSearchName('');
    setSelectedModality('');
    setSelectedState('');
    setTimeout(() => {
      loadEvents(1);
    }, 100);
  };

  return (
    <div className="app-container">
      <header className="header" style={{ justifyContent: 'space-between' }}>
        <img src="/logo.png" alt="Top Fotos" className="logo-img" />
        <Link to="/minhas-compras" className="header-compras-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span>Minhas Compras</span>
        </Link>
      </header>

      <section className="hero-section">
        <h1 className="hero-title" style={{ marginTop: '20px' }}>Encontre suas fotos</h1>
        
        <form className="search-bar" onSubmit={handleSearch}>
          <div className="search-field-group" style={{ flex: 2 }}>
            <label className="search-field-label">Nome</label>
            <div className="search-input-wrapper">
              <input 
                type="text" 
                placeholder="Digite o nome do evento" 
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </div>
          </div>


          <div className="search-field-group">
            <label className="search-field-label">Estado</label>
            <div className="search-state-wrapper">
              <select 
                value={selectedState} 
                onChange={(e) => setSelectedState(e.target.value)}
                className="state-select"
              >
                <option value="">Maranhão</option>
                {states.map(state => (
                  <option key={state.id} value={state.id}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {searchName || selectedState ? (
              <button type="button" className="btn-clear" onClick={handleClear}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                Limpar
              </button>
            ) : null}
            <button type="submit" className="btn-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              Buscar
            </button>
          </div>
        </form>

        <ul className="onboarding-steps">
          <li className="step-item">
            <svg className="step-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="step-text">Encontre o evento</span>
          </li>
          <li className="step-item">
            <svg className="step-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="step-text">Escolha suas fotos</span>
          </li>
          <li className="step-item">
            <svg className="step-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="step-text">Conclua a compra</span>
          </li>
        </ul>
      </section>



      <div style={{ padding: '20px 24px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-dark)' }}>Eventos</h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)' }}>{events.length > 0 ? `${events.length} encontrados` : ''}</span>
      </div>

      <main className="events-list">
        {loading ? (
          <div style={{textAlign: 'center', color: '#6b7280', padding: '40px 0', gridColumn: '1 / -1'}}>
            <p>Buscando eventos...</p>
          </div>
        ) : events.length === 0 ? (
          <div style={{textAlign: 'center', color: '#6b7280', padding: '40px 0', gridColumn: '1 / -1'}}>
            <p>Nenhum evento encontrado para esta busca.</p>
          </div>
        ) : (
          <>
            {events.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </>
        )}
      </main>

      {hasMore && !loading && (
        <div style={{ textAlign: 'center', padding: '20px 24px 48px' }}>
          <button 
            className="btn-search" 
            onClick={() => loadEvents(page + 1)}
            disabled={loadingMore}
            style={{ margin: '0 auto', opacity: loadingMore ? 0.7 : 1 }}
          >
            {loadingMore ? 'Carregando...' : 'Carregar mais eventos'}
          </button>
        </div>
      )}

      <a 
        href="https://api.whatsapp.com/send?phone=5599991596445&text=Oi" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="whatsapp-float"
        title="Fale conosco no WhatsApp"
      >
        <svg className="whatsapp-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor">
          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zM223.9 413.3c-33.1 0-65.5-8.9-94-25.7l-6.7-4-69.8 18.3L72 334.1l-4.4-7.1c-18.4-29.6-28.1-63.7-28.1-98.9 0-103.5 84.3-187.8 187.9-187.8 50.1 0 97.2 19.5 132.7 55 35.4 35.5 54.9 82.6 54.9 132.8 0 103.5-84.3 187.8-187.8 187.8h-.1zM326.6 280c-5.6-2.8-33.3-16.5-38.5-18.4-5.2-1.9-9-2.8-12.8 2.8s-14.7 18.4-18 22.2c-3.3 3.8-6.6 4.2-12.2 1.4-5.6-2.8-23.8-8.8-45.3-28-16.6-14.9-27.8-33.3-31-38.9-3.3-5.6-.3-8.7 2.5-11.5 2.5-2.5 5.6-6.6 8.4-9.9 2.8-3.3 3.8-5.6 5.6-9.4 1.9-3.8.9-7.1-.5-9.9-1.4-2.8-12.8-30.9-17.5-42.3-4.6-11.2-9.3-9.7-12.8-9.9-3.3-.2-7.1-.2-10.9-.2-3.8 0-10 1.4-15.2 7.1-5.2 5.6-19.9 19.4-19.9 47.3s20.4 54.9 23.2 58.7c2.8 3.8 40.1 61.2 97.1 85.8 13.6 5.8 24.2 9.3 32.5 11.9 13.6 4.3 26 3.7 35.8 2.2 11-1.7 33.3-13.6 38-26.8 4.6-13.2 4.6-24.5 3.3-26.8-1.4-2.3-5.2-3.8-10.8-6.6z"/>
        </svg>
      </a>
    </div>
  );
}

export default App;
