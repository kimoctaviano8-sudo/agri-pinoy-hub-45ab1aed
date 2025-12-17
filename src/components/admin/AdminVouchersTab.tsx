import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Calendar as CalendarIcon, Tag, TrendingUp, Percent, Gift, Truck, Save, Edit2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AdminDiscountRulesTab } from "./AdminDiscountRulesTab";

interface Fee {
  id: string;
  fee_type: string;
  fee_name: string;
  fee_value: number;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface Voucher {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_purchase: number;
  max_discount?: number;
  usage_limit?: number;
  used_count: number;
  valid_from?: string;
  expires_at?: string;
  active: boolean;
  created_at: string;
}

interface MonthlySale {
  id: string;
  event_name: string;
  event_code: string;
  discount_percentage: number;
  valid_date_start: string;
  valid_date_end: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const AdminVouchersTab = () => {
  const { toast } = useToast();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [monthlySales, setMonthlySales] = useState<MonthlySale[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingSale, setEditingSale] = useState<string | null>(null);
  const [editingFee, setEditingFee] = useState<string | null>(null);
  const [savingFee, setSavingFee] = useState(false);

  // New voucher form state
  const [newVoucher, setNewVoucher] = useState({
    code: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: 0,
    min_purchase: 0,
    max_discount: undefined as number | undefined,
    usage_limit: undefined as number | undefined,
    valid_from_date: undefined as Date | undefined,
    valid_from_time: "00:00",
    expires_at_date: undefined as Date | undefined,
    expires_at_time: "23:59",
  });

  useEffect(() => {
    fetchVouchers();
    fetchMonthlySales();
    fetchFees();
  }, []);

  const fetchVouchers = async () => {
    try {
      const { data, error } = await supabase
        .from("vouchers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVouchers((data as Voucher[]) || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlySales = async () => {
    try {
      const { data, error } = await supabase
        .from("monthly_sales")
        .select("*");

      if (error) throw error;
      
      // Sort by month order (1.1, 2.2, 3.3... 12.12)
      const sorted = (data as MonthlySale[])?.sort((a, b) => {
        const monthA = parseFloat(a.event_code.split('.')[0]);
        const monthB = parseFloat(b.event_code.split('.')[0]);
        return monthA - monthB;
      }) || [];
      
      setMonthlySales(sorted);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchFees = async () => {
    try {
      const { data, error } = await supabase
        .from("fees")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setFees((data as Fee[]) || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateFee = async (id: string, updates: Partial<Fee>) => {
    setSavingFee(true);
    try {
      const { error } = await supabase
        .from("fees")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Fee updated successfully",
      });

      fetchFees();
      setEditingFee(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingFee(false);
    }
  };

  const handleAddVoucher = async () => {
    if (!newVoucher.code || newVoucher.discount_value <= 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setAdding(true);
    try {
      // Combine date and time for valid_from
      let validFrom: string | undefined;
      if (newVoucher.valid_from_date) {
        const [hours, minutes] = newVoucher.valid_from_time.split(':');
        const combinedDate = new Date(newVoucher.valid_from_date);
        combinedDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        validFrom = combinedDate.toISOString();
      }

      // Combine date and time for expires_at
      let expiresAt: string | undefined;
      if (newVoucher.expires_at_date) {
        const [hours, minutes] = newVoucher.expires_at_time.split(':');
        const combinedDate = new Date(newVoucher.expires_at_date);
        combinedDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        expiresAt = combinedDate.toISOString();
      }

      const { error } = await supabase.from("vouchers").insert({
        code: newVoucher.code.toUpperCase(),
        discount_type: newVoucher.discount_type,
        discount_value: newVoucher.discount_value,
        min_purchase: newVoucher.min_purchase,
        max_discount: newVoucher.max_discount,
        usage_limit: newVoucher.usage_limit,
        valid_from: validFrom,
        expires_at: expiresAt,
        active: true,
        used_count: 0,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Voucher created successfully",
      });

      setNewVoucher({
        code: "",
        discount_type: "percentage",
        discount_value: 0,
        min_purchase: 0,
        max_discount: undefined,
        usage_limit: undefined,
        valid_from_date: undefined,
        valid_from_time: "00:00",
        expires_at_date: undefined,
        expires_at_time: "23:59",
      });

      fetchVouchers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("vouchers")
        .update({ active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Voucher ${!currentStatus ? "activated" : "deactivated"}`,
      });

      fetchVouchers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this voucher?")) return;

    try {
      const { error } = await supabase.from("vouchers").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Voucher deleted successfully",
      });

      fetchVouchers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateMonthlySale = async (
    id: string,
    updates: Partial<MonthlySale>
  ) => {
    try {
      const { error } = await supabase
        .from("monthly_sales")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Monthly sale updated successfully",
      });

      fetchMonthlySales();
      setEditingSale(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleMonthlySaleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("monthly_sales")
        .update({ active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Monthly sale ${!currentStatus ? "activated" : "deactivated"}`,
      });

      fetchMonthlySales();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getDiscountDisplay = (voucher: Voucher) => {
    if (voucher.discount_type === "percentage") {
      return `${voucher.discount_value}%${
        voucher.max_discount ? ` (max ₱${voucher.max_discount})` : ""
      }`;
    }
    return `₱${voucher.discount_value}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="voucher-code" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="voucher-code" className="text-xs sm:text-sm">
            <Tag className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Voucher Code</span>
            <span className="sm:hidden">Codes</span>
          </TabsTrigger>
          <TabsTrigger value="monthly-sale" className="text-xs sm:text-sm">
            <TrendingUp className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Monthly Sale</span>
            <span className="sm:hidden">Sales</span>
          </TabsTrigger>
          <TabsTrigger value="discounts" className="text-xs sm:text-sm">
            <Percent className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Discounts</span>
            <span className="sm:hidden">Offers</span>
          </TabsTrigger>
          <TabsTrigger value="fees" className="text-xs sm:text-sm">
            <Truck className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Fees</span>
            <span className="sm:hidden">Fees</span>
          </TabsTrigger>
        </TabsList>

        {/* Voucher Code Module */}
        <TabsContent value="voucher-code" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg sm:text-xl">Create New Voucher</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Add a new voucher code for customers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm">Voucher Code</Label>
                  <Input
                    id="code"
                    placeholder="e.g., SUMMER2025"
                    value={newVoucher.code}
                    onChange={(e) =>
                      setNewVoucher({ ...newVoucher, code: e.target.value })
                    }
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount-type" className="text-sm">Discount Type</Label>
                  <Select
                    value={newVoucher.discount_type}
                    onValueChange={(value: "percentage" | "fixed") =>
                      setNewVoucher({ ...newVoucher, discount_type: value })
                    }
                  >
                    <SelectTrigger id="discount-type" className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount-value" className="text-sm">
                    Discount Value
                  </Label>
                  <Input
                    id="discount-value"
                    type="number"
                    placeholder={newVoucher.discount_type === "percentage" ? "e.g., 20" : "e.g., 100"}
                    value={newVoucher.discount_value || ""}
                    onChange={(e) =>
                      setNewVoucher({
                        ...newVoucher,
                        discount_value: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min-purchase" className="text-sm">
                    Min. Purchase (₱)
                  </Label>
                  <Input
                    id="min-purchase"
                    type="number"
                    placeholder="e.g., 500"
                    value={newVoucher.min_purchase || ""}
                    onChange={(e) =>
                      setNewVoucher({
                        ...newVoucher,
                        min_purchase: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="text-sm"
                  />
                </div>

                {newVoucher.discount_type === "percentage" && (
                  <div className="space-y-2">
                    <Label htmlFor="max-discount" className="text-sm">
                      Max Discount (₱) - Optional
                    </Label>
                    <Input
                      id="max-discount"
                      type="number"
                      placeholder="e.g., 500"
                      value={newVoucher.max_discount || ""}
                      onChange={(e) =>
                        setNewVoucher({
                          ...newVoucher,
                          max_discount: e.target.value
                            ? parseFloat(e.target.value)
                            : undefined,
                        })
                      }
                      className="text-sm"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="usage-limit" className="text-sm">
                    Usage Limit - Optional
                  </Label>
                  <Input
                    id="usage-limit"
                    type="number"
                    placeholder="e.g., 100"
                    value={newVoucher.usage_limit || ""}
                    onChange={(e) =>
                      setNewVoucher({
                        ...newVoucher,
                        usage_limit: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                    className="text-sm"
                  />
                </div>

                {/* Start Date & Time */}
                <div className="space-y-2">
                  <Label className="text-sm">Valid From - Optional</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal text-sm",
                          !newVoucher.valid_from_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newVoucher.valid_from_date ? (
                          format(newVoucher.valid_from_date, "PPP")
                        ) : (
                          <span>Pick start date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newVoucher.valid_from_date}
                        onSelect={(date) =>
                          setNewVoucher({ ...newVoucher, valid_from_date: date })
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {newVoucher.valid_from_date && (
                    <Input
                      type="time"
                      value={newVoucher.valid_from_time}
                      onChange={(e) =>
                        setNewVoucher({ ...newVoucher, valid_from_time: e.target.value })
                      }
                      className="text-sm"
                    />
                  )}
                </div>

                {/* End Date & Time */}
                <div className="space-y-2">
                  <Label className="text-sm">Expires At - Optional</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal text-sm",
                          !newVoucher.expires_at_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newVoucher.expires_at_date ? (
                          format(newVoucher.expires_at_date, "PPP")
                        ) : (
                          <span>Pick end date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newVoucher.expires_at_date}
                        onSelect={(date) =>
                          setNewVoucher({ ...newVoucher, expires_at_date: date })
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {newVoucher.expires_at_date && (
                    <Input
                      type="time"
                      value={newVoucher.expires_at_time}
                      onChange={(e) =>
                        setNewVoucher({ ...newVoucher, expires_at_time: e.target.value })
                      }
                      className="text-sm"
                    />
                  )}
                </div>
              </div>

              <Button
                onClick={handleAddVoucher}
                disabled={adding}
                className="w-full sm:w-auto"
                size="lg"
              >
                {adding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Voucher
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Existing Vouchers List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg sm:text-xl">Active Vouchers</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {vouchers.length} voucher(s) created
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vouchers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No vouchers created yet
                  </p>
                ) : (
                  vouchers.map((voucher) => (
                    <div
                      key={voucher.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-lg bg-card"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-sm sm:text-base font-semibold bg-muted px-2 py-1 rounded">
                            {voucher.code}
                          </code>
                          <Badge
                            variant={voucher.active ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {voucher.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground space-y-0.5">
                          <p>Discount: {getDiscountDisplay(voucher)}</p>
                          <p>Min Purchase: ₱{voucher.min_purchase}</p>
                          {voucher.usage_limit && (
                            <p>
                              Used: {voucher.used_count} / {voucher.usage_limit}
                            </p>
                          )}
                          {voucher.valid_from && (
                            <p>
                              Valid From: {format(new Date(voucher.valid_from), "PPP 'at' p")}
                            </p>
                          )}
                          {voucher.expires_at && (
                            <p>
                              Expires: {format(new Date(voucher.expires_at), "PPP 'at' p")}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant={voucher.active ? "outline" : "default"}
                          size="sm"
                          onClick={() => handleToggleActive(voucher.id, voucher.active)}
                          className="text-xs flex-1 sm:flex-none"
                        >
                          {voucher.active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(voucher.id)}
                          className="text-xs"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Sale Module */}
        <TabsContent value="monthly-sale" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg sm:text-xl">Monthly Sales Campaign</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Manage automatic monthly sale events (1.1, 2.2, 3.3... 12.12)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {monthlySales.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No monthly sales available
                  </p>
                ) : (
                  monthlySales.map((sale) => (
                    <div
                      key={sale.id}
                      className="border rounded-lg p-4 space-y-3 bg-card"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <code className="text-sm sm:text-base font-semibold bg-muted px-2 py-1 rounded">
                            {sale.event_code}
                          </code>
                          <span className="text-sm sm:text-base font-medium">
                            {sale.event_name}
                          </span>
                        </div>
                        <Badge
                          variant={sale.active ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {sale.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      {editingSale === sale.id ? (
                        <div className="space-y-3 pt-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor={`discount-${sale.id}`} className="text-sm">
                                Discount Percentage (%)
                              </Label>
                              <Input
                                id={`discount-${sale.id}`}
                                type="number"
                                defaultValue={sale.discount_percentage}
                                min="0"
                                max="100"
                                className="text-sm"
                                onBlur={(e) => {
                                  const value = parseFloat(e.target.value);
                                  if (value !== sale.discount_percentage) {
                                    handleUpdateMonthlySale(sale.id, {
                                      discount_percentage: value,
                                    });
                                  }
                                }}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`start-${sale.id}`} className="text-sm">
                                Start Date & Time
                              </Label>
                              <Input
                                id={`start-${sale.id}`}
                                type="datetime-local"
                                defaultValue={format(
                                  new Date(sale.valid_date_start),
                                  "yyyy-MM-dd'T'HH:mm"
                                )}
                                className="text-sm"
                                onBlur={(e) => {
                                  const value = new Date(e.target.value).toISOString();
                                  if (value !== sale.valid_date_start) {
                                    handleUpdateMonthlySale(sale.id, {
                                      valid_date_start: value,
                                    });
                                  }
                                }}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`end-${sale.id}`} className="text-sm">
                                End Date & Time
                              </Label>
                              <Input
                                id={`end-${sale.id}`}
                                type="datetime-local"
                                defaultValue={format(
                                  new Date(sale.valid_date_end),
                                  "yyyy-MM-dd'T'HH:mm"
                                )}
                                className="text-sm"
                                onBlur={(e) => {
                                  const value = new Date(e.target.value).toISOString();
                                  if (value !== sale.valid_date_end) {
                                    handleUpdateMonthlySale(sale.id, {
                                      valid_date_end: value,
                                    });
                                  }
                                }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingSale(null)}
                              className="text-xs"
                            >
                              Done Editing
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                          <p>Discount: {sale.discount_percentage}%</p>
                          <p>
                            Start: {format(new Date(sale.valid_date_start), "PPP p")}
                          </p>
                          <p>
                            End: {format(new Date(sale.valid_date_end), "PPP p")}
                          </p>
                          <p>
                            Duration:{" "}
                            {Math.ceil(
                              (new Date(sale.valid_date_end).getTime() -
                                new Date(sale.valid_date_start).getTime()) /
                                (1000 * 60 * 60)
                            )}{" "}
                            hours
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          variant={sale.active ? "outline" : "default"}
                          size="sm"
                          onClick={() =>
                            handleToggleMonthlySaleActive(sale.id, sale.active)
                          }
                          className="text-xs flex-1 sm:flex-none"
                        >
                          {sale.active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setEditingSale(editingSale === sale.id ? null : sale.id)
                          }
                          className="text-xs flex-1 sm:flex-none"
                        >
                          {editingSale === sale.id ? "Cancel" : "Edit Details"}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Discounts Module */}
        <TabsContent value="discounts" className="space-y-4">
          <AdminDiscountRulesTab />
        </TabsContent>

        {/* Fees Module */}
        <TabsContent value="fees" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Shipping & Fees Management
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Configure shipping fees and other charges for orders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fees.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No fees configured</p>
              ) : (
                <div className="space-y-4">
                  {fees.map((fee) => (
                    <Card key={fee.id} className={cn(
                      "border",
                      fee.active ? "border-primary/20" : "border-muted opacity-60"
                    )}>
                      <CardContent className="pt-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Truck className="w-4 h-4 text-primary" />
                              <h4 className="font-semibold">{fee.fee_name}</h4>
                              <Badge variant={fee.active ? "default" : "secondary"}>
                                {fee.active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            {fee.description && (
                              <p className="text-sm text-muted-foreground">{fee.description}</p>
                            )}
                            
                            {editingFee === fee.id ? (
                              <div className="space-y-3 mt-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Fee Name</Label>
                                    <Input
                                      defaultValue={fee.fee_name}
                                      onChange={(e) => {
                                        const updatedFees = fees.map(f => 
                                          f.id === fee.id ? { ...f, fee_name: e.target.value } : f
                                        );
                                        setFees(updatedFees);
                                      }}
                                      className="text-sm"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Fee Amount (₱)</Label>
                                    <Input
                                      type="number"
                                      defaultValue={fee.fee_value}
                                      onChange={(e) => {
                                        const updatedFees = fees.map(f => 
                                          f.id === fee.id ? { ...f, fee_value: parseFloat(e.target.value) || 0 } : f
                                        );
                                        setFees(updatedFees);
                                      }}
                                      className="text-sm"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Description</Label>
                                  <Input
                                    defaultValue={fee.description || ""}
                                    onChange={(e) => {
                                      const updatedFees = fees.map(f => 
                                        f.id === fee.id ? { ...f, description: e.target.value } : f
                                      );
                                      setFees(updatedFees);
                                    }}
                                    placeholder="Optional description"
                                    className="text-sm"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      const currentFee = fees.find(f => f.id === fee.id);
                                      if (currentFee) {
                                        handleUpdateFee(fee.id, {
                                          fee_name: currentFee.fee_name,
                                          fee_value: currentFee.fee_value,
                                          description: currentFee.description,
                                        });
                                      }
                                    }}
                                    disabled={savingFee}
                                  >
                                    {savingFee ? (
                                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                                    ) : (
                                      <Save className="w-4 h-4 mr-1" />
                                    )}
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingFee(null);
                                      fetchFees(); // Reset to original values
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-2xl font-bold text-primary">₱{fee.fee_value.toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                          
                          {editingFee !== fee.id && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingFee(fee.id)}
                              >
                                <Edit2 className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant={fee.active ? "secondary" : "default"}
                                onClick={() => handleUpdateFee(fee.id, { active: !fee.active })}
                              >
                                {fee.active ? "Deactivate" : "Activate"}
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
