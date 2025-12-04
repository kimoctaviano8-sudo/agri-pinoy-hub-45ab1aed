import { useState } from 'react';
import { clearAllCache, clearUserDataCache, cleanupAuthState, forceReload } from '@/utils/cacheUtils';

export const useCacheManager = () => {
  const [isClearing, setIsClearing] = useState(false);

  const clearCache = async (options?: {
    preserveAuth?: boolean;
    showToast?: boolean;
  }) => {
    setIsClearing(true);
    try {
      await clearAllCache(options);
      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error clearing cache:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const clearUserData = async () => {
    setIsClearing(true);
    try {
      await clearUserDataCache();
      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error clearing user data:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const clearAuthState = () => {
    cleanupAuthState();
  };

  const reloadApp = () => {
    forceReload();
  };

  const clearCacheAndReload = async (preserveAuth = false) => {
    setIsClearing(true);
    try {
      await clearAllCache({ preserveAuth, showToast: false });
      // Force reload after clearing
      forceReload();
    } catch (error) {
      console.error('Error clearing cache and reloading:', error);
      setIsClearing(false);
    }
  };

  return {
    isClearing,
    clearCache,
    clearUserData,
    clearAuthState,
    reloadApp,
    clearCacheAndReload
  };
};