import { Gift, Truck, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface FreeProduct {
  id: string;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
  isFreeItem: boolean;
}

interface AppliedOffer {
  id: string;
  name: string;
  description: string;
  type: 'free_shipping' | 'free_product';
  freeProduct?: FreeProduct;
}

interface AppliedOffersDisplayProps {
  appliedOffers: AppliedOffer[];
  showDetails?: boolean;
  className?: string;
}

export const AppliedOffersDisplay = ({ 
  appliedOffers, 
  showDetails = false,
  className = '' 
}: AppliedOffersDisplayProps) => {
  if (appliedOffers.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {appliedOffers.map((offer) => (
        <div key={offer.id}>
          {showDetails ? (
            <Card className="p-3 border-primary/20 bg-primary/5">
              <div className="flex items-start gap-3">
                {offer.type === 'free_shipping' ? (
                  <Truck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                ) : (
                  <Gift className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{offer.name}</span>
                    <Badge variant="secondary" className="text-xs bg-primary/20 text-primary">
                      Applied
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {offer.description}
                  </p>
                  {offer.freeProduct && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-background rounded">
                      <img 
                        src={offer.freeProduct.image_url || '/placeholder.svg'} 
                        alt={offer.freeProduct.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                      <div>
                        <p className="text-xs font-medium">{offer.freeProduct.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Qty: {offer.freeProduct.quantity} × <span className="line-through">₱{offer.freeProduct.price.toFixed(2)}</span>
                          <span className="text-primary ml-1">FREE</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ) : (
            <Badge 
              variant="secondary" 
              className="bg-primary/10 text-primary border-primary/20 flex items-center gap-1 w-fit"
            >
              {offer.type === 'free_shipping' ? (
                <Truck className="w-3 h-3" />
              ) : (
                <Gift className="w-3 h-3" />
              )}
              {offer.name}
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
};

interface OfferProgressDisplayProps {
  progress: { rule: { name: string; min_quantity: number; rule_type: string }; remaining: number; progress: number }[];
  className?: string;
}

export const OfferProgressDisplay = ({ progress, className = '' }: OfferProgressDisplayProps) => {
  if (progress.length === 0) return null;

  const nextOffer = progress[0];

  return (
    <div className={`p-3 bg-muted/50 rounded-lg border border-dashed border-muted-foreground/30 ${className}`}>
      <div className="flex items-center gap-2 text-sm">
        <Tag className="w-4 h-4 text-muted-foreground" />
        <span className="text-muted-foreground">
          Add <span className="font-bold text-foreground">{nextOffer.remaining}</span> more item{nextOffer.remaining > 1 ? 's' : ''} to unlock:
        </span>
      </div>
      <p className="text-sm font-medium mt-1 text-primary">{nextOffer.rule.name}</p>
      <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${Math.min(nextOffer.progress, 100)}%` }}
        />
      </div>
    </div>
  );
};
