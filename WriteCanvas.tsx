
import React, { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Save, Pencil, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, ListOrdered, List, Code as CodeIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguageStore } from "@/store/languageStore";
import { getTranslation } from "@/utils/translations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface WriteCanvasProps {
  defaultContent?: string;
}

const WriteCanvas: React.FC<WriteCanvasProps> = ({
  defaultContent = "",
}) => {
  const [content, setContent] = useState(defaultContent);
  const [savedContent, setSavedContent] = useState(defaultContent);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { currentLanguage } = useLanguageStore();
  
  // Update content when defaultContent changes
  useEffect(() => {
    if (defaultContent && defaultContent !== content) {
      setContent(defaultContent);
    }
  }, [defaultContent]);
  
  // Save current content
  const saveContent = () => {
    setSavedContent(content);
    
    toast({
      title: getTranslation('saved', currentLanguage) || "Saved",
      description: getTranslation('content_saved', currentLanguage) || "Your content has been saved.",
    });
    
    // Store in local storage for persistence
    try {
      localStorage.setItem('write-canvas-content', content);
    } catch (error) {
      console.error("Failed to save to local storage:", error);
    }
  };
  
  // Copy content to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast({
        title: getTranslation('copied', currentLanguage) || "Copied to clipboard",
        description: getTranslation('content_copied', currentLanguage) || "Content has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: getTranslation('error', currentLanguage) || "Failed to copy",
        description: getTranslation('copy_error', currentLanguage) || "Could not copy content to clipboard.",
        variant: "destructive",
      });
    }
  };
  
  // Load saved content from local storage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('write-canvas-content');
      if (savedData && !defaultContent) {
        setContent(savedData);
        setSavedContent(savedData);
      }
    } catch (error) {
      console.error("Failed to load from local storage:", error);
    }
  }, []);

  // Text formatting functions
  const applyFormatting = (formatType: string) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    let formattedText = '';
    let cursorAdjustment = 0;

    switch (formatType) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        cursorAdjustment = 2;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        cursorAdjustment = 1;
        break;
      case 'underline':
        formattedText = `<u>${selectedText}</u>`;
        cursorAdjustment = 3;
        break;
      case 'align-left':
        formattedText = `<div style="text-align: left;">${selectedText}</div>`;
        cursorAdjustment = 29;
        break;
      case 'align-center':
        formattedText = `<div style="text-align: center;">${selectedText}</div>`;
        cursorAdjustment = 31;
        break;
      case 'align-right':
        formattedText = `<div style="text-align: right;">${selectedText}</div>`;
        cursorAdjustment = 30;
        break;
      case 'list':
        formattedText = selectedText
          .split('\n')
          .map(line => line.trim() ? `- ${line}` : line)
          .join('\n');
        cursorAdjustment = 0;
        break;
      case 'list-ordered':
        formattedText = selectedText
          .split('\n')
          .map((line, index) => line.trim() ? `${index + 1}. ${line}` : line)
          .join('\n');
        cursorAdjustment = 0;
        break;
      case 'code':
        formattedText = `\`${selectedText}\``;
        cursorAdjustment = 1;
        break;
      default:
        formattedText = selectedText;
    }

    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);

    // Focus back on textarea and set cursor position after formatting
    setTimeout(() => {
      textarea.focus();
      if (start === end) {
        textarea.selectionStart = start + cursorAdjustment;
        textarea.selectionEnd = start + cursorAdjustment;
      } else {
        textarea.selectionStart = start + formattedText.length;
        textarea.selectionEnd = start + formattedText.length;
      }
    }, 0);
  };

  // Convert markdown to HTML for preview
  const renderPreview = () => {
    // Basic markdown rendering
    const html = content
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-2">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mb-2">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mb-2">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br />');
    
    return (
      <div 
        className="border p-4 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white w-full h-full overflow-auto prose max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{getTranslation('write_canvas', currentLanguage) || "Write Canvas"}</CardTitle>
          <div className="text-sm text-muted-foreground">
            {content.length} {getTranslation('characters', currentLanguage) || "characters"}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="editor" className="w-full">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="editor" className="min-h-[300px]">
            <div className="flex flex-wrap gap-1 mb-2 p-1 border border-gray-200 dark:border-gray-700 rounded">
              <ToggleGroup type="single" className="flex flex-wrap gap-1">
                <ToggleGroupItem 
                  value="bold" 
                  onClick={() => applyFormatting('bold')}
                  className="h-8 w-8 p-0"
                  title="Bold"
                >
                  <Bold className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="italic" 
                  onClick={() => applyFormatting('italic')}
                  className="h-8 w-8 p-0"
                  title="Italic"
                >
                  <Italic className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="underline" 
                  onClick={() => applyFormatting('underline')}
                  className="h-8 w-8 p-0"
                  title="Underline"
                >
                  <Underline className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
              
              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-0.5"></div>
              
              <ToggleGroup type="single" className="flex flex-wrap gap-1">
                <ToggleGroupItem
                  value="align-left"
                  onClick={() => applyFormatting('align-left')}
                  className="h-8 w-8 p-0"
                  title="Align Left"
                >
                  <AlignLeft className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="align-center"
                  onClick={() => applyFormatting('align-center')}
                  className="h-8 w-8 p-0"
                  title="Align Center"
                >
                  <AlignCenter className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="align-right"
                  onClick={() => applyFormatting('align-right')}
                  className="h-8 w-8 p-0"
                  title="Align Right"
                >
                  <AlignRight className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
              
              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-0.5"></div>
              
              <ToggleGroup type="single" className="flex flex-wrap gap-1">
                <ToggleGroupItem
                  value="list"
                  onClick={() => applyFormatting('list')}
                  className="h-8 w-8 p-0"
                  title="Bullet List"
                >
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="list-ordered"
                  onClick={() => applyFormatting('list-ordered')}
                  className="h-8 w-8 p-0"
                  title="Numbered List"
                >
                  <ListOrdered className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="code"
                  onClick={() => applyFormatting('code')}
                  className="h-8 w-8 p-0"
                  title="Code"
                >
                  <CodeIcon className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[300px] font-sans text-base"
              placeholder={getTranslation('start_writing', currentLanguage) || "Start writing here..."}
            />
          </TabsContent>
          
          <TabsContent value="preview" className="min-h-[300px]">
            {renderPreview()}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={saveContent}>
          <Save className="h-4 w-4 mr-2" />
          {getTranslation('save', currentLanguage) || "Save"}
        </Button>
        <Button variant="outline" onClick={copyToClipboard}>
          {copied ? (
            <Check className="h-4 w-4 mr-2" />
          ) : (
            <Copy className="h-4 w-4 mr-2" />
          )}
          {copied ? 
            (getTranslation('copied', currentLanguage) || "Copied") : 
            (getTranslation('copy', currentLanguage) || "Copy")}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WriteCanvas;
