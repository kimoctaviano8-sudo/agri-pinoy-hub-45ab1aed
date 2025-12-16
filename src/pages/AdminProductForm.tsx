import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
const AdminProductForm = () => {
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image_url: "",
    active: true,
    stock_quantity: "0",
    low_stock_threshold: "5"
  });
  useEffect(() => {
    if (id && id !== 'new') {
      fetchProduct();
    }
  }, [id]);
  const fetchProduct = async () => {
    if (!id || id === 'new') return;
    const {
      data,
      error
    } = await supabase.from('products').select('*').eq('id', id).single();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load product.",
        variant: "destructive"
      });
      navigate('/admin');
      return;
    }
    if (data) {
      setFormData({
        name: data.name,
        description: data.description,
        price: data.price?.toString() || "",
        category: data.category || "",
        image_url: data.image_url || "",
        active: data.active,
        stock_quantity: data.stock_quantity?.toString() || "0",
        low_stock_threshold: data.low_stock_threshold?.toString() || "5"
      });

      // Set image preview if there's an existing image URL
      if (data.image_url) {
        setImagePreview(data.image_url);
      }
    }
  };
  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `products/${fileName}`;
    const {
      error: uploadError
    } = await supabase.storage.from('products').upload(filePath, file);
    if (uploadError) {
      throw uploadError;
    }

    // Get the public URL that's Facebook-compatible
    const {
      data
    } = supabase.storage.from('products').getPublicUrl(filePath);
    return data.publicUrl;
  };
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const imageUrl = await uploadImage(file);
      setFormData({
        ...formData,
        image_url: imageUrl
      });
      setImagePreview(imageUrl);
      toast({
        title: "Success",
        description: "Image uploaded successfully."
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
  const removeImage = () => {
    setFormData({
      ...formData,
      image_url: ""
    });
    setImagePreview(null);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        low_stock_threshold: parseInt(formData.low_stock_threshold) || 5
      };
      if (id === 'new') {
        const {
          data,
          error
        } = await supabase.from('products').insert([productData]).select().single();
        if (error) throw error;
        toast({
          title: "Success",
          description: "Product created successfully."
        });

        // Update URL to edit mode with the new ID, but stay on the page
        if (data) {
          window.history.replaceState(null, '', `/admin/products/${data.id}`);
        }
      } else {
        const {
          error
        } = await supabase.from('products').update(productData).eq('id', id);
        if (error) throw error;
        toast({
          title: "Success",
          description: "Product updated successfully."
        });
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: "Failed to save product.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <Card className="mb-[90px]">
          <CardHeader>
            <CardTitle>{id === 'new' ? 'Create Product' : 'Edit Product'}</CardTitle>
            <CardDescription>
              {id === 'new' ? 'Add a new product to your app' : 'Update the product details'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-0 mb-[20px]">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side - Product Image */}
                <div className="space-y-4">
                  <Label>Product Image</Label>
                  
                  {/* Image Preview */}
                  {imagePreview && <div className="relative">
                      <img src={imagePreview} alt="Product preview" className="w-full h-64 object-cover rounded-lg border" />
                      <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={removeImage}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>}

                  {/* Upload Button */}
                  <div className="flex flex-col gap-4">
                    <div>
                      <input type="file" id="image-upload" accept="image/*" onChange={handleFileUpload} className="hidden" />
                      <Button type="button" variant="outline" onClick={() => document.getElementById('image-upload')?.click()} disabled={uploading} className="flex items-center gap-2 w-full">
                        <Upload className="h-4 w-4" />
                        {uploading ? 'Uploading...' : 'Upload Image'}
                      </Button>
                    </div>

                    {/* Manual URL Input */}
                    <div className="space-y-2">
                      <Label htmlFor="image_url">Or enter image URL</Label>
                      <Input id="image_url" value={formData.image_url} onChange={e => {
                      setFormData({
                        ...formData,
                        image_url: e.target.value
                      });
                      setImagePreview(e.target.value);
                    }} placeholder="https://example.com/image.jpg" />
                    </div>
                  </div>
                </div>

                {/* Right Side - Product Details */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input id="name" value={formData.name} onChange={e => setFormData({
                    ...formData,
                    name: e.target.value
                  })} placeholder="Enter product name" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₱)</Label>
                    <Input id="price" type="number" step="0.01" value={formData.price} onChange={e => setFormData({
                    ...formData,
                    price: e.target.value
                  })} placeholder="Enter price" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={value => setFormData({
                    ...formData,
                    category: value
                  })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="seeds">Seeds</SelectItem>
                        <SelectItem value="tools">Tools</SelectItem>
                        <SelectItem value="fertilizers">Fertilizers</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="services">Services</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stock_quantity">Stock Quantity</Label>
                      <Input id="stock_quantity" type="number" min="0" value={formData.stock_quantity} onChange={e => setFormData({
                      ...formData,
                      stock_quantity: e.target.value
                    })} placeholder="Enter stock quantity" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="low_stock_threshold">Low Stock Alert</Label>
                      <Input id="low_stock_threshold" type="number" min="0" value={formData.low_stock_threshold} onChange={e => setFormData({
                      ...formData,
                      low_stock_threshold: e.target.value
                    })} placeholder="Low stock threshold" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={formData.description} onChange={e => setFormData({
                    ...formData,
                    description: e.target.value
                  })} placeholder="Enter product description" rows={6} required />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="active" checked={formData.active} onCheckedChange={checked => setFormData({
                    ...formData,
                    active: checked
                  })} />
                    <Label htmlFor="active">Product is active</Label>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline" onClick={() => navigate('/admin')}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      <Save className="w-4 h-4 mr-2" />
                      {loading ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default AdminProductForm;