import { CheckCircle } from "lucide-react";

const EmailConfirmed = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-card rounded-2xl shadow-xl p-8 space-y-6 border border-border">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <CheckCircle className="h-20 w-20 text-success" />
              <div className="absolute inset-0 rounded-full border-4 border-success/20 animate-pulse" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-foreground">
              Email Confirmed
            </h1>
            <p className="text-lg text-muted-foreground">
              Email confirmed, you may now log in to the mobile app.
            </p>
          </div>

          {/* Simple message */}
          <div className="bg-success/10 border border-success/20 rounded-lg p-4">
            <p className="text-sm text-success">
              You may close this window and proceed to log in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmed;