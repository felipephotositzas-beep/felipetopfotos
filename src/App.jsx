import React, { useEffect } from 'react';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import Home from './pages/Home';
import EventDetails from './pages/EventDetails';
import Checkout from './pages/Checkout';
import MinhasCompras from './pages/MinhasCompras';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './components/Toast';
import { logger } from './utils/logger';

function BackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let active = true;
    let listener = null;

    const setupListener = async () => {
      listener = await CapApp.addListener('backButton', () => {
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
          logger.error('Erro ao ler link:', e);
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
    const init = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          // Configurar status bar
          await StatusBar.setStyle({ style: Style.Light });
        } catch {
          // StatusBar pode não estar disponível em todos os contextos
        }

        // Pedir permissões nativas no primeiro acesso
        try {
          await Camera.requestPermissions();
        } catch {
          // Permissão ignorada pelo usuário — não bloquear o app
        }

        // Ocultar splash screen após inicialização
        try {
          await SplashScreen.hide();
        } catch {
          // Ignorar se já foi ocultada
        }
      }
    };

    init();
  }, []);

  return (
    <ToastProvider>
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
    </ToastProvider>
  );
}

export default App;
