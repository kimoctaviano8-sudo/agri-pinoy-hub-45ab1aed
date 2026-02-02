import { useEffect } from 'react';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

export const useDeepLink = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Only set up deep link listener on native platforms
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const handleDeepLink = (event: URLOpenListenerEvent) => {
      const url = new URL(event.url);
      const path = url.pathname;
      
      // Handle email confirmation deep link
      if (path === '/email-confirmed' || url.href.includes('email-confirmed')) {
        navigate('/email-confirmed');
        return;
      }

      // Handle other deep links by navigating to the path
      if (path) {
        navigate(path);
      }
    };

    // Listen for deep link events
    App.addListener('appUrlOpen', handleDeepLink);

    return () => {
      App.removeAllListeners();
    };
  }, [navigate]);
};

// Custom URL scheme for the app
export const APP_SCHEME = 'geminiagri';
export const getDeepLinkUrl = (path: string) => {
  if (Capacitor.isNativePlatform()) {
    return `${APP_SCHEME}://${path}`;
  }
  return `${window.location.origin}${path}`;
};
