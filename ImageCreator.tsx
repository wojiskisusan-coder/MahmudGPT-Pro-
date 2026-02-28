
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Check, Download, ImageIcon, Loader2, RefreshCw } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ImageCreatorProps {
  initialPrompt?: string;
}

const API_KEY = "491714787ba156962489692c9b23000a";
const API_URL = "https://api.deepai.org/api/text2img";

const ImageCreator: React.FC<ImageCreatorProps> = ({ initialPrompt = "" }) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [creativity, setCreativity] = useState(0.7);
  const [imageStyle, setImageStyle] = useState("realistic");
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a description for the image you want to create.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      // Try to use the DeepAI API first
      const formData = new FormData();
      formData.append('text', `${prompt} ${imageStyle === 'realistic' ? 'photorealistic, high detail' : 'creative art style, imaginative'}`);
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'api-key': API_KEY,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      
      if (data.output_url) {
        setGeneratedImage(data.output_url);
        toast({
          title: "Success",
          description: "Your image has been generated!",
        });
      } else {
        throw new Error('No image URL in response');
      }
    } catch (error) {
      console.error("Error generating image:", error);
      
      // Fallback to a placeholder image
      const placeholderSize = 512 + Math.round(creativity * 512); // Size between 512-1024 based on creativity
      const placeholderImage = `https://picsum.photos/${placeholderSize}/${placeholderSize}?random=${Date.now()}`;
      setGeneratedImage(placeholderImage);
      
      toast({
        title: "Notice",
        description: "Using fallback image generation. AI service unavailable.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    
    // Create a link element and trigger download
    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `ai-image-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            <span>AI Image Creator</span>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prompt">Image Description</Label>
          <Textarea
            id="prompt"
            placeholder="Describe the image you want to create..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-24"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="creativity">Creativity Level</Label>
              <span className="text-sm text-muted-foreground">{Math.round(creativity * 100)}%</span>
            </div>
            <Slider
              id="creativity"
              min={0}
              max={1}
              step={0.1}
              value={[creativity]}
              onValueChange={(values) => setCreativity(values[0])}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Realistic</span>
              <span>Creative</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="style">Image Style</Label>
            <Select value={imageStyle} onValueChange={setImageStyle}>
              <SelectTrigger>
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realistic">Realistic</SelectItem>
                <SelectItem value="artistic">Artistic</SelectItem>
                <SelectItem value="cartoon">Cartoon</SelectItem>
                <SelectItem value="fantasy">Fantasy</SelectItem>
                <SelectItem value="sci-fi">Sci-Fi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {generatedImage && (
          <div className="mt-4 border rounded-md overflow-hidden">
            <img 
              src={generatedImage} 
              alt="Generated" 
              className="w-full h-auto object-contain"
              loading="lazy"
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button 
          onClick={handleGenerate} 
          disabled={isGenerating || !prompt.trim()}
          className="flex-1"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              {generatedImage ? <RefreshCw className="h-4 w-4 mr-2" /> : <ImageIcon className="h-4 w-4 mr-2" />}
              {generatedImage ? "Regenerate" : "Generate Image"}
            </>
          )}
        </Button>
        
        {generatedImage && (
          <Button onClick={handleDownload} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ImageCreator;
