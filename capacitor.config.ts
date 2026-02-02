import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gemini.agripinoy',
  appName: 'Gemini Agri',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    App: {
      // Enable deep linking
    }
  }
};

export default config;
