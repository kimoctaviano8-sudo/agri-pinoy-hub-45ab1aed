import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, MapPin, Phone, Clock, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Dealer {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  region: string;
  phone: string;
  hours: string;
  latitude: number | null;
  longitude: number | null;
  active: boolean;
  created_at: string;
}

const emptyDealer = {
  name: "",
  address: "",
  city: "",
  province: "",
  region: "",
  phone: "",
  hours: "Mon-Sat: 8AM-5PM",
  latitude: "",
  longitude: "",
  active: true,
};

export const AdminDealersTab = () => {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingDealer, setEditingDealer] = useState<Dealer | null>(null);
  const [deletingDealer, setDeletingDealer] = useState<Dealer | null>(null);
  const [form, setForm] = useState(emptyDealer);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchDealers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("dealers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to load dealers.", variant: "destructive" });
    } else {
      setDealers(data || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchDealers();
  }, [fetchDealers]);

  const openAddDialog = () => {
    setEditingDealer(null);
    setForm(emptyDealer);
    setDialogOpen(true);
  };

  const openEditDialog = (dealer: Dealer) => {
    setEditingDealer(dealer);
    setForm({
      name: dealer.name,
      address: dealer.address,
      city: dealer.city,
      province: dealer.province,
      region: dealer.region,
      phone: dealer.phone,
      hours: dealer.hours,
      latitude: dealer.latitude?.toString() || "",
      longitude: dealer.longitude?.toString() || "",
      active: dealer.active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.address.trim() || !form.city.trim() || !form.province.trim() || !form.region.trim() || !form.phone.trim()) {
      toast({ title: "Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      province: form.province.trim(),
      region: form.region.trim(),
      phone: form.phone.trim(),
      hours: form.hours.trim(),
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      active: form.active,
    };

    if (editingDealer) {
      const { error } = await supabase.from("dealers").update(payload).eq("id", editingDealer.id);
      if (error) {
        toast({ title: "Error", description: "Failed to update dealer.", variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Dealer updated successfully." });
        setDialogOpen(false);
        fetchDealers();
      }
    } else {
      const { error } = await supabase.from("dealers").insert(payload);
      if (error) {
        toast({ title: "Error", description: "Failed to add dealer.", variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Dealer added successfully." });
        setDialogOpen(false);
        fetchDealers();
      }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deletingDealer) return;
    const { error } = await supabase.from("dealers").delete().eq("id", deletingDealer.id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete dealer.", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Dealer deleted successfully." });
      setDealers(dealers.filter((d) => d.id !== deletingDealer.id));
    }
    setDeleteDialogOpen(false);
    setDeletingDealer(null);
  };

  const toggleActive = async (dealer: Dealer) => {
    const { error } = await supabase.from("dealers").update({ active: !dealer.active }).eq("id", dealer.id);
    if (error) {
      toast({ title: "Error", description: "Failed to update dealer status.", variant: "destructive" });
    } else {
      setDealers(dealers.map((d) => (d.id === dealer.id ? { ...d, active: !d.active } : d)));
      toast({ title: "Success", description: `Dealer ${!dealer.active ? "activated" : "deactivated"}.` });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Registered Dealers ({dealers.length})</h2>
        <Button size="sm" onClick={openAddDialog}>
          <Plus className="w-4 h-4 mr-1" />
          Add Dealer
        </Button>
      </div>

      {dealers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No dealers yet. Add your first dealer.</p>
          </CardContent>
        </Card>
      ) : (
        dealers.map((dealer) => (
          <Card key={dealer.id} className={!dealer.active ? "opacity-60" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground truncate">{dealer.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={dealer.active ? "default" : "secondary"} className="text-[10px]">
                      {dealer.active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">{dealer.region}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Switch checked={dealer.active} onCheckedChange={() => toggleActive(dealer)} />
                </div>
              </div>

              <div className="space-y-1 text-xs text-muted-foreground mb-3">
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>{dealer.address}, {dealer.city}, {dealer.province}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3 flex-shrink-0" />
                  <span>{dealer.phone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span>{dealer.hours}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => openEditDialog(dealer)}>
                  <Pencil className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="text-xs"
                  onClick={() => {
                    setDeletingDealer(dealer);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDealer ? "Edit Dealer" : "Add New Dealer"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dealer name" />
            </div>
            <div>
              <Label className="text-xs">Address *</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street address" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">City *</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" />
              </div>
              <div>
                <Label className="text-xs">Province *</Label>
                <Input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} placeholder="Province" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Region *</Label>
              <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="e.g. Region IV-A (CALABARZON)" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Phone *</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" />
              </div>
              <div>
                <Label className="text-xs">Hours</Label>
                <Input value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} placeholder="Mon-Sat: 8AM-5PM" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Latitude</Label>
                <Input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="14.2820" />
              </div>
              <div>
                <Label className="text-xs">Longitude</Label>
                <Input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="121.4150" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(checked) => setForm({ ...form, active: checked })} />
              <Label className="text-xs">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingDealer ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Dealer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingDealer?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
