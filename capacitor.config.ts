import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.topfotos.app',
  appName: 'Top Fotos',
  webDir: 'dist',
  server: {
    allowNavigation: [
      'painel.topfotos.com.br',
      '*.topfotos.com.br',
    ],
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    PrivacyScreen: {
      enable: true,
      imageName: "Splash",
    },
  },
};

export default config;
