import React, { createContext, useContext, useState, useEffect } from 'react';

interface OnboardingContextType {
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(() => {
    // Check localStorage for onboarding completion status
    const stored = localStorage.getItem('gemini_onboarding_completed');
    return stored === 'true';
  });

  const completeOnboarding = () => {
    setHasCompletedOnboarding(true);
    localStorage.setItem('gemini_onboarding_completed', 'true');
  };

  const resetOnboarding = () => {
    setHasCompletedOnboarding(false);
    localStorage.removeItem('gemini_onboarding_completed');
  };

  const value = {
    hasCompletedOnboarding,
    completeOnboarding,
    resetOnboarding
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};