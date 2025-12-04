import React, { useState, useRef, useCallback } from "react";
import { Camera, Move, RotateCcw, ZoomIn, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface NewsImageCropperProps {
  imageFile: File;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

export const NewsImageCropper = ({ 
  imageFile, 
  onCropComplete, 
  onCancel, 
  aspectRatio = 16/9 
}: NewsImageCropperProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const [image, setImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState([100]);
  const [rotation, setRotation] = useState([0]);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Load the image file when component mounts
  React.useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
      };
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile]);

  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas dimensions based on aspect ratio - responsive
    const canvasWidth = Math.min(400, window.innerWidth - 80); // Leave some margin
    const canvasHeight = canvasWidth / aspectRatio;
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Calculate scale based on zoom
    const scale = zoom[0] / 100;
    const scaledWidth = img.naturalWidth * scale;
    const scaledHeight = img.naturalHeight * scale;

    // Center the image and apply position offset
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const x = centerX - scaledWidth / 2 + position.x;
    const y = centerY - scaledHeight / 2 + position.y;

    // Apply rotation
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation[0] * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);

    // Draw image
    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform

    // Draw border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvasWidth, canvasHeight);
  }, [image, zoom, rotation, position, aspectRatio]);

  const handleMouseDown = (event: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging) return;
    
    setPosition({
      x: event.clientX - dragStart.x,
      y: event.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        onCropComplete(blob);
      }
    }, 'image/jpeg', 0.9);
  };

  const resetAdjustments = () => {
    setZoom([100]);
    setRotation([0]);
    setPosition({ x: 0, y: 0 });
  };

  // Draw preview when parameters change
  React.useEffect(() => {
    if (image) {
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        drawPreview();
      };
      img.src = image;
    }
  }, [image, drawPreview]);

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-sm sm:max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Crop News Thumbnail</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Adjust the image positioning and cropping for the news thumbnail
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4">
          {image && (
            <>
              {/* Preview */}
              <div className="flex justify-center overflow-hidden">
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    className="border-2 border-dashed border-border cursor-move max-w-full h-auto"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{ 
                      maxWidth: 'calc(100vw - 80px)',
                      maxHeight: 'calc(40vh)'
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Move className="w-4 h-4 sm:w-6 sm:h-6 text-muted-foreground/30" />
                  </div>
                </div>
              </div>

              {/* Controls */}
              <Card>
                <CardHeader className="pb-1 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm">Adjustments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  {/* Zoom Control */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs flex items-center">
                        <ZoomIn className="w-3 h-3 mr-1" />
                        Zoom
                      </Label>
                      <span className="text-xs text-muted-foreground">{zoom[0]}%</span>
                    </div>
                    <Slider
                      value={zoom}
                      onValueChange={setZoom}
                      min={10}
                      max={300}
                      step={10}
                      className="w-full"
                    />
                  </div>

                  {/* Rotation Control */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs flex items-center">
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Rotate
                      </Label>
                      <span className="text-xs text-muted-foreground">{rotation[0]}°</span>
                    </div>
                    <Slider
                      value={rotation}
                      onValueChange={setRotation}
                      min={-180}
                      max={180}
                      step={15}
                      className="w-full"
                    />
                  </div>

                  {/* Reset Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetAdjustments}
                    className="w-full text-xs"
                  >
                    Reset Adjustments
                  </Button>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1 order-2 sm:order-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-1 order-1 sm:order-2"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Save Thumbnail
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};