import { CheckCircle } from "lucide-react";

const EmailConfirmed = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-card rounded-2xl shadow-xl p-8 space-y-6 border border-border">
          <div className="flex justify-center">
            <CheckCircle className="h-20 w-20 text-green-500" />
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-foreground">
              Email Confirmed
            </h1>
            <p className="text-muted-foreground">
              Go back to the app.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmed;
