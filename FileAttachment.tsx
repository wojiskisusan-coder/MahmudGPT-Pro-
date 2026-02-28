
import React, { useState, useRef } from "react";
import { Upload, X, ImageIcon, FileIcon, FileAudio, FileVideo, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileAttachmentProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  acceptedTypes?: string;
  title?: string;
}

const FileAttachment: React.FC<FileAttachmentProps> = ({
  onFileSelect,
  selectedFile,
  acceptedTypes = "image/jpeg,image/png,image/jpg,image/gif,audio/*,video/*,application/pdf",
  title = "Attach file"
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      onFileSelect(file);
      
      // Create a URL for preview if it's an image
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const clearSelectedFile = () => {
    onFileSelect(null);
    setPreviewUrl(null);
    
    // Reset file input value
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Function to select appropriate icon based on file type
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="h-5 w-5 text-muted-foreground" />;
    if (fileType.startsWith('audio/')) return <FileAudio className="h-5 w-5 text-muted-foreground" />;
    if (fileType.startsWith('video/')) return <FileVideo className="h-5 w-5 text-muted-foreground" />;
    if (fileType === 'application/pdf') return <FileText className="h-5 w-5 text-muted-foreground" />;
    return <FileIcon className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <div className="w-full">
      {!selectedFile ? (
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
            <span className="text-sm">{title}</span>
            <input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              accept={acceptedTypes}
              onChange={handleFileChange}
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
                getFileIcon(selectedFile.type)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type.split('/')[0]}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full"
              onClick={clearSelectedFile}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileAttachment;
