import { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Symptom {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export const PLANT_SYMPTOMS: Symptom[] = [
  {
    id: 'yellowing_leaves',
    label: 'Yellowing Leaves',
    icon: '🍂',
    description: 'Leaves turning yellow or pale green'
  },
  {
    id: 'poor_flowering',
    label: 'Poor Flowering',
    icon: '🌸',
    description: 'Few or no flowers, poor fruit set'
  },
  {
    id: 'weak_stems',
    label: 'Weak Stems',
    icon: '🌱',
    description: 'Thin, fragile, or drooping stems'
  },
  {
    id: 'stunted_growth',
    label: 'Stunted Growth',
    icon: '📏',
    description: 'Plant smaller than expected'
  },
  {
    id: 'leaf_curling',
    label: 'Leaf Curling',
    icon: '🌀',
    description: 'Edges curling up or down'
  },
  {
    id: 'brown_tips',
    label: 'Brown Tips',
    icon: '🍁',
    description: 'Brown or burnt leaf edges/tips'
  },
  {
    id: 'purple_leaves',
    label: 'Purple Leaves',
    icon: '💜',
    description: 'Purple or reddish coloration'
  },
  {
    id: 'poor_roots',
    label: 'Weak Root System',
    icon: '🌿',
    description: 'Underdeveloped or rotting roots'
  },
  {
    id: 'interveinal_chlorosis',
    label: 'Yellow Between Veins',
    icon: '🔬',
    description: 'Yellow leaves with green veins'
  },
  {
    id: 'small_fruits',
    label: 'Small Fruits',
    icon: '🍅',
    description: 'Undersized or deformed fruits'
  }
];

interface SymptomSelectorProps {
  selectedSymptoms: string[];
  onSymptomsChange: (symptoms: string[]) => void;
  disabled?: boolean;
}

export function SymptomSelector({ selectedSymptoms, onSymptomsChange, disabled }: SymptomSelectorProps) {
  const toggleSymptom = (symptomId: string) => {
    if (disabled) return;
    
    if (selectedSymptoms.includes(symptomId)) {
      onSymptomsChange(selectedSymptoms.filter(id => id !== symptomId));
    } else {
      onSymptomsChange([...selectedSymptoms, symptomId]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Select Symptoms</h3>
        <span className="text-xs text-muted-foreground">
          {selectedSymptoms.length} selected
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {PLANT_SYMPTOMS.map((symptom) => {
          const isSelected = selectedSymptoms.includes(symptom.id);
          
          return (
            <button
              key={symptom.id}
              onClick={() => toggleSymptom(symptom.id)}
              disabled={disabled}
              className={cn(
                "relative p-3 rounded-xl border-2 text-left transition-all",
                "hover:border-primary/50 active:scale-[0.98]",
                isSelected 
                  ? "border-primary bg-primary/5" 
                  : "border-muted-foreground/20 bg-background",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
              
              <div className="flex items-start gap-2">
                <span className="text-lg">{symptom.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-xs font-medium truncate",
                    isSelected ? "text-primary" : "text-foreground"
                  )}>
                    {symptom.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
                    {symptom.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      {selectedSymptoms.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Tap symptoms you observe on your plant
        </p>
      )}
    </div>
  );
}
