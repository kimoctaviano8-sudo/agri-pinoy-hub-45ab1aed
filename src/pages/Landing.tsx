import { Button } from "@/components/ui/button";
import { Leaf, ArrowRight, Sparkles } from "lucide-react";
import geminiLogo from "@/assets/Gemini_logo_only.png";
import landingBg from "@/assets/login-section.jpg";

interface LandingProps {
  onLogin: () => void;
  onSignup: () => void;
}

const Landing = ({ onLogin, onSignup }: LandingProps) => {
  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative flex flex-col overflow-hidden"
      style={{
        backgroundImage: `url(${landingBg})`,
      }}
    >
      {/* Floating elements for visual interest */}
      <div className="absolute bottom-40 left-8 w-1.5 h-1.5 bg-accent rounded-full animate-pulse opacity-50 delay-1000" />

      {/* Content */}
      <div className="relative z-10 flex-col min-h-screen px-8 py-12 flex items-center justify-between">
        {/* Top Section - Title */}
        <div className="space-y-8 py-[150px] pt-[6px] pb-[210px]">
          <div className="text-left max-w-sm mx-auto space-y-6 md:pt-16 py-0 pt-px pb-[10px]">
            <div className="space-y-3 py-0">
              <img
                src={geminiLogo}
                alt="Gemini agriculture logo"
                className="h-16 w-16 object-contain mb-4"
              />
              <h1 className="text-4xl font-bold text-foreground leading-tight tracking-tight -mt-1">
                <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent py-0">
                  Gemini
                </span>
                <br />
              </h1>
              <div className="w-16 h-1 bg-gradient-to-r from-primary to-primary-glow rounded-full" />
            </div>

            <p className="text-muted-foreground leading-relaxed text-base font-normal">
              Helping Filipino Farmers for a{' '}
              <span className="text-primary font-semibold">Sustainable Agriculture</span>
            </p>
          </div>
        </div>

        {/* Bottom Section - Enhanced Buttons */}
        <div className="space-y-6 pb-12">
          <div className="space-y-4 max-w-sm mx-auto pt-[20px]">
            <Button
              onClick={onLogin}
              size="lg"
              className="w-full h-14 text-base bg-gradient-primary hover:shadow-elevated text-primary-foreground font-semibold rounded-3xl border-0 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group"
            >
              <span className="flex items-center justify-center gap-3">
                <span>Log in</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Button>

            <Button
              onClick={onSignup}
              variant="outline"
              size="lg"
              className="w-full h-14 text-base bg-background/95 backdrop-blur-xl border-0 hover:bg-background/98 hover:shadow-card text-primary font-semibold rounded-3xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group"
            >
              <span className="flex items-center justify-center gap-3">
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-slate-50">Join thousands of satisfied farmers</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
