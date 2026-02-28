import React, { useState } from "react";
import { Download, ZoomIn, X } from "lucide-react";

interface Props {
  imageUrl: string;
  prompt: string;
}

const ImageDisplay: React.FC<Props> = ({ imageUrl, prompt }) => {
  const [zoomed, setZoomed] = useState(false);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `mahmudgpt-${Date.now()}.png`;
    a.click();
  };

  return (
    <>
      <div className="relative group rounded-lg overflow-hidden border border-border my-2 inline-block">
        <img src={imageUrl} alt={prompt} className="max-w-sm rounded-lg" loading="lazy" />
        <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button onClick={() => setZoomed(true)} className="p-2 rounded-full bg-card/90 hover:bg-card transition-colors">
            <ZoomIn className="h-4 w-4" />
          </button>
          <button onClick={handleDownload} className="p-2 rounded-full bg-card/90 hover:bg-card transition-colors">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {zoomed && (
        <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur flex items-center justify-center p-4" onClick={() => setZoomed(false)}>
          <button className="absolute top-4 right-4 p-2 rounded-full bg-card" onClick={() => setZoomed(false)}>
            <X className="h-5 w-5" />
          </button>
          <img src={imageUrl} alt={prompt} className="max-h-[90vh] max-w-[90vw] rounded-lg" />
        </div>
      )}
    </>
  );
};

export default ImageDisplay;
