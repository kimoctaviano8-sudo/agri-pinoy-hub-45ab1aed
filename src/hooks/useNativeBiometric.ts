import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { NativeBiometric, BiometryType } from 'capacitor-native-biometric';

// Server identifier for credential storage - connected to app.buildnatively.com
const BIOMETRIC_SERVER = 'app.buildnatively.com';

interface BiometricState {
  isAvailable: boolean;
  biometryType: BiometryType | null;
  isNative: boolean;
  isEnabled: boolean;
  isChecking: boolean;
  error: string | null;
}

export const useNativeBiometric = () => {
  const [state, setState] = useState<BiometricState>({
    isAvailable: false,
    biometryType: null,
    isNative: false,
    isEnabled: false,
    isChecking: true,
    error: null,
  });

  const checkBiometricAvailability = useCallback(async () => {
    setState(prev => ({ ...prev, isChecking: true, error: null }));
    const isNativePlatform = Capacitor.isNativePlatform();
    
    if (isNativePlatform) {
      try {
        // Check if biometric hardware is available
        const result = await NativeBiometric.isAvailable();
        
        // Check if credentials are already stored
        let hasCredentials = false;
        if (result.isAvailable) {
          try {
            const creds = await NativeBiometric.getCredentials({ server: BIOMETRIC_SERVER });
            hasCredentials = !!(creds?.username && creds?.password);
          } catch {
            // No credentials stored yet - this is normal
            hasCredentials = false;
          }
        }
        
        setState({
          isAvailable: result.isAvailable,
          biometryType: result.biometryType,
          isNative: true,
          isEnabled: hasCredentials,
          isChecking: false,
          error: null,
        });
      } catch (error) {
        console.log('Native biometric check failed:', error);
        setState({
          isAvailable: false,
          biometryType: null,
          isNative: true,
          isEnabled: false,
          isChecking: false,
          error: 'Biometric hardware not available',
        });
      }
    } else {
      // Fallback to WebAuthn for browser (limited support)
      try {
        if (window.PublicKeyCredential) {
          const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setState({
            isAvailable,
            biometryType: isAvailable ? BiometryType.FACE_ID : null,
            isNative: false,
            isEnabled: false,
            isChecking: false,
            error: isAvailable ? null : 'Platform authenticator not available',
          });
        } else {
          setState({
            isAvailable: false,
            biometryType: null,
            isNative: false,
            isEnabled: false,
            isChecking: false,
            error: 'WebAuthn not supported in this browser',
          });
        }
      } catch (error) {
        console.log('WebAuthn check failed:', error);
        setState({
          isAvailable: false,
          biometryType: null,
          isNative: false,
          isEnabled: false,
          isChecking: false,
          error: 'Failed to check biometric availability',
        });
      }
    }
  }, []);

  useEffect(() => {
    checkBiometricAvailability();
  }, [checkBiometricAvailability]);

  const authenticate = useCallback(async (reason: string = 'Authenticate to continue'): Promise<boolean> => {
    const isNativePlatform = Capacitor.isNativePlatform();
    
    if (isNativePlatform) {
      try {
        // Native biometric authentication for iOS/Android
        await NativeBiometric.verifyIdentity({
          reason,
          title: 'Biometric Login',
          subtitle: 'Verify your identity',
          description: reason,
          useFallback: true, // Allow device PIN as fallback
          maxAttempts: 3,
        });
        return true;
      } catch (error: any) {
        console.log('Native biometric auth failed:', error);
        // Handle specific error codes for better UX
        const errorCode = error?.code;
        if (errorCode === 'BIOMETRIC_AUTHENTICATION_FAILED') {
          setState(prev => ({ ...prev, error: 'Authentication failed. Please try again.' }));
        } else if (errorCode === 'BIOMETRIC_NOT_ENROLLED') {
          setState(prev => ({ ...prev, error: 'No biometrics enrolled on device.' }));
        } else if (errorCode === 'BIOMETRIC_DISMISSED') {
          // User cancelled - no error needed
        }
        return false;
      }
    } else {
      // WebAuthn fallback for browser
      try {
        const credential = await navigator.credentials.get({
          publicKey: {
            challenge: new Uint8Array(32),
            timeout: 60000,
            userVerification: 'required',
            rpId: window.location.hostname,
          },
        });
        return !!credential;
      } catch (error) {
        console.log('WebAuthn auth failed:', error);
        return false;
      }
    }
  }, []);

  const setCredentials = useCallback(async (
    username: string,
    password: string
  ): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
      console.warn('Biometric credential storage requires native app (iOS/Android).');
      return false;
    }
    
    try {
      // Delete existing credentials first to ensure clean state
      try {
        await NativeBiometric.deleteCredentials({ server: BIOMETRIC_SERVER });
      } catch {
        // Ignore if no credentials exist
      }
      
      // Store new credentials
      await NativeBiometric.setCredentials({
        server: BIOMETRIC_SERVER,
        username,
        password,
      });
      
      setState(prev => ({ ...prev, isEnabled: true, error: null }));
      return true;
    } catch (error) {
      console.log('Failed to set credentials:', error);
      setState(prev => ({ ...prev, error: 'Failed to save biometric credentials' }));
      return false;
    }
  }, []);

  const getCredentials = useCallback(async (): Promise<{ username: string; password: string } | null> => {
    if (!Capacitor.isNativePlatform()) {
      console.warn('Biometric credential retrieval requires native app (iOS/Android).');
      return null;
    }
    
    try {
      const credentials = await NativeBiometric.getCredentials({ server: BIOMETRIC_SERVER });
      if (credentials?.username && credentials?.password) {
        return credentials;
      }
      return null;
    } catch (error) {
      console.log('Failed to get credentials:', error);
      return null;
    }
  }, []);

  const deleteCredentials = useCallback(async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
      return true; // No-op for web
    }
    
    try {
      await NativeBiometric.deleteCredentials({ server: BIOMETRIC_SERVER });
      setState(prev => ({ ...prev, isEnabled: false, error: null }));
      return true;
    } catch (error) {
      console.log('Failed to delete credentials:', error);
      return false;
    }
  }, []);

  const getBiometryTypeName = useCallback((): string => {
    switch (state.biometryType) {
      case BiometryType.FACE_ID:
        return 'Face ID';
      case BiometryType.TOUCH_ID:
        return 'Touch ID';
      case BiometryType.FINGERPRINT:
        return 'Fingerprint';
      case BiometryType.FACE_AUTHENTICATION:
        return 'Face Authentication';
      case BiometryType.IRIS_AUTHENTICATION:
        return 'Iris Authentication';
      case BiometryType.MULTIPLE:
        return 'Biometric';
      default:
        return 'Biometric';
    }
  }, [state.biometryType]);

  // Clear any error state
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    authenticate,
    setCredentials,
    getCredentials,
    deleteCredentials,
    getBiometryTypeName,
    checkBiometricAvailability,
    clearError,
    server: BIOMETRIC_SERVER,
  };
};
