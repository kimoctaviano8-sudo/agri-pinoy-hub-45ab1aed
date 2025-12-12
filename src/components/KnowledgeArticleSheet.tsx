import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star, Clock, Eye, ExternalLink, Leaf, Droplets, Sprout, FlaskConical, CheckCircle } from "lucide-react";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  views: number;
  rating: number;
  author: string;
  date: string;
}

interface ArticleContent {
  description: string;
  benefits: string[];
  applicationStages: string[];
  usage: string;
  certification?: string;
  technology?: string;
}

interface KnowledgeArticleSheetProps {
  article: Article | null;
  open: boolean;
  onClose: () => void;
}

const articleContents: Record<string, ArticleContent> = {
  "1": {
    description: "HEROFOL DENSO EQUILIBRADO is a high-concentration NPK foliar fertilizer with micronutrients, balanced in nitrogen, phosphorus, and potassium. It provides the main chelated micronutrients necessary for the plant. Recommended to complement and improve growth, flowering, and fruiting stages.",
    benefits: [
      "Balanced NPK nutrition for all growth stages",
      "Chelated micronutrients for better absorption",
      "XR47 activator increases photosynthesis",
      "Improves crop productive capacity",
      "High-quality raw materials formulation",
      "Special adjuvants for enhanced foliar efficiency"
    ],
    applicationStages: ["Rooting", "Vegetative Development", "Pre-flowering / Fruit Set", "Fruiting", "Ripening"],
    usage: "Apply via foliar spray at 250-500 ml/hl. Recommended for stone fruits, pome fruits, fruit vegetables, leafy vegetables, olive groves, vineyards, and berries.",
    technology: "Enriched with XR47 activator - a unique photosynthesis enhancer patented by Herogra Especiales"
  },
  "2": {
    description: "HEROFOL DENSO VERDE is an NPK gel fertilizer with high nitrogen concentration and chelated micronutrients, specially designed to enhance vegetative development, flowering, fruiting, and fruit enlargement. Its unique market formulation includes foliar and root absorption promoters plus special coadjuvants ensuring maximum nutritional efficacy.",
    benefits: [
      "High nitrogen content for vegetative growth",
      "Gel formulation for better adhesion",
      "Promotes flowering and fruit set",
      "Low chloride content",
      "Present in 56+ countries worldwide",
      "Patented Herofol Denso technology"
    ],
    applicationStages: ["Vegetative Development / Sprouting", "Pre-flowering / Fruit Set", "Fruiting", "Fruit Enlargement"],
    usage: "Apply via foliar spray at 200-400 ml/hl during vegetative growth phases. Suitable for all crop types requiring nitrogen boost.",
    technology: "Features the exclusive XR47 activator designed to enhance photosynthesis and crop yield"
  },
  "3": {
    description: "HEROFOL DENSO AMINO-K ECO is a liquid fertilizer product with high concentration of easily assimilated potassium and natural plant amino acids. Application is recommended during the fruiting stage, promoting phloematic translocation of sugars from photosynthetic organs to fruits.",
    benefits: [
      "High potassium for fruit quality",
      "Natural plant amino acids",
      "Promotes sugar translocation to fruits",
      "Activates plant metabolism",
      "Rapid dissolution and high penetrating power",
      "Certified for Organic Agriculture (CAAE)"
    ],
    applicationStages: ["Fruit Set", "Fruiting", "Ripening"],
    usage: "Apply via foliar spray at 300-500 ml/hl during fruiting and ripening stages. Ideal for improving fruit size, color, and sugar content.",
    certification: "Certified for Organic Agriculture (CAAE)",
    technology: "Mixed formulation with potassium and natural organic stimulants promotes rapid and efficient potassium mobilization"
  },
  "4": {
    description: "HEROFOL DENSO Ca-Mg is an advanced foliar fertilizer in suspension form with specific adjuvants aimed at optimizing foliar nutrient absorption. It presents high concentration of nitrogen, complexed calcium and magnesium, plus chelated micronutrients and a photosynthesis activator that enhances the product's nutritional effect.",
    benefits: [
      "Prevents and controls calcium/magnesium deficiencies",
      "Stimulates vegetative growth from early stages",
      "Specific adjuvants for optimal absorption",
      "Chelated micronutrients included",
      "Favors correct crop development",
      "XR47 photosynthesis activator"
    ],
    applicationStages: ["Vegetative Development / Sprouting", "Pre-flowering / Fruit Set", "Fruiting", "Ripening"],
    usage: "Apply via foliar spray at 250-500 ml/hl. Recommended for olive groves, fruit trees, citrus, vegetables, and vineyards.",
    technology: "Enriched with XR47 activator capable of increasing photosynthesis and productive capacity"
  },
  "5": {
    description: "TOTEM is a next-generation BIOSTIMULANT product based on Orygin 2.0 technology, developed from an exclusive fermentation process of the extremophile microorganism Bacillus Velezensis HE05, which naturally develops unique high-activity metabolites for the plant.",
    benefits: [
      "Promotes beneficial soil microbiota development",
      "Improves nutrient availability through PGPR activity",
      "Natural rooting capacity enhancement",
      "Regenerates existing root system",
      "Maximizes nutrient and water assimilation",
      "Extends crop life cycle by reducing ethylene",
      "Advances harvest start and increases productivity"
    ],
    applicationStages: ["Rooting", "Vegetative Development", "Pre-flowering / Fruit Set", "Fruiting"],
    usage: "Apply via soil drench or foliar spray. Recommended for stone fruits, pome fruits, fruit vegetables, leafy vegetables, vineyards, and berries.",
    certification: "Certified for Organic Agriculture (CAAE)",
    technology: "Orygin 2.0 technology with Bacillus Velezensis HE05 fermentation for dual soil and plant effects"
  },
  "6": {
    description: "HEROMAR is a powerful biostimulant and natural plant metabolism regulator based on Ascophyllum nodosum seaweed. Thanks to this, it provides a prolonged biostimulant effect, permanently improving crop condition when applied regularly.",
    benefits: [
      "Greater root and vegetative development",
      "Optimal plant vigor",
      "Better fruit quality and yield",
      "Greater tolerance to stress conditions",
      "Rich in polysaccharides and amino acids",
      "Contains vitamins and antioxidants",
      "Optimal complement to mineral fertilization"
    ],
    applicationStages: ["Rooting", "Vegetative Development / Sprouting", "Pre-flowering / Fruit Set", "Fruiting", "Ripening"],
    usage: "Apply via foliar spray at 200-400 ml/hl throughout the crop cycle. Suitable for all crop types.",
    certification: "Certified for Organic Agriculture (CAAE)",
    technology: "Based on Ascophyllum nodosum seaweed extract with essential plant growth promoters"
  },
  "7": {
    description: "AMINOFULVAT is an NK fertilizer with high biostimulant capacity that enhances root and vegetative plant development throughout all growth stages. Obtained from natural raw materials, it presents high content of beneficial components for both soil and crop, such as fulvic acids, amino acids, sugars, and betaines.",
    benefits: [
      "Improves soil structure",
      "Releases blocked nutrients",
      "Increases biological activity",
      "Great biostimulant effect in stress conditions",
      "Favors nutrient assimilation and translocation",
      "Includes manganese, iron, and boron",
      "Essential for correct vegetative development"
    ],
    applicationStages: ["Rooting", "Vegetative Development / Sprouting", "Pre-flowering / Fruit Set", "Fruiting", "Ripening"],
    usage: "Apply via soil drench at 5-10 L/ha or foliar spray at 200-400 ml/hl. Effective in high-demand conditions.",
    certification: "Certified for Organic Agriculture (CAAE)",
    technology: "Combines fulvic acids, amino acids, and betaines for enhanced nutrient uptake under stress"
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "herofol-denso":
      return Droplets;
    case "bioestimulantes":
      return Sprout;
    case "correctores":
      return FlaskConical;
    default:
      return Leaf;
  }
};

