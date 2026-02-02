import { Badge } from '@/components/ui/badge';
import { CheckCircle, Leaf, Droplets, Lightbulb } from 'lucide-react';

export interface NutrientAnalysis {
  nutrient: string;
  confidence: number;
  deficiency_level: 'mild' | 'moderate' | 'severe';
  description: string;
  symptoms_matched: string[];
  foliar_products: FoliarProduct[];
  application_tips: string[];
}

export interface FoliarProduct {
  name: string;
  type: string;
  description: string;
  dosage: string;
  frequency: string;
}

interface NutrientDeficiencyResultsProps {
  analysis: NutrientAnalysis;
}

export function NutrientDeficiencyResults({ analysis }: NutrientDeficiencyResultsProps) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-success";
    if (confidence >= 60) return "text-warning";
    return "text-muted-foreground";
  };

  const getConfidenceBgColor = (confidence: number) => {
    if (confidence >= 80) return "bg-success";
    if (confidence >= 60) return "bg-warning";
    return "bg-muted-foreground";
  };

  const getSeverityColor = (level: string) => {
    switch (level) {
      case 'mild': return 'bg-success/10 text-success border-success/20';
      case 'moderate': return 'bg-warning/10 text-warning border-warning/20';
      case 'severe': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Result Card */}
      <div className="p-4 bg-muted/50 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">{analysis.nutrient} Deficiency</h3>
          </div>
          <Badge variant="secondary" className={`${getConfidenceColor(analysis.confidence)} font-medium`}>
            {analysis.confidence.toFixed(0)}%
          </Badge>
        </div>
        
        <div className="w-full bg-muted rounded-full h-2 mb-3">
          <div 
            className={`${getConfidenceBgColor(analysis.confidence)} h-2 rounded-full transition-all duration-500`} 
            style={{ width: `${analysis.confidence}%` }} 
          />
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-muted-foreground">Severity:</span>
          <Badge variant="outline" className={getSeverityColor(analysis.deficiency_level)}>
            {analysis.deficiency_level.charAt(0).toUpperCase() + analysis.deficiency_level.slice(1)}
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground">{analysis.description}</p>
      </div>

      {/* Matched Symptoms */}
      {analysis.symptoms_matched.length > 0 && (
        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
          <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-primary" />
            Symptoms Matched
          </h4>
          <div className="flex flex-wrap gap-2">
            {analysis.symptoms_matched.map((symptom, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {symptom}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Foliar Fertilizers */}
      {analysis.foliar_products.length > 0 && (
        <div className="p-4 bg-success/5 rounded-xl border border-success/10">
          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <Droplets className="w-4 h-4 text-success" />
            Recommended Foliar Fertilizers
          </h4>
          <div className="space-y-3">
            {analysis.foliar_products.map((product, idx) => (
              <div key={idx} className="p-3 bg-background rounded-lg border border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-foreground">{product.name}</span>
                  <Badge variant="outline" className="text-[10px]">{product.type}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{product.description}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Dosage:</span>
                    <span className="ml-1 font-medium text-foreground">{product.dosage}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Frequency:</span>
                    <span className="ml-1 font-medium text-foreground">{product.frequency}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Application Tips */}
      {analysis.application_tips.length > 0 && (
        <div className="p-4 bg-warning/5 rounded-xl border border-warning/10">
          <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-warning" />
            Application Tips
          </h4>
          <ul className="space-y-2">
            {analysis.application_tips.map((tip, idx) => (
              <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 flex-shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
