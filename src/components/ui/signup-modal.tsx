import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle, Mail, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SignupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isLoading: boolean
  isSuccess: boolean
  email: string
}

export function SignupModal({ open, onOpenChange, isLoading, isSuccess, email }: SignupModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {isLoading ? "Creating Account" : "Check Your Email"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isLoading 
              ? "Please wait while we create your account..."
              : "We've sent you a verification link"
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          {isLoading ? (
            <>
              <div className="relative">
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
                <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
              </div>
              <div className="space-y-2 text-center">
                <p className="text-sm text-muted-foreground">
                  Creating your account...
                </p>
                <div className="flex justify-center space-x-1">
                  <div className={cn("w-2 h-2 bg-primary rounded-full animate-pulse")} style={{ animationDelay: "0ms" }} />
                  <div className={cn("w-2 h-2 bg-primary rounded-full animate-pulse")} style={{ animationDelay: "150ms" }} />
                  <div className={cn("w-2 h-2 bg-primary rounded-full animate-pulse")} style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </>
          ) : isSuccess ? (
            <>
              <div className="relative">
                <CheckCircle className="h-16 w-16 text-green-500" />
                <div className="absolute inset-0 rounded-full border-2 border-green-500/20 animate-pulse" />
              </div>
              <div className="space-y-3 text-center max-w-xs">
                <h3 className="font-semibold text-lg">Account Created!</h3>
                <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">{email}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Click the verification link in your email to activate your account.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                  <p className="text-xs text-blue-700">
                    <strong>Important:</strong> Check your spam folder if you don't see the email within a few minutes.
                  </p>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}