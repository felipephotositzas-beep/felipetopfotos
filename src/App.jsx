import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import Home from './pages/Home';
import EventDetails from './pages/EventDetails';
import Checkout from './pages/Checkout';
import MinhasCompras from './pages/MinhasCompras';
import { CartProvider } from './context/CartContext';

function BackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let active = true;
    let listener = null;

    const setupListener = async () => {
      listener = await CapApp.addListener('backButton', (data) => {
        if (!active) return;
        if (location.pathname === '/' || location.pathname === '/minhas-compras') {
          CapApp.exitApp();
        } else {
          navigate(-1);
        }
      });
    };

    setupListener();

    return () => {
      active = false;
      if (listener) {
        listener.remove();
      }
    };
  }, [location.pathname, navigate]);

  return null;
}

function DeepLinkHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    let listener = null;

    const setupListener = async () => {
      listener = await CapApp.addListener('appUrlOpen', (event) => {
        try {
          const urlObj = new URL(event.url);
          const pathname = urlObj.pathname; // Ex: "/4o-corridao-da-tropa"
          
          if (pathname && pathname !== '/') {
            if (pathname.startsWith('/minhas-compras') || pathname.startsWith('/checkout')) {
              navigate(pathname + urlObj.search);
            } else if (pathname.startsWith('/evento/')) {
              navigate(pathname + urlObj.search);
            } else {
              // Assume que qualquer outra rota direta seja o ID de um evento
              navigate(`/evento${pathname}${urlObj.search}`);
            }
          }
        } catch (e) {
          console.error('Erro ao ler link:', e);
        }
      });
    };

    setupListener();

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, [navigate]);

  return null;
}

function App() {
  useEffect(() => {
    // Pedir permissões nativas no primeiro acesso
    const requestInitialPermissions = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          await Camera.requestPermissions();
        } catch (e) {
          console.warn('Permissão de câmera ignorada ou falhou:', e);
        }
      }
    };
    
    requestInitialPermissions();
  }, []);

  return (
    <CartProvider>
      <BrowserRouter>
        <BackButtonHandler />
        <DeepLinkHandler />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/evento/:id" element={<EventDetails />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/minhas-compras" element={<MinhasCompras />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
