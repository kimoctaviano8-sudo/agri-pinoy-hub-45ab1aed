import { CheckCircle } from "lucide-react";

const EmailConfirmed = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <CheckCircle className="h-20 w-20 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Email Confirmed
        </h1>
        <p className="text-muted-foreground text-lg">
          Please go back to the mobile app.
        </p>
      </div>
    </div>
  );
};

export default EmailConfirmed;
