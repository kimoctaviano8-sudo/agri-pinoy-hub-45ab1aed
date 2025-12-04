import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import { ChevronRight, ChevronLeft, FileText, Package, MessageCircle, Scan, BookOpen, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import heroImage from '@/assets/hero-agriculture.jpg';
import productsImage from '@/assets/products-showcase.jpg';
import farmerImage from '@/assets/farmer-mobile.jpg';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to Gemini',
      subtitle: 'Your complete agricultural companion',
      description: 'Get the latest farming news, discover quality products, connect with fellow farmers, and access cutting-edge plant disease detection technology.',
      isLottie: true,
      lottieUrl: 'https://lottie.host/embed/6e6fb534-0357-46a5-aad1-fd178cd2313d/2ZTKyQAytB.lottie',
      features: [
        { icon: FileText, name: 'Latest News', description: 'Stay updated with agricultural insights' },
        { icon: Package, name: 'Quality Products', description: 'Discover farming tools & supplies' },
        { icon: MessageCircle, name: 'Community Forum', description: 'Connect with fellow farmers' },
        { icon: Scan, name: 'Plant Scanner', description: 'AI-powered disease detection' }
      ]
    },
    {
      id: 'features',
      title: 'Explore Key Features',
      subtitle: 'Everything you need in one place',
      description: 'From real-time market updates to community discussions, Gemini provides comprehensive tools for modern farmers.',
      isLottie: true,
      lottieUrl: 'https://lottie.host/embed/fd958304-e8e6-49d4-b8b4-2c806ccf5371/I1h8arpY3v.lottie',
      highlights: [
        'Real-time weather & market updates',
        'AI-powered plant disease detection',
        'Community-driven knowledge sharing',
        'Curated farming products & tools'
      ]
    },
    {
      id: 'getstarted',
      title: "You're All Set!",
      subtitle: 'Start your farming journey',
      description: 'Begin exploring the latest agricultural news, connect with farmers in your area, and discover tools to boost your productivity.',
      isLottie: true,
      lottieUrl: 'https://lottie.host/embed/0b633fdc-9629-4545-8904-bf6a0f9c33a5/knYt5IjswF.lottie',
      ctaText: 'Start Exploring',
      quickActions: [
        { icon: FileText, name: 'Read Latest News', action: 'news' },
        { icon: Scan, name: 'Try Plant Scanner', action: 'scanner' },
        { icon: MessageCircle, name: 'Join Discussions', action: 'forum' }
      ]
    }
  ];

  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-earth flex flex-col">
      {/* Progress bar */}
      <div className="w-full bg-background/20 h-1">
        <div 
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex justify-between items-center p-4">
        <div className="flex space-x-1">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index <= currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleSkip}
          className="text-muted-foreground hover:text-foreground"
        >
          Skip
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-4 pb-8">
        {/* Banner Animation or Image */}
        <div className={`relative h-56 rounded-2xl overflow-hidden mb-6 bg-gradient-to-br from-primary/10 to-primary/5 flex ${currentStep === 1 ? 'items-end' : 'items-center'} justify-center`}>
          {currentStepData.isLottie ? (
            <iframe
              src={currentStepData.lottieUrl}
              style={{ 
                width: '100%', 
                height: '100%', 
                maxWidth: '280px', 
                maxHeight: '200px',
                border: 'none',
                backgroundColor: 'transparent',
                ...(currentStep === 1 ? {
                  position: 'absolute',
                  bottom: '0',
                  left: '50%',
                  transform: 'translateX(-50%)'
                } : {})
              }}
              title="Onboarding Animation"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <div className="text-6xl text-primary/30">🌱</div>
            </div>
          )}
          <div className={`absolute bottom-4 left-4 ${currentStepData.isLottie ? 'text-primary' : 'text-white'}`}>
            <Badge variant="secondary" className="mb-2">
              Step {currentStep + 1} of {steps.length}
            </Badge>
          </div>
        </div>

        {/* Text Content */}
        <div className="flex-1 space-y-4">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              {currentStepData.title}
            </h1>
            <p className="text-lg font-medium text-primary">
              {currentStepData.subtitle}
            </p>
            <p className="text-sm text-muted-foreground px-4 leading-relaxed">
              {currentStepData.description}
            </p>
          </div>

          {/* Step-specific content */}
          {currentStep === 0 && (
            <div className="space-y-3 mt-6">
              {currentStepData.features?.map((feature, index) => (
                <Card key={index} className="bg-background/50 border-border/50">
                  <CardContent className="p-4 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{feature.name}</h3>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-3 mt-6">
              {currentStepData.highlights?.map((highlight, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-background/30 rounded-lg">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <p className="text-sm text-foreground">{highlight}</p>
                </div>
              ))}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-3 mt-6">
              <h3 className="text-base font-semibold text-foreground text-center mb-4">
                Quick Actions
              </h3>
              {currentStepData.quickActions?.map((action, index) => (
                <Card key={index} className="bg-background/50 border-border/50 hover:bg-background/70 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <action.icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-medium text-foreground">{action.name}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="flex items-center space-x-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>

        <Button
          onClick={handleNext}
          className="flex items-center space-x-1 px-6"
        >
          <span>
            {currentStep === steps.length - 1 ? (currentStepData.ctaText || 'Get Started') : 'Next'}
          </span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;