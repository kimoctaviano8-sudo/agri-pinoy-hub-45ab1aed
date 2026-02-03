import { useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
  const [open, setOpen] = useState(false);

  const toggleSymptom = (symptomId: string) => {
    if (disabled) return;
    
    if (selectedSymptoms.includes(symptomId)) {
      onSymptomsChange(selectedSymptoms.filter(id => id !== symptomId));
    } else {
      onSymptomsChange([...selectedSymptoms, symptomId]);
    }
  };

  const removeSymptom = (symptomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onSymptomsChange(selectedSymptoms.filter(id => id !== symptomId));
  };

  const getSymptomLabel = (symptomId: string) => {
    return PLANT_SYMPTOMS.find(s => s.id === symptomId)?.label || symptomId;
  };

  const getSymptomIcon = (symptomId: string) => {
    return PLANT_SYMPTOMS.find(s => s.id === symptomId)?.icon || '';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Select Symptoms</h3>
        <span className="text-xs text-muted-foreground">
          {selectedSymptoms.length} selected
        </span>
      </div>
      
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-between h-auto min-h-10 py-2 px-3",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className="text-sm text-muted-foreground">
              {selectedSymptoms.length === 0 
                ? "Tap to select symptoms you observe" 
                : `${selectedSymptoms.length} symptom${selectedSymptoms.length > 1 ? 's' : ''} selected`}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-64 overflow-y-auto bg-popover z-50"
          align="start"
        >
          {PLANT_SYMPTOMS.map((symptom) => (
            <DropdownMenuCheckboxItem
              key={symptom.id}
              checked={selectedSymptoms.includes(symptom.id)}
              onCheckedChange={() => toggleSymptom(symptom.id)}
              className="cursor-pointer"
            >
              <span className="mr-2">{symptom.icon}</span>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{symptom.label}</span>
                <span className="text-xs text-muted-foreground">{symptom.description}</span>
              </div>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Selected symptoms badges */}
      {selectedSymptoms.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedSymptoms.map((symptomId) => (
            <Badge
              key={symptomId}
              variant="secondary"
              className="flex items-center gap-1 px-2 py-1 text-xs"
            >
              <span>{getSymptomIcon(symptomId)}</span>
              <span>{getSymptomLabel(symptomId)}</span>
              <button
                onClick={(e) => removeSymptom(symptomId, e)}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
