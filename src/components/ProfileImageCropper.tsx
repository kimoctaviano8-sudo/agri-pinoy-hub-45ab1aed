import React, { useState, useRef, useCallback } from "react";
import { Camera, Move, RotateCcw, ZoomIn, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ProfileImageCropperProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (croppedImage: Blob) => void;
  currentImage?: string;
}

export const ProfileImageCropper = ({ isOpen, onClose, onSave, currentImage }: ProfileImageCropperProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [image, setImage] = useState<string | null>(currentImage || null);
  const [zoom, setZoom] = useState([20]);
  const [rotation, setRotation] = useState([0]);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const calculateFitZoom = (imgWidth: number, imgHeight: number) => {
    const circleSize = 200;
    const scale = Math.min(circleSize / imgWidth, circleSize / imgHeight);
    return Math.round(scale * 100);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const fitZoom = calculateFitZoom(img.naturalWidth, img.naturalHeight);
          setImage(e.target?.result as string);
          setZoom([20]);
          setRotation([0]);
          setPosition({ x: 0, y: 0 });
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 200;
    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, size, size);

    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();

    const scale = zoom[0] / 100;
    const scaledWidth = img.naturalWidth * scale;
    const scaledHeight = img.naturalHeight * scale;

    const centerX = size / 2;
    const centerY = size / 2;
    const x = centerX - scaledWidth / 2 + position.x;
    const y = centerY - scaledHeight / 2 + position.y;

    ctx.translate(centerX, centerY);
    ctx.rotate((rotation[0] * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);

    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
    ctx.restore();

    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
    ctx.stroke();
  }, [image, zoom, rotation, position]);

  // Mouse events
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

  // Touch events for mobile support
  const handleTouchStart = (event: React.TouchEvent) => {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      setIsDragging(true);
      setDragStart({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      });
    }
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (!isDragging || event.touches.length !== 1) return;
    event.preventDefault();
    const touch = event.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        onSave(blob);
      }
    }, 'image/jpeg', 0.9);
  };

  const resetAdjustments = () => {
    setZoom([20]);
    setRotation([0]);
    setPosition({ x: 0, y: 0 });
  };

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Edit Profile Picture</DialogTitle>
          <DialogDescription className="text-sm">
            Upload a new image or adjust your current one
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Camera className="w-4 h-4 mr-2" />
              Select New Image
            </Button>
          </div>

          {image && (
            <>
              {/* Preview */}
              <div className="flex justify-center">
                <div className="relative touch-none">
                  <canvas
                    ref={canvasRef}
                    className="border-2 border-dashed border-border rounded-full cursor-move"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Move className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                </div>
              </div>

              {/* Controls */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Adjustments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                      min={0}
                      max={200}
                      step={5}
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
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-1"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
