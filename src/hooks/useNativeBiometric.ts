import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { NativeBiometric, BiometryType } from 'capacitor-native-biometric';

interface BiometricState {
  isAvailable: boolean;
  biometryType: BiometryType | null;
  isNative: boolean;
}

export const useNativeBiometric = () => {
  const [state, setState] = useState<BiometricState>({
    isAvailable: false,
    biometryType: null,
    isNative: false,
  });

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const isNativePlatform = Capacitor.isNativePlatform();
    
    if (isNativePlatform) {
      try {
        const result = await NativeBiometric.isAvailable();
        setState({
          isAvailable: result.isAvailable,
          biometryType: result.biometryType,
          isNative: true,
        });
      } catch (error) {
        console.log('Native biometric check failed:', error);
        setState({ isAvailable: false, biometryType: null, isNative: true });
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
          });
        }
      } catch (error) {
        console.log('WebAuthn check failed:', error);
        setState({ isAvailable: false, biometryType: null, isNative: false });
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
    server: string,
    username: string,
    password: string
  ): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
      // For web, do not persist raw credentials for security reasons
      console.warn(
        'Biometric credential storage is disabled on web to avoid storing passwords in localStorage.'
      );
      return false;
    }
    
    try {
      await NativeBiometric.setCredentials({
        server,
        username,
        password,
      });
      return true;
    } catch (error) {
      console.log('Failed to set credentials:', error);
      return false;
    }
  };

  const getCredentials = async (
    server: string
  ): Promise<{ username: string; password: string } | null> => {
    if (!Capacitor.isNativePlatform()) {
      // For web, biometric credential retrieval is disabled for security reasons
      console.warn(
        'Biometric credential retrieval is disabled on web because credentials are not stored in localStorage.'
      );
      return null;
    }
    
    try {
      const credentials = await NativeBiometric.getCredentials({ server });
      return credentials;
    } catch (error) {
      console.log('Failed to get credentials:', error);
      return null;
    }
  };

  const deleteCredentials = async (server: string): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
      // Best-effort cleanup of any legacy stored credentials
      try {
        localStorage.removeItem(`biometric_credentials_${server}`);
      } catch (error) {
        console.log('Failed to clean up legacy web biometric credentials:', error);
      }
      return true;
    }
    
    try {
      await NativeBiometric.deleteCredentials({ server });
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
  };
};
