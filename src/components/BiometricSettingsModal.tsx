import { useState } from "react";
import { Fingerprint, Smartphone, X, Shield, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNativeBiometric } from "@/hooks/useNativeBiometric";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface BiometricSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BiometricSettingsModal = ({ open, onOpenChange }: BiometricSettingsModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const {
    isAvailable,
    isEnabled,
    isNative,
    getBiometryTypeName,
    authenticate,
    setCredentials,
    deleteCredentials,
    checkBiometricAvailability,
  } = useNativeBiometric();

  const biometricName = getBiometryTypeName();

  const handleEnableBiometric = async () => {
    if (!isAvailable) {
      toast({
        title: "Not Supported",
        description: `${biometricName} is not available on this device.`,
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // First verify the user's identity with biometric
      const authenticated = await authenticate(`Enable ${biometricName} for quick login`);
      
      if (!authenticated) {
        toast({
          title: "Authentication Cancelled",
          description: "Biometric setup was cancelled.",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }

      // Store credentials for biometric login
      // Note: In a real app, you'd want to prompt for password or use a secure token
      if (user?.email) {
        const success = await setCredentials(user.email, user.id || '');
        
        if (success) {
          // Refresh the biometric state
          await checkBiometricAvailability();
          
          toast({
            title: `${biometricName} Enabled`,
            description: `You can now use ${biometricName} to log in.`
          });
        } else {
          toast({
            title: "Setup Failed",
            description: "Could not save biometric credentials.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Setup Failed",
          description: "User email not available.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Biometric setup error:', error);
      toast({
        title: "Setup Failed",
        description: "Failed to enable biometric authentication.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisableBiometric = async () => {
    setIsProcessing(true);
    
    try {
      const success = await deleteCredentials();
      
      if (success) {
        await checkBiometricAvailability();
        
        toast({
          title: `${biometricName} Disabled`,
          description: `${biometricName} authentication has been disabled.`
        });
      }
    } catch (error) {
      console.error('Biometric disable error:', error);
      toast({
        title: "Error",
        description: "Failed to disable biometric authentication.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTestBiometric = async () => {
    setIsProcessing(true);
    
    try {
      const success = await authenticate('Verify your identity');
      
      if (success) {
        toast({
          title: "Authentication Successful",
          description: `${biometricName} is working correctly.`
        });
      } else {
        toast({
          title: "Authentication Failed",
          description: "Could not authenticate with biometrics.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Biometric test encountered an error.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-primary" />
            Biometric Authentication
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Card */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isEnabled ? 'bg-green-500/10' : isAvailable ? 'bg-primary/10' : 'bg-muted'
              }`}>
                {isEnabled ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                ) : (
                  <Fingerprint className={`w-6 h-6 ${isAvailable ? 'text-primary' : 'text-muted-foreground'}`} />
                )}
              </div>
              <div>
                <p className="font-medium text-foreground">Face ID / Fingerprint</p>
                <p className="text-sm text-muted-foreground">
                  {!isAvailable 
                    ? "Not available on this device"
                    : isEnabled 
                      ? "Enabled and ready"
                      : "Available - tap to enable"
                  }
                </p>
              </div>
            </div>
            {isAvailable && (
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                isEnabled 
                  ? 'bg-green-500/10 text-green-600' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {isEnabled ? 'ON' : 'OFF'}
              </div>
            )}
          </div>

          {/* Features List */}
          {isAvailable && (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Enhanced Security</p>
                  <p className="text-xs text-muted-foreground">
                    Your biometric data never leaves your device
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Quick Access</p>
                  <p className="text-xs text-muted-foreground">
                    Log in instantly with {biometricName}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Platform Notice */}
          {!isNative && isAvailable && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-xs text-amber-600 dark:text-amber-400">
                For the best biometric experience, use the native mobile app. 
                Web browser support may be limited.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {isAvailable ? (
              <>
                {!isEnabled ? (
                  <Button 
                    onClick={handleEnableBiometric} 
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    <Fingerprint className="w-4 h-4 mr-2" />
                    {isProcessing ? "Setting up..." : `Enable ${biometricName}`}
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={handleDisableBiometric} 
                      variant="destructive" 
                      disabled={isProcessing}
                      className="flex-1"
                    >
                      {isProcessing ? "Disabling..." : "Disable"}
                    </Button>
                    <Button 
                      onClick={handleTestBiometric}
                      variant="outline"
                      disabled={isProcessing}
                      className="flex-1"
                    >
                      <Smartphone className="w-4 h-4 mr-2" />
                      Test
                    </Button>
                  </>
                )}
              </>
            ) : (
              <div className="w-full text-center py-4">
                <p className="text-sm text-muted-foreground">
                  Biometric authentication is not available on this device or browser.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};