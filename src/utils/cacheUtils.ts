import { toast } from "@/hooks/use-toast";

/**
 * Comprehensive cache and auth state cleanup utility
 * Follows best practices for preventing authentication limbo states
 */
export const cleanupAuthState = () => {
  try {
    // Remove all Supabase auth keys from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });

    // Remove all Supabase auth keys from sessionStorage
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });

    console.log('Auth state cleaned up successfully');
  } catch (error) {
    console.error('Error cleaning up auth state:', error);
  }
};

/**
 * Clear all application cache including browser caches
 */
export const clearApplicationCache = async (): Promise<void> => {
  try {
    // Clear browser cache if supported
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
    }

    // Clear Service Worker cache if available
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));
    }

    console.log('Application cache cleared successfully');
  } catch (error) {
    console.error('Error clearing application cache:', error);
    throw error;
  }
};

/**
 * Comprehensive cache clearing function
 * Clears localStorage, sessionStorage, browser cache, and auth state
 */
export const clearAllCache = async (options: {
  preserveAuth?: boolean;
  showToast?: boolean;
} = {}): Promise<void> => {
  const { preserveAuth = false, showToast = true } = options;
  
  try {
    // Store auth data if we want to preserve it
    let authData = null;
    if (preserveAuth) {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          authData = authData || {};
          authData[key] = localStorage.getItem(key);
        }
      });
    }

    // Clear localStorage (except auth if preserving)
    if (preserveAuth) {
      Object.keys(localStorage).forEach((key) => {
        if (!key.startsWith('supabase.auth.') && !key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
    } else {
      localStorage.clear();
    }

    // Clear sessionStorage
    sessionStorage.clear();

    // Clear browser caches
    await clearApplicationCache();

    // Restore auth data if preserving
    if (preserveAuth && authData) {
      Object.entries(authData).forEach(([key, value]) => {
        if (value && typeof value === 'string') {
          localStorage.setItem(key, value);
        }
      });
    }

    if (showToast) {
      toast({
        title: "Cache Cleared",
        description: "Application cache has been cleared successfully."
      });
    }

    console.log('All cache cleared successfully');
  } catch (error) {
    console.error('Error clearing cache:', error);
    if (showToast) {
      toast({
        title: "Clear Failed",
        description: "Failed to clear cache. Please try again.",
        variant: "destructive"
      });
    }
    throw error;
  }
};

/**
 * Clear only user data cache (preserves auth and system settings)
 */
export const clearUserDataCache = async (): Promise<void> => {
  try {
    const keysToPreserve = [
      'supabase.auth.',
      'sb-',
      'theme',
      'language',
      'settings'
    ];

    Object.keys(localStorage).forEach((key) => {
      const shouldPreserve = keysToPreserve.some(preserveKey => 
        key.startsWith(preserveKey) || key.includes(preserveKey)
      );
      
      if (!shouldPreserve) {
        localStorage.removeItem(key);
      }
    });

    // Clear only non-auth sessionStorage
    Object.keys(sessionStorage).forEach((key) => {
      const shouldPreserve = keysToPreserve.some(preserveKey => 
        key.startsWith(preserveKey) || key.includes(preserveKey)
      );
      
      if (!shouldPreserve) {
        sessionStorage.removeItem(key);
      }
    });

    toast({
      title: "User Data Cleared",
      description: "User data cache has been cleared while preserving auth state."
    });

    console.log('User data cache cleared successfully');
  } catch (error) {
    console.error('Error clearing user data cache:', error);
    toast({
      title: "Clear Failed",
      description: "Failed to clear user data cache. Please try again.",
      variant: "destructive"
    });
    throw error;
  }
};

/**
 * Force reload the application with cache bypass
 */
export const forceReload = (): void => {
  // Use location.reload with forceReload parameter for cache bypass
  window.location.reload();
};