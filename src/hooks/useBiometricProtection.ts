import { useState, useCallback } from 'react';
import { useNativeBiometric } from './useNativeBiometric';
import { useToast } from './use-toast';

interface UseBiometricProtectionOptions {
  actionName?: string;
  requireEnabled?: boolean; // If true, only require biometric if it's enabled
}

/**
 * Hook to protect sensitive actions with biometric authentication
 * Use this for actions like deleting account, changing password, viewing sensitive data
 */
export const useBiometricProtection = (options: UseBiometricProtectionOptions = {}) => {
  const { actionName = 'this action', requireEnabled = true } = options;
  const { toast } = useToast();
  const {
    isAvailable,
    isEnabled,
    isNative,
    authenticate,
    getBiometryTypeName,
  } = useNativeBiometric();

  const [isVerifying, setIsVerifying] = useState(false);

  /**
   * Verify user identity with biometrics before performing a sensitive action
   * @param onSuccess - Callback to execute if authentication succeeds
   * @param onCancel - Optional callback to execute if authentication is cancelled
   */
  const protectAction = useCallback(async (
    onSuccess: () => void | Promise<void>,
    onCancel?: () => void
  ): Promise<boolean> => {
    // If biometric is not available or not enabled (when requireEnabled is true), skip verification
    if (!isAvailable || (requireEnabled && !isEnabled)) {
      // If native and available but not enabled, we might want to proceed anyway
      // or prompt them to set it up - for now, we'll just proceed
      await onSuccess();
      return true;
    }

    setIsVerifying(true);

    try {
      const biometricName = getBiometryTypeName();
      const verified = await authenticate(`Verify your identity to ${actionName}`);

      if (verified) {
        toast({
          title: "Identity Verified",
          description: `${biometricName} verification successful.`,
        });
        await onSuccess();
        return true;
      } else {
        toast({
          title: "Verification Cancelled",
          description: `${biometricName} verification is required for ${actionName}.`,
          variant: "destructive"
        });
        onCancel?.();
        return false;
      }
    } catch (error) {
      console.error('Biometric protection error:', error);
      toast({
        title: "Verification Failed",
        description: "Could not verify your identity. Please try again.",
        variant: "destructive"
      });
      onCancel?.();
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, [isAvailable, isEnabled, requireEnabled, authenticate, getBiometryTypeName, actionName, toast]);

  /**
   * Check if biometric protection is active (available and enabled)
   */
  const isProtectionActive = isAvailable && isEnabled;

  /**
   * Get a human-readable description of the protection status
   */
  const protectionStatus = isProtectionActive
    ? `Protected by ${getBiometryTypeName()}`
    : isAvailable
      ? 'Biometric protection available'
      : 'No biometric protection';

  return {
    protectAction,
    isVerifying,
    isProtectionActive,
    protectionStatus,
    biometricName: getBiometryTypeName(),
    isNative,
  };
};
