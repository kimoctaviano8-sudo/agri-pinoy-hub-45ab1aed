import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { NativeBiometric, BiometryType } from 'capacitor-native-biometric';

// Server identifier for credential storage
const BIOMETRIC_SERVER = 'app.buildnatively.com';

interface BiometricState {
  isAvailable: boolean;
  biometryType: BiometryType | null;
  isNative: boolean;
  isEnabled: boolean;
}

export const useNativeBiometric = () => {
  const [state, setState] = useState<BiometricState>({
    isAvailable: false,
    biometryType: null,
    isNative: false,
    isEnabled: false,
  });

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const isNativePlatform = Capacitor.isNativePlatform();
    
    if (isNativePlatform) {
      try {
        const result = await NativeBiometric.isAvailable();
        // Check if credentials are already stored
        let hasCredentials = false;
        try {
          const creds = await NativeBiometric.getCredentials({ server: BIOMETRIC_SERVER });
          hasCredentials = !!(creds?.username && creds?.password);
        } catch {
          hasCredentials = false;
        }
        
        setState({
          isAvailable: result.isAvailable,
          biometryType: result.biometryType,
          isNative: true,
          isEnabled: hasCredentials,
        });
      } catch (error) {
        console.log('Native biometric check failed:', error);
        setState({ isAvailable: false, biometryType: null, isNative: true, isEnabled: false });
      }
    } else {
      // Fallback to WebAuthn for browser
      try {
        if (window.PublicKeyCredential) {
          const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setState({
            isAvailable,
            biometryType: isAvailable ? BiometryType.FACE_ID : null,
            isNative: false,
            isEnabled: false,
          });
        }
      } catch (error) {
        console.log('WebAuthn check failed:', error);
        setState({ isAvailable: false, biometryType: null, isNative: false, isEnabled: false });
      }
    }
  };

  const authenticate = async (reason: string = 'Authenticate to continue'): Promise<boolean> => {
    const isNativePlatform = Capacitor.isNativePlatform();
    
    if (isNativePlatform) {
      try {
        await NativeBiometric.verifyIdentity({
          reason,
          title: 'Biometric Authentication',
          subtitle: 'Use Face ID or Touch ID',
          description: reason,
        });
        return true;
      } catch (error) {
        console.log('Native biometric auth failed:', error);
        return false;
      }
    } else {
      // Fallback WebAuthn for browser
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
  };

  const setCredentials = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
      console.warn('Biometric credential storage is only available on native platforms.');
      return false;
    }
    
    try {
      await NativeBiometric.setCredentials({
        server: BIOMETRIC_SERVER,
        username,
        password,
      });
      setState(prev => ({ ...prev, isEnabled: true }));
      return true;
    } catch (error) {
      console.log('Failed to set credentials:', error);
      return false;
    }
  };

  const getCredentials = async (): Promise<{ username: string; password: string } | null> => {
    if (!Capacitor.isNativePlatform()) {
      console.warn('Biometric credential retrieval is only available on native platforms.');
      return null;
    }
    
    try {
      const credentials = await NativeBiometric.getCredentials({ server: BIOMETRIC_SERVER });
      return credentials;
    } catch (error) {
      console.log('Failed to get credentials:', error);
      return null;
    }
  };

  const deleteCredentials = async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
      return true;
    }
    
    try {
      await NativeBiometric.deleteCredentials({ server: BIOMETRIC_SERVER });
      setState(prev => ({ ...prev, isEnabled: false }));
      return true;
    } catch (error) {
      console.log('Failed to delete credentials:', error);
      return false;
    }
  };

  const getBiometryTypeName = (): string => {
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
      default:
        return 'Biometric';
    }
  };

  return {
    ...state,
    authenticate,
    setCredentials,
    getCredentials,
    deleteCredentials,
    getBiometryTypeName,
    checkBiometricAvailability,
    server: BIOMETRIC_SERVER,
  };
};
