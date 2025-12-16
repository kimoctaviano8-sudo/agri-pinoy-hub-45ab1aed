import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DiscountRule {
  id: string;
  name: string;
  description: string | null;
  rule_type: 'free_shipping' | 'free_product';
  min_quantity: number;
  free_product_id: string | null;
  free_product_quantity: number;
  active: boolean;
  priority: number;
}

interface FreeProduct {
  id: string;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
  isFreeItem: boolean;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
  category?: string;
  isFreeItem?: boolean;
}

interface AppliedOffer {
  id: string;
  name: string;
  description: string;
  type: 'free_shipping' | 'free_product';
  freeProduct?: FreeProduct;
}

interface OffersResult {
  appliedOffers: AppliedOffer[];
  hasFreeShipping: boolean;
  freeProducts: FreeProduct[];
  originalShippingFee: number;
  finalShippingFee: number;
  loading: boolean;
  discountRules: DiscountRule[];
}

export const useOffers = (cartItems: CartItem[]): OffersResult => {
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [freeProductDetails, setFreeProductDetails] = useState<Record<string, any>>({});

  const originalShippingFee = 50;

  useEffect(() => {
    const fetchDiscountRules = async () => {
      try {
        const { data, error } = await supabase
          .from('discount_rules')
          .select('*')
          .eq('active', true)
          .order('priority', { ascending: false });

        if (error) throw error;
        
        // Type cast the data
        const rules = (data || []) as DiscountRule[];
        setDiscountRules(rules);

        // Fetch free product details for rules that have free_product_id
        const productIds = rules
          .filter(r => r.rule_type === 'free_product' && r.free_product_id)
          .map(r => r.free_product_id as string);

        if (productIds.length > 0) {
          const { data: products } = await supabase
            .from('products')
            .select('id, name, price, image_url')
            .in('id', productIds);

          if (products) {
            const productMap: Record<string, any> = {};
            products.forEach(p => {
              productMap[p.id] = p;
            });
            setFreeProductDetails(productMap);
          }
        }
      } catch (error) {
        console.error('Error fetching discount rules:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDiscountRules();
  }, []);

  const result = useMemo(() => {
    // Calculate total quantity (excluding free items)
    const totalQuantity = cartItems
      .filter(item => !item.isFreeItem)
      .reduce((sum, item) => sum + item.quantity, 0);

    const appliedOffers: AppliedOffer[] = [];
    const freeProducts: FreeProduct[] = [];
    let hasFreeShipping = false;

    // Check each active rule
    for (const rule of discountRules) {
      if (totalQuantity >= rule.min_quantity) {
        if (rule.rule_type === 'free_shipping') {
          hasFreeShipping = true;
          appliedOffers.push({
            id: rule.id,
            name: rule.name,
            description: rule.description || `Buy ${rule.min_quantity}+ items for free shipping`,
            type: 'free_shipping'
          });
        } else if (rule.rule_type === 'free_product' && rule.free_product_id) {
          const product = freeProductDetails[rule.free_product_id];
          if (product) {
            const freeProduct: FreeProduct = {
              id: product.id,
              name: product.name,
              price: product.price,
              image_url: product.image_url,
              quantity: rule.free_product_quantity || 1,
              isFreeItem: true
            };
            freeProducts.push(freeProduct);
            appliedOffers.push({
              id: rule.id,
              name: rule.name,
              description: rule.description || `Buy ${rule.min_quantity}+ items and get ${product.name} free!`,
              type: 'free_product',
              freeProduct
            });
          }
        }
      }
    }

    return {
      appliedOffers,
      hasFreeShipping,
      freeProducts,
      originalShippingFee,
      finalShippingFee: hasFreeShipping ? 0 : originalShippingFee,
      loading,
      discountRules
    };
  }, [cartItems, discountRules, freeProductDetails, loading]);

  return result;
};

// Helper function to check if an offer is close to being unlocked
export const getOfferProgress = (
  totalQuantity: number,
  rules: DiscountRule[]
): { rule: DiscountRule; remaining: number; progress: number }[] => {
  return rules
    .filter(rule => totalQuantity < rule.min_quantity)
    .map(rule => ({
      rule,
      remaining: rule.min_quantity - totalQuantity,
      progress: (totalQuantity / rule.min_quantity) * 100
    }))
    .sort((a, b) => a.remaining - b.remaining);
};
