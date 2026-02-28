
import React, { useState, useRef } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageAttachmentProps {
  onImageSelect: (file: File | null) => void;
  selectedImage: File | null;
}

const ImageAttachment: React.FC<ImageAttachmentProps> = ({
  onImageSelect,
  selectedImage,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      onImageSelect(file);
      
      // Create a URL for the image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearSelectedImage = () => {
    onImageSelect(null);
    setPreviewUrl(null);
    
    // Reset file input value
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      {!selectedImage ? (
        <div className="flex items-center justify-center gap-2">
          <Button
            type="button"
            onClick={triggerFileInput}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer",
              "border border-dashed border-muted-foreground/50 hover:border-primary/50",
              "transition-colors bg-transparent"
            )}
            variant="ghost"
          >
            <Upload className="h-4 w-4" />
            <span className="text-sm">Attach image</span>
            <input
              ref={fileInputRef}
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </Button>
        </div>
      ) : (
        <div className="relative flex items-center">
          <div className="border rounded-md p-2 flex items-center gap-2 w-full bg-secondary/20">
            <div className="h-10 w-10 rounded bg-secondary/30 overflow-hidden flex items-center justify-center">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedImage.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedImage.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full"
              onClick={clearSelectedImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageAttachment;