const getCategoryName = (category: string) => {
  switch (category) {
    case "herofol-denso":
      return "Herofol Denso";
    case "bioestimulantes":
      return "Biostimulants";
    case "correctores":
      return "Correctors";
    default:
      return "Products";
  }
};

export const KnowledgeArticleSheet = ({ article, open, onClose }: KnowledgeArticleSheetProps) => {
  if (!article) return null;

  const content = articleContents[article.id];
  const CategoryIcon = getCategoryIcon(article.category);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] p-0">
        <ScrollArea className="h-full">
          <div className="p-4 pb-8">
            <SheetHeader className="text-left mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  <CategoryIcon className="w-3 h-3 mr-1" />
                  {getCategoryName(article.category)}
                </Badge>
                {content?.certification && (
                  <Badge className="text-xs bg-green-600 hover:bg-green-700">
                    ECO Certified
                  </Badge>
                )}
              </div>
              <SheetTitle className="text-xl leading-tight">{article.title}</SheetTitle>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  <span>{article.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{article.readTime}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>{article.views} views</span>
                </div>
              </div>
            </SheetHeader>

            {content && (
              <div className="space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Overview</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {content.description}
                  </p>
                </div>

                {/* Technology */}
                {content.technology && (
                  <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
                    <div className="flex items-start gap-2">
                      <Leaf className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <h4 className="text-xs font-semibold text-primary mb-1">Technology</h4>
                        <p className="text-xs text-muted-foreground">{content.technology}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Benefits */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Key Benefits</h3>
                  <div className="space-y-2">
                    {content.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        <span className="text-sm text-muted-foreground">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Application Stages */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Application Stages</h3>
                  <div className="flex flex-wrap gap-2">
                    {content.applicationStages.map((stage, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {stage}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Usage */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Usage & Dosage</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {content.usage}
                  </p>
                </div>

                {/* Certification */}
                {content.certification && (
                  <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">
                        {content.certification}
                      </span>
                    </div>
                  </div>
                )}

                {/* Author & Date */}
                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Published by <span className="font-medium">{article.author}</span> • {article.date}
                  </p>
                </div>

                {/* External Link */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open('https://herograespeciales.com/productos/', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visit Herogra Especiales
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
