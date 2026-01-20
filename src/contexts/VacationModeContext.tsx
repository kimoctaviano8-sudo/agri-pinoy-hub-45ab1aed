import React, { createContext, useContext } from 'react';
import { useVacationMode } from '@/hooks/useVacationMode';

interface VacationModeContextType {
  vacationMode: boolean;
  vacationMessage: string;
  loading: boolean;
  toggleVacationMode: (enabled: boolean) => Promise<boolean>;
}

const VacationModeContext = createContext<VacationModeContextType | undefined>(undefined);

export const useVacationModeContext = () => {
  const context = useContext(VacationModeContext);
  if (!context) {
    throw new Error('useVacationModeContext must be used within a VacationModeProvider');
  }
  return context;
};

export const VacationModeProvider = ({ children }: { children: React.ReactNode }) => {
  const { vacationMode, vacationMessage, loading, toggleVacationMode } = useVacationMode();

  return (
    <VacationModeContext.Provider value={{ vacationMode, vacationMessage, loading, toggleVacationMode }}>
      {children}
    </VacationModeContext.Provider>
  );
};
