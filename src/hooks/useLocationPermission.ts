import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export const useLocationPermission = () => {
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unsupported'>('prompt');
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    const requestLocationPermission = async () => {
      if (!navigator.geolocation) {
        setPermissionStatus('unsupported');
        toast.error('Geolocation is not supported by your browser');
        return;
      }

      try {
        // Check if permission API is available
        if (navigator.permissions) {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          setPermissionStatus(permission.state as 'granted' | 'denied' | 'prompt');
          
          permission.onchange = () => {
            setPermissionStatus(permission.state as 'granted' | 'denied' | 'prompt');
          };
        }

        // Request location to trigger permission prompt
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setPermissionStatus('granted');
            setLocation({
              lat: position.coords.latitude,
              lon: position.coords.longitude
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
      } catch (error) {
        console.error('Error requesting location permission:', error);
      }
    };

    requestLocationPermission();
  }, []);

  return { permissionStatus, location };
};
