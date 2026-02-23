import { Construction, Wrench, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const Maintenance = () => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-earth flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Construction className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">Under Maintenance</h1>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          We are currently performing scheduled maintenance to improve your experience. Please check back soon.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
          <Wrench className="w-4 h-4" />
          <span>We'll be back shortly</span>
        </div>
        <Button variant="outline" onClick={logout} className="gap-2">
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Maintenance;
