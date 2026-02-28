import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Bot, RefreshCw, Plus, Mic, MicOff, Table, Code, FileText, ImageIcon, Paperclip, X, Upload, FileAudio, FileVideo, FileText as FileTextIcon, Paperclip as PaperclipIcon } from "lucide-react";
import ChatMessage from "./ChatMessage";
import { useMessageStore } from "@/store/messageStore";
import { generateResponse } from "@/services/geminiService";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/store/languageStore";
import { getTranslation } from "@/utils/translations";
import { detectContentType, ContentType } from "@/utils/contentDetector";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import ImageAttachment from "./ImageAttachment";
import FileAttachment from "./FileAttachment";

interface GeneratedContent {
  type: ContentType;
  content: string;
  prompt: string;
}

const ChatUI: React.FC = () => {
  const [input, setInput] = useState("");
  const { messages, addMessage, editMessage, isLoading, setLoading, clearMessages } = useMessageStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { currentLanguage } = useLanguageStore();
  const [selectedContentType, setSelectedContentType] = useState<ContentType | 'none'>('none');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const navigate = useNavigate();
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to handle specialized content generation
  const generateSpecializedContent = async (prompt: string, contentType: ContentType) => {
    // Start progress animation
    setGenerationProgress(0);
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) return prev; // Don't go to 100 until complete
        return prev + Math.random() * 15;
      });
    }, 500);
    
    try {
      // Generate content based on content type
      let specializedPrompt = "";
      
      switch(contentType) {
        case 'table':
          specializedPrompt = `Generate a well-formatted markdown table about the following topic. Make sure to use proper markdown table syntax with pipes and hyphens: ${prompt}`;
          break;
        case 'code':
          specializedPrompt = `Generate clean, well-commented code about: ${prompt}. Include proper syntax highlighting markers in markdown format.`;
          break;
        case 'text':
          specializedPrompt = `Write a detailed, well-structured text about: ${prompt}`;
          break;
        default:
          specializedPrompt = prompt;
      }
      
      const content = await generateResponse(specializedPrompt, currentLanguage);
      
      // Set progress to complete
      clearInterval(progressInterval);
      setGenerationProgress(100);
      
      // Return the generated content
      return {
        type: contentType,
        content,
        prompt
      };
    } catch (error) {
      console.error("Failed to generate specialized content:", error);
      clearInterval(progressInterval);
      setGenerationProgress(0);
      throw error;
    }
  };
  
  // Function to navigate to the appropriate tools page with content
  const openInTools = () => {
    if (!generatedContent) return;
    
    // Save generated content to localStorage to pass between pages
    localStorage.setItem('generatedContent', JSON.stringify(generatedContent));
    
    // Navigate to voice tools page
    navigate('/voice-tools');
    
    // Reset generated content
    setGeneratedContent(null);
    setGenerationProgress(0);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if ((!input.trim() && selectedImages.length === 0) || isLoading) return;
    
    const userMessage = input.trim();
    
    // Create a message based on whether there are images or text input
    let messageContent = userMessage;
    if (selectedImages.length > 0) {
      const imageNames = selectedImages.map(file => file.name).join(", ");
      messageContent = userMessage 
        ? `${userMessage} (with ${selectedImages.length} ${selectedImages.length === 1 ? 'image' : 'images'}: ${imageNames})` 
        : `${selectedImages.length} ${selectedImages.length === 1 ? 'image' : 'images'}: ${imageNames}`;
    }
    
    // Add user message to the chat
    addMessage(messageContent, "user");
    setInput("");
    setLoading(true);
    
    // Display loading message
    const loadingId = Math.random().toString(36).substring(2, 9);
    addMessage(getTranslation('loading', currentLanguage) + "...", "assistant", loadingId);
    
    try {
      // Check for image analysis request
      if (selectedImages.length > 0) {
        // Process the images using Gemini API with the prompt
        const imagePrompt = userMessage || `Analyzing ${selectedImages.length} ${selectedImages.length === 1 ? 'image' : 'images'}`;
        const response = await generateResponse(imagePrompt, currentLanguage, selectedImages);
        
        // Update the loading message with the actual response
        editMessage(loadingId, response);
        
        // Reset the selected images
        setSelectedImages([]);
      } else {
        // Use selected content type if set, otherwise detect from message
        const contentType = selectedContentType !== 'none' ? 
          selectedContentType : 
          detectContentType(userMessage);
        
        // Reset the selected content type after use
        setSelectedContentType('none');
        
        // For regular conversations, just generate a normal response
        if (contentType === 'none') {
          const response = await generateResponse(userMessage, currentLanguage);
          // Remove loading message and add actual response
          editMessage(loadingId, response);
        } else {
          // If specialized content is requested, handle it differently
          try {
            // Replace the loading message to indicate specialized content is being generated
            editMessage(loadingId, `Generating ${contentType} content for you. Please wait...`);
            
            // Generate specialized content
            const content = await generateSpecializedContent(userMessage, contentType);
            setGeneratedContent(content);
            
            // Update assistant message with info about generated content
            editMessage(
              loadingId, 
              `I've created ${contentType} content based on your request. You can now view or edit it using the specialized tools.`
            );
          } catch (error) {
            console.error("Failed to generate specialized content:", error);
            editMessage(loadingId, getTranslation('error_response', currentLanguage));
            
            toast({
              title: getTranslation('error', currentLanguage),
              description: "Failed to generate specialized content. Please try again.",
              variant: "destructive",
            });
          }
        }
      }
    } catch (error) {
      console.error("Failed to get AI response:", error);
      // Update the loading message with an error
      editMessage(loadingId, getTranslation('error_response', currentLanguage));
      toast({
        title: getTranslation('error', currentLanguage),
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    clearMessages();
    toast({
      title: getTranslation('chat_cleared', currentLanguage),
      description: getTranslation('chat_cleared_description', currentLanguage),
    });
  };

  const handleEditMessage = (id: string, newContent: string) => {
    editMessage(id, newContent);
    
    // If it's a user message, generate a new response
    const messageIndex = messages.findIndex(msg => msg.id === id);
    if (messageIndex >= 0 && messages[messageIndex].role === 'user') {
      // Remove any assistant message that might have followed
      if (messageIndex + 1 < messages.length && messages[messageIndex + 1].role === 'assistant') {
        // We'll let the new response replace this one
        const oldResponseId = messages[messageIndex + 1].id;
        editMessage(oldResponseId, getTranslation('loading', currentLanguage) + "...");
        
        // Generate new response
        setLoading(true);
        generateResponse(newContent, currentLanguage)
          .then(response => {
            editMessage(oldResponseId, response);
          })
          .catch(error => {
            console.error("Failed to get AI response:", error);
            editMessage(oldResponseId, getTranslation('error_response', currentLanguage));
            toast({
              title: getTranslation('error', currentLanguage),
              description: "Failed to get a response. Please try again.",
              variant: "destructive",
            });
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  };

  const toggleListening = () => {
    if (!isListening) {
      startListening();
    } else {
      stopListening();
    }
  };

  // Function to handle content type selection
  const selectContentType = (type: ContentType) => {
    setSelectedContentType(type === selectedContentType ? 'none' : type);
  };

  const toggleAttachmentOptions = () => {
    setShowAttachmentOptions(!showAttachmentOptions);
  };

  const startListening = () => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      // Stop existing recognition instance if running
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      
      recognitionRef.current = new SpeechRecognition();
      
      // Fix for duplicate words - don't use continuous mode
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      // Set language for speech recognition
      recognitionRef.current.lang = currentLanguage.code;
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        toast({
          title: getTranslation('listening', currentLanguage),
          description: getTranslation('listening_description', currentLanguage),
        });
      };
      
      recognitionRef.current.onresult = (event) => {
        // Get only the final result to avoid duplication
        const currentTranscript = event.results[0][0].transcript;
        setInput(currentTranscript);
        
        // Keep listening for more speech by restarting recognition
        if (isListening) {
          setTimeout(() => {
            if (isListening && recognitionRef.current) {
              recognitionRef.current.start();
            }
          }, 50);
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        toast({
          title: getTranslation('error', currentLanguage),
          description: `Speech recognition error: ${event.error}`,
          variant: "destructive",
        });
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        // Only set listening to false if we're explicitly stopping
        if (!isListening) {
          setIsListening(false);
        }
      };
      
      recognitionRef.current.start();
    } else {
      toast({
        title: getTranslation('not_supported', currentLanguage),
        description: getTranslation('not_supported_description', currentLanguage),
        variant: "destructive",
      });
    }
  };
  
  const stopListening = () => {
    if (recognitionRef.current) {
      setIsListening(false);
      recognitionRef.current.stop();
    }
  };

  // Function to get appropriate icon based on file type
  const getFileTypeIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="h-3 w-3" />;
    if (fileType.startsWith('audio/')) return <FileAudio className="h-3 w-3" />;
    if (fileType.startsWith('video/')) return <FileVideo className="h-3 w-3" />;
    if (fileType === 'application/pdf') return <FileText className="h-3 w-3" />;
    return <Paperclip className="h-3 w-3" />;
  };

  // Handle file selection for multiple types of files
  const handleFileSelection = (files: File[]) => {
    // Filter files based on supported types
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || 
      file.type.startsWith('audio/') || 
      file.type.startsWith('video/') ||
      file.type === 'application/pdf'
    );
    
    if (validFiles.length === 0) {
      toast({
        title: "Unsupported file type",
        description: "Please select images, audio, video, or PDF files.",
        variant: "destructive",
      });
      return;
    }
    
    // Apply limits by file type
    const imageFiles = validFiles.filter(file => file.type.startsWith('image/'));
    const videoFiles = validFiles.filter(file => file.type.startsWith('video/'));
    const audioFiles = validFiles.filter(file => file.type.startsWith('audio/'));
    const pdfFiles = validFiles.filter(file => file.type === 'application/pdf');
    
    // Enforce limits
    const finalImageFiles = imageFiles.slice(0, 10);
    const finalVideoFiles = videoFiles.slice(0, 1);
    const finalAudioFiles = audioFiles.slice(0, 3);
    const finalPdfFiles = pdfFiles.slice(0, 2);
    
    // Combine all files respecting the limits
    const finalFiles = [
      ...finalImageFiles,
      ...finalVideoFiles,
      ...finalAudioFiles,
      ...finalPdfFiles
    ];
    
    setSelectedImages(finalFiles);
  };

  // Clear selected images
  const clearSelectedImages = () => {
    setSelectedImages([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Function to remove a specific image
  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto h-[85vh] md:h-[80vh] flex flex-col shadow-lg">
      <CardHeader className="border-b bg-secondary/50 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gradient-to-br from-primary to-blue-400 rounded-full flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <CardTitle>MahmudGPT</CardTitle>
          </div>
          <Button variant="outline" size="icon" onClick={handleReset} className="h-8 w-8">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="h-full message-list p-4 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div className="h-20 w-20 bg-gradient-to-br from-primary to-blue-400 rounded-full flex items-center justify-center mb-4">
                <Bot className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-lg font-semibold">{getTranslation('welcome', currentLanguage)}</h3>
              <p className="text-muted-foreground mt-2 max-w-sm">
                {getTranslation('welcome_description', currentLanguage)}
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatMessage 
                key={msg.id} 
                message={msg} 
                onEdit={handleEditMessage}
              />
            ))
          )}
          {isLoading && !messages.some(msg => msg.content.includes(getTranslation('loading', currentLanguage))) && (
            <div className="p-4 flex items-center">
              <div className="typing-indicator ml-12">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          
          {/* Generated Content UI */}
          {generatedContent && (
            <div className="w-full mb-4 p-4 border rounded-lg bg-secondary/20 mx-auto max-w-md">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {generatedContent.type === 'table' && <Table className="h-5 w-5 text-primary" />}
                  {generatedContent.type === 'code' && <Code className="h-5 w-5 text-primary" />}
                  {generatedContent.type === 'text' && <FileText className="h-5 w-5 text-primary" />}
                  <span className="font-medium">{generatedContent.type.charAt(0).toUpperCase() + generatedContent.type.slice(1)} content created</span>
                </div>
              </div>
              
              {generationProgress < 100 ? (
                <div className="w-full my-2">
                  <Progress value={generationProgress} className="h-2" />
                  <p className="text-xs text-center mt-1">Generating content...</p>
                </div>
              ) : (
                <Button 
                  onClick={openInTools} 
                  className="w-full mt-2"
                  variant="outline"
                >
                  Open in Tools
                </Button>
              )}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
      <CardFooter className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex w-full gap-2 flex-col">
          {/* Content Type Selection Icons */}
          <div className="flex justify-center gap-2 w-full mb-2">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-full",
                selectedContentType === 'table' && "bg-secondary text-primary"
              )}
              title="Generate table content"
              onClick={() => selectContentType('table')}
            >
              <Table className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-full",
                selectedContentType === 'code' && "bg-secondary text-primary"
              )}
              title="Generate code"
              onClick={() => selectContentType('code')}
            >
              <Code className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-full",
                selectedContentType === 'text' && "bg-secondary text-primary"
              )}
              title="Generate text content"
              onClick={() => selectContentType('text')}
            >
              <FileText className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-full",
                showAttachmentOptions && "bg-secondary text-primary"
              )}
              title="Image analysis"
              onClick={toggleAttachmentOptions}
            >
              <div className="relative">
                <ImageIcon className="h-5 w-5" />
                {selectedImages.length > 0 && (
                  <div className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {selectedImages.length}
                  </div>
                )}
              </div>
            </Button>
          </div>
          
          {/* Multiple Image Upload UI */}
          {showAttachmentOptions && (
            <div className="mb-2 border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Upload Files</p>
                {selectedImages.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearSelectedImages}
                    className="h-7 px-2"
                  >
                    Clear All
                  </Button>
                )}
              </div>
              
              {/* Display selected files */}
              {selectedImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-3 max-h-32 overflow-y-auto p-1">
                  {selectedImages.map((file, index) => (
                    <div key={index} className="relative group border rounded bg-secondary/10 p-1">
                      <div className="h-14 w-full flex items-center">
                        {file.type.startsWith('image/') ? (
                          <img 
                            src={URL.createObjectURL(file)} 
                            alt={`Preview ${index}`} 
                            className="h-full max-h-12 max-w-full object-contain mx-auto"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full">
                            {getFileTypeIcon(file.type)}
                            <span className="ml-1 text-xs">{file.type.split('/')[0]}</span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-0 right-0 h-5 w-5 p-0 opacity-80 bg-black/40 text-white rounded-full"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <p className="text-xs truncate text-center">{file.name}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Upload button */}
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-5",
                    "border border-dashed hover:border-primary/50 transition-colors"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">
                    {selectedImages.length === 0 
                      ? "Upload Files" 
                      : "Add More Files"}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*,audio/*,application/pdf"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileSelection(Array.from(e.target.files));
                      }
                    }}
                  />
                </Button>
              </div>
            </div>
          )}
          
          <div className="flex w-full gap-2">
            <Input
              placeholder={getTranslation('type_message', currentLanguage)}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              type="button" 
              variant="outline"
              onClick={toggleListening}
              className={cn(isListening && "bg-red-100 text-red-600 border-red-200 hover:bg-red-200")}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || (!input.trim() && selectedImages.length === 0)}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardFooter>
    </Card>
  );
};

export default ChatUI;
