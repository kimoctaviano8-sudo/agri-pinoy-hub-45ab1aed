import { Wrench } from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const Maintenance = () => {
  return (
    <div className="min-h-screen bg-gradient-earth flex items-start justify-center pt-12 p-6">
      <div className="text-center max-w-md">
        <div className="w-96 h-96 mx-auto mb-8">
          <DotLottieReact
            src="https://lottie.host/92045648-1edc-4e31-a37b-94222ce1e728/OMGDjgkz6c.lottie"
            loop
            autoplay
            className="w-full h-full"
            renderConfig={{ autoResize: true }}
            backgroundColor="transparent"
          />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Under Maintenance</h1>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          We are currently performing scheduled maintenance to improve your experience. Please check back soon.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Wrench className="w-4 h-4" />
          <span>We'll be back shortly</span>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
