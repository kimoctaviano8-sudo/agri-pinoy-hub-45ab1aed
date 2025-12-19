import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Upload, X, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { NewsImageCropper } from "@/components/NewsImageCropper";
import { cn } from "@/lib/utils";

const AdminNewsForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    image_url: "",
    published: false,
    published_date: new Date()
  });

  useEffect(() => {
    if (id && id !== 'new') {
      fetchNews();
    }
  }, [id]);

  const fetchNews = async () => {
    if (!id || id === 'new') return;

    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load news article.",
        variant: "destructive",
      });
      navigate('/admin');
      return;
    }

    if (data) {
      const newsData = data as typeof data & { published_date?: string };
      setFormData({
        title: newsData.title,
        content: newsData.content,
        category: newsData.category || "",
        image_url: newsData.image_url || "",
        published: newsData.published ?? false,
        published_date: newsData.published_date ? new Date(newsData.published_date) : new Date()
      });
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      setShowCropper(true);
    }
  };

  const handleCroppedImage = async (croppedImageBlob: Blob) => {
    setUploadingImage(true);
    setShowCropper(false);
    
    try {
      const fileName = `news-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('products')
        .upload(fileName, croppedImageBlob, {
          contentType: 'image/jpeg',
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('products')
        .getPublicUrl(fileName);

      setFormData({ ...formData, image_url: urlData.publicUrl });
      
      toast({
        title: "Success",
        description: "Image uploaded successfully.",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
      setImageFile(null);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, image_url: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        published_date: formData.published_date.toISOString().split('T')[0]
      };

      if (id === 'new') {
        const { data, error } = await supabase
          .from('news')
          .insert([submitData])
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Success",
          description: "News article created successfully.",
        });

        // Update URL to edit mode with the new ID, but stay on the page
        if (data) {
          window.history.replaceState(null, '', `/admin/news/${data.id}`);
        }
      } else {
        const { error } = await supabase
          .from('news')
          .update(submitData)
          .eq('id', id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "News article updated successfully.",
        });
      }
    } catch (error) {
      console.error('Error saving news:', error);
      toast({
        title: "Error",
        description: "Failed to save news article.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <Button variant="ghost" onClick={() => navigate('/admin')} className="px-2 sm:px-4">
            <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">
              {id === 'new' ? 'Create News Article' : 'Edit News Article'}
            </CardTitle>
            <CardDescription className="text-sm">
              {id === 'new' ? 'Add a new news article to your app' : 'Update the news article details'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter news title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agriculture">Agriculture</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="market">Market Updates</SelectItem>
                    <SelectItem value="weather">Weather</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Article Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.published_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.published_date ? format(formData.published_date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.published_date}
                      onSelect={(date) => setFormData({ ...formData, published_date: date || new Date() })}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <Label>Thumbnail Image</Label>
                
                {/* Current Image Preview */}
                {formData.image_url && (
                  <div className="relative inline-block">
                    <img 
                      src={formData.image_url} 
                      alt="Current thumbnail" 
                      className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full p-0"
                      onClick={removeImage}
                    >
                      <X className="w-2 h-2 sm:w-3 sm:h-3" />
                    </Button>
                  </div>
                )}

                {/* Upload Button */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-full sm:w-auto"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingImage ? "Uploading..." : "Upload Image"}
                  </Button>
                  
                  {/* Manual URL Input */}
                  <div className="flex-1">
                    <Input
                      placeholder="Or enter image URL"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter news content"
                  rows={8}
                  className="min-h-[120px] sm:min-h-[200px] text-sm"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="published"
                  checked={formData.published}
                  onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                />
                <Label htmlFor="published" className="text-sm">Publish immediately</Label>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin')}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full sm:w-auto order-1 sm:order-2"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Image Cropper Modal */}
        {showCropper && imageFile && (
          <NewsImageCropper
            imageFile={imageFile}
            onCropComplete={handleCroppedImage}
            onCancel={() => {
              setShowCropper(false);
              setImageFile(null);
            }}
            aspectRatio={16/9} // News thumbnail aspect ratio
          />
        )}
      </div>
    </div>
  );
};

export default AdminNewsForm;