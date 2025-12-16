import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Upload, Trash2, Plus, Pencil, X, Check, Image } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface CarouselItem {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  display_order: number;
  active: boolean;
}

export const AdminCarouselTab = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", subtitle: "", image: null as File | null });
  const [newItem, setNewItem] = useState({
    title: "",
    subtitle: "",
    image: null as File | null,
  });

  useEffect(() => {
    fetchCarouselItems();
  }, []);

  const fetchCarouselItems = async () => {
    try {
      const { data, error } = await supabase
        .from('promotional_carousel')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCarouselItems(data || []);
    } catch (error) {
      console.error('Error fetching carousel items:', error);
      toast({
        title: "Error",
        description: "Failed to load carousel items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `carousel/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('products')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleAddItem = async () => {
    if (!newItem.image) {
      toast({
        title: "Error",
        description: "Please select an image",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const imageUrl = await uploadImage(newItem.image);
      
      const maxOrder = carouselItems.length > 0 
        ? Math.max(...carouselItems.map(item => item.display_order))
        : 0;

      const { error } = await supabase
        .from('promotional_carousel')
        .insert({
          image_url: imageUrl,
          title: newItem.title || null,
          subtitle: newItem.subtitle || null,
          display_order: maxOrder + 1,
          active: true,
          created_by: user?.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Carousel item added successfully",
      });

      setNewItem({ title: "", subtitle: "", image: null });
      fetchCarouselItems();
    } catch (error) {
      console.error('Error adding carousel item:', error);
      toast({
        title: "Error",
        description: "Failed to add carousel item",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleStartEdit = (item: CarouselItem) => {
    setEditingId(item.id);
    setEditForm({
      title: item.title || "",
      subtitle: item.subtitle || "",
      image: null,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ title: "", subtitle: "", image: null });
  };

  const handleSaveEdit = async (item: CarouselItem) => {
    try {
      let imageUrl = item.image_url;
      
      // Upload new image if selected
      if (editForm.image) {
        imageUrl = await uploadImage(editForm.image);
      }

      const { error } = await supabase
        .from('promotional_carousel')
        .update({
          title: editForm.title || null,
          subtitle: editForm.subtitle || null,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Carousel item updated successfully",
      });

      setEditingId(null);
      setEditForm({ title: "", subtitle: "", image: null });
      fetchCarouselItems();
    } catch (error) {
      console.error('Error updating carousel item:', error);
      toast({
        title: "Error",
        description: "Failed to update carousel item",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('promotional_carousel')
        .update({ active: !active })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Carousel item ${!active ? 'enabled' : 'disabled'}`,
      });

      fetchCarouselItems();
    } catch (error) {
      console.error('Error updating carousel item:', error);
      toast({
        title: "Error",
        description: "Failed to update carousel item",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string, imageUrl: string) => {
    if (!confirm('Are you sure you want to delete this carousel item?')) return;

    try {
      // Delete from database
      const { error } = await supabase
        .from('promotional_carousel')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Try to delete image from storage (if it's in our storage)
      if (imageUrl.includes('supabase.co/storage')) {
        const filePath = imageUrl.split('/carousel/')[1];
        if (filePath) {
          await supabase.storage
            .from('products')
            .remove([`carousel/${filePath}`]);
        }
      }

      toast({
        title: "Success",
        description: "Carousel item deleted successfully",
      });

      fetchCarouselItems();
    } catch (error) {
      console.error('Error deleting carousel item:', error);
      toast({
        title: "Error",
        description: "Failed to delete carousel item",
        variant: "destructive",
      });
    }
  };

  const handleReorder = async (id: string, newOrder: number) => {
    try {
      const { error } = await supabase
        .from('promotional_carousel')
        .update({ display_order: newOrder })
        .eq('id', id);

      if (error) throw error;

      fetchCarouselItems();
    } catch (error) {
      console.error('Error reordering carousel item:', error);
      toast({
        title: "Error",
        description: "Failed to reorder carousel item",
        variant: "destructive",
      });
    }
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= carouselItems.length) return;

    const item = carouselItems[index];
    const swapItem = carouselItems[newIndex];

    handleReorder(item.id, swapItem.display_order);
    handleReorder(swapItem.id, item.display_order);
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-4">
      {/* Add New Carousel Item */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Carousel Slide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title (Main Text)</Label>
            <Input
              id="title"
              value={newItem.title}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              placeholder="e.g., Welcome to Gemini"
            />
          </div>
          <div>
            <Label htmlFor="subtitle">Subtitle (Description)</Label>
            <Input
              id="subtitle"
              value={newItem.subtitle}
              onChange={(e) => setNewItem({ ...newItem, subtitle: e.target.value })}
              placeholder="e.g., Latest news and insights for Filipino farmers"
            />
          </div>
          <div>
            <Label htmlFor="image">Background Image</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => setNewItem({ ...newItem, image: e.target.files?.[0] || null })}
            />
          </div>
          <Button onClick={handleAddItem} disabled={uploading} className="w-full">
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? "Uploading..." : "Add Carousel Slide"}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Carousel Items */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Carousel Slides ({carouselItems.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {carouselItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No carousel slides yet. Add one above!</p>
          ) : (
            carouselItems.map((item, index) => (
              <Card key={item.id} className={!item.active ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  {editingId === item.id ? (
                    // Edit Mode
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <img
                          src={item.image_url}
                          alt={item.title || "Carousel"}
                          className="w-32 h-24 object-cover rounded"
                        />
                        <div className="flex-1 space-y-2">
                          <div>
                            <Label>Title</Label>
                            <Input
                              value={editForm.title}
                              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                              placeholder="Enter title"
                            />
                          </div>
                          <div>
                            <Label>Subtitle</Label>
                            <Input
                              value={editForm.subtitle}
                              onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })}
                              placeholder="Enter subtitle"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label className="flex items-center gap-2">
                          <Image className="w-4 h-4" />
                          Replace Image (optional)
                        </Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setEditForm({ ...editForm, image: e.target.files?.[0] || null })}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handleSaveEdit(item)} className="flex-1">
                          <Check className="w-4 h-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button variant="outline" onClick={handleCancelEdit}>
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex flex-col sm:flex-row gap-4">
                      <img
                        src={item.image_url}
                        alt={item.title || "Carousel"}
                        className="w-full sm:w-32 h-24 object-cover rounded"
                      />
                      <div className="flex-1 space-y-2">
                        <h4 className="font-semibold">{item.title || "(No Title)"}</h4>
                        <p className="text-sm text-muted-foreground">{item.subtitle || "(No Subtitle)"}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-muted-foreground">Order: {item.display_order}</span>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={item.active}
                              onCheckedChange={() => handleToggleActive(item.id, item.active)}
                            />
                            <span className="text-xs">{item.active ? 'Active' : 'Inactive'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex sm:flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartEdit(item)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveItem(index, 'up')}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveItem(index, 'down')}
                          disabled={index === carouselItems.length - 1}
                        >
                          ↓
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(item.id, item.image_url)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
