import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Gift, Truck, Edit2, Check, X } from 'lucide-react';

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
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  category: string | null;
  price: number;
}

export const AdminDiscountRulesTab = () => {
  const { toast } = useToast();
  const [rules, setRules] = useState<DiscountRule[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New rule form
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    rule_type: 'free_shipping' as 'free_shipping' | 'free_product',
    min_quantity: 3,
    free_product_id: '',
    free_product_quantity: 1,
    priority: 0
  });

  useEffect(() => {
    fetchRules();
    fetchProducts();
  }, []);

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from('discount_rules')
        .select('*')
        .order('priority', { ascending: false });

      if (error) throw error;
      setRules((data as DiscountRule[]) || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, category, price')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleCreateRule = async () => {
    if (!newRule.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a rule name',
        variant: 'destructive'
      });
      return;
    }

    if (newRule.rule_type === 'free_product' && !newRule.free_product_id) {
      toast({
        title: 'Validation Error',
        description: 'Please select a free product',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('discount_rules')
        .insert({
          name: newRule.name,
          description: newRule.description || null,
          rule_type: newRule.rule_type,
          min_quantity: newRule.min_quantity,
          free_product_id: newRule.rule_type === 'free_product' ? newRule.free_product_id : null,
          free_product_quantity: newRule.free_product_quantity,
          priority: newRule.priority,
          active: true
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Discount rule created successfully'
      });

      setNewRule({
        name: '',
        description: '',
        rule_type: 'free_shipping',
        min_quantity: 3,
        free_product_id: '',
        free_product_quantity: 1,
        priority: 0
      });

      fetchRules();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('discount_rules')
        .update({ active })
        .eq('id', id);

      if (error) throw error;

      setRules(rules.map(r => r.id === id ? { ...r, active } : r));
      toast({
        title: 'Success',
        description: `Rule ${active ? 'enabled' : 'disabled'}`
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      const { error } = await supabase
        .from('discount_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRules(rules.filter(r => r.id !== id));
      toast({
        title: 'Success',
        description: 'Rule deleted successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleUpdateRule = async (rule: DiscountRule) => {
    try {
      const { error } = await supabase
        .from('discount_rules')
        .update({
          name: rule.name,
          description: rule.description,
          min_quantity: rule.min_quantity,
          free_product_id: rule.free_product_id,
          free_product_quantity: rule.free_product_quantity,
          priority: rule.priority
        })
        .eq('id', rule.id);

      if (error) throw error;

      setEditingId(null);
      toast({
        title: 'Success',
        description: 'Rule updated successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getProductName = (productId: string | null) => {
    if (!productId) return 'N/A';
    const product = products.find(p => p.id === productId);
    return product?.name || 'Unknown Product';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create New Rule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Discount Rule
          </CardTitle>
          <CardDescription>
            Configure automatic discounts based on cart quantity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rule_name">Rule Name</Label>
              <Input
                id="rule_name"
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                placeholder="e.g., Buy 3 Get Free Shipping"
              />
            </div>
            <div>
              <Label htmlFor="rule_type">Rule Type</Label>
              <Select
                value={newRule.rule_type}
                onValueChange={(value: 'free_shipping' | 'free_product') => 
                  setNewRule({ ...newRule, rule_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free_shipping">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      Free Shipping
                    </div>
                  </SelectItem>
                  <SelectItem value="free_product">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4" />
                      Free Product
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={newRule.description}
              onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
              placeholder="Describe the offer to customers"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="min_quantity">Minimum Quantity</Label>
              <Input
                id="min_quantity"
                type="number"
                min={1}
                value={newRule.min_quantity}
                onChange={(e) => setNewRule({ ...newRule, min_quantity: parseInt(e.target.value) || 1 })}
              />
            </div>

            {newRule.rule_type === 'free_product' && (
              <>
                <div>
                  <Label htmlFor="free_product">Free Product</Label>
                  <Select
                    value={newRule.free_product_id}
                    onValueChange={(value) => setNewRule({ ...newRule, free_product_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} (₱{product.price})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="free_qty">Free Quantity</Label>
                  <Input
                    id="free_qty"
                    type="number"
                    min={1}
                    value={newRule.free_product_quantity}
                    onChange={(e) => setNewRule({ ...newRule, free_product_quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                type="number"
                value={newRule.priority}
                onChange={(e) => setNewRule({ ...newRule, priority: parseInt(e.target.value) || 0 })}
                placeholder="Higher = applied first"
              />
            </div>
          </div>

          <Button onClick={handleCreateRule} disabled={saving} className="w-full">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Rule
          </Button>
        </CardContent>
      </Card>

      {/* Existing Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Discount Rules</CardTitle>
          <CardDescription>
            {rules.length} rule{rules.length !== 1 ? 's' : ''} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No discount rules configured yet. Create one above to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-4 border rounded-lg ${rule.active ? 'border-primary/30 bg-primary/5' : 'border-muted bg-muted/20'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {rule.rule_type === 'free_shipping' ? (
                          <Truck className="w-4 h-4 text-primary" />
                        ) : (
                          <Gift className="w-4 h-4 text-primary" />
                        )}
                        <span className="font-medium">{rule.name}</span>
                        <Badge variant={rule.active ? 'default' : 'secondary'}>
                          {rule.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {rule.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {rule.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="outline">
                          Min: {rule.min_quantity} items
                        </Badge>
                        {rule.rule_type === 'free_product' && (
                          <Badge variant="outline">
                            Free: {getProductName(rule.free_product_id)} × {rule.free_product_quantity}
                          </Badge>
                        )}
                        <Badge variant="outline">
                          Priority: {rule.priority}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.active}
                        onCheckedChange={(checked) => handleToggleActive(rule.id, checked)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Presets</CardTitle>
          <CardDescription>
            Quickly add common discount rules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setNewRule({
              name: 'Buy 3 Get Free Shipping',
              description: 'Purchase 3 or more items to get free shipping',
              rule_type: 'free_shipping',
              min_quantity: 3,
              free_product_id: '',
              free_product_quantity: 1,
              priority: 1
            })}
          >
            <Truck className="w-4 h-4 mr-2" />
            Buy 3 = Free Shipping
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setNewRule({
              name: 'Buy 12 Get 1 Free Foliar',
              description: 'Purchase 12 items and get 1 foliar fertilizer free',
              rule_type: 'free_product',
              min_quantity: 12,
              free_product_id: '',
              free_product_quantity: 1,
              priority: 2
            })}
          >
            <Gift className="w-4 h-4 mr-2" />
            Buy 12 = Free Product
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
