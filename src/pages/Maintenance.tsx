import { Wrench, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const Maintenance = () => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-earth flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-48 h-48 mx-auto mb-6">
          <DotLottieReact
            src="https://lottie.host/92045648-1edc-4e31-a37b-94222ce1e728/OMGDjgkz6c.lottie"
            loop
            autoplay
            className="w-full h-full"
            renderConfig={{ autoResize: true }}
            backgroundColor="transparent"
          />
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
