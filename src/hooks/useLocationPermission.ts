import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';

export const useLocationPermission = () => {
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unsupported'>('prompt');
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [showPurpose, setShowPurpose] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setPermissionStatus('unsupported');
      return;
    }

    // Check current permission state without triggering prompt
    const checkPermission = async () => {
      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          setPermissionStatus(permission.state as 'granted' | 'denied' | 'prompt');
          permission.onchange = () => {
            setPermissionStatus(permission.state as 'granted' | 'denied' | 'prompt');
          };

          if (permission.state === 'granted') {
            requestPosition();
          } else if (permission.state === 'prompt') {
            setShowPurpose(true);
          }
        } catch {
          // Fallback: show purpose dialog
          setShowPurpose(true);
        }
      } else {
        setShowPurpose(true);
      }
    };

    checkPermission();
  }, []);

  const requestPosition = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPermissionStatus('granted');
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionStatus('denied');
          toast.error('Location access denied. Some features may be limited.');
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  const allowLocation = useCallback(() => {
    setShowPurpose(false);
    requestPosition();
  }, [requestPosition]);

  const denyLocation = useCallback(() => {
    setShowPurpose(false);
    setPermissionStatus('denied');
  }, []);

  return { permissionStatus, location, showPurpose, allowLocation, denyLocation };
};
