
import React, { useState, useEffect } from "react";
import { Bot, X, Mic, MicOff, Send, Smile, Plus, Pencil, Table, Code, Text, FileText, ImageIcon, Video, Upload, Paperclip, FileAudio, FileVideo } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useLanguageStore } from "@/store/languageStore";
import { getTranslation } from "@/utils/translations";
import { useMessageStore } from "@/store/messageStore";
import { generateResponse } from "@/services/geminiService";
import { detectContentType, ContentType } from "@/utils/contentDetector";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { convertTextToSpeech, getVoiceNameForLanguage } from "@/services/elevenlabsService";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import ImageAttachment from "./ImageAttachment";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface GeneratedContent {
  type: ContentType;
  content: string;
  prompt: string;
}

const FloatingBotButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [showAnimation, setShowAnimation] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [selectedContentType, setSelectedContentType] = useState<ContentType | 'none'>('none');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const { toast } = useToast();
  const { currentLanguage } = useLanguageStore();
  const { addMessage, isLoading, setLoading } = useMessageStore();
  const recognitionRef = React.useRef<SpeechRecognition | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const navigate = useNavigate();
  
  const handleOpen = () => setIsOpen(true);
  const handleClose = () => {
    setIsOpen(false);
    setShowAnimation(false);
    stopListening();
    setTranscript("");
    setIsEditing(false);
    // Stop any audio playback when closing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  // Show animation whenever dialog is open
  useEffect(() => {
    if (isOpen) {
      setShowAnimation(true);
    } else {
      setShowAnimation(false);
    }
  }, [isOpen]);

  // Add effect to handle animation during talking
  useEffect(() => {
    if (isTalking) {
      setShowAnimation(true);
    }
  }, [isTalking]);

  // Lip sync animation for talking - more realistic
  useEffect(() => {
    if (isTalking) {
      const mouthElement = document.querySelector('.bot-mouth');
      if (mouthElement) {
        // Create audio analyzer for lip sync if speaking
        try {
          if (audioRef.current) {
            const audioContext = new AudioContext();
            const source = audioContext.createMediaElementSource(audioRef.current);
            const analyser = audioContext.createAnalyser();
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            
            analyser.fftSize = 32;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            const updateMouth = () => {
              if (isTalking && mouthElement) {
                analyser.getByteFrequencyData(dataArray);
                
                // Calculate average frequency value
                const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
                
                // Update mouth size based on volume
                const openness = Math.min(Math.max(average / 128, 0.1), 0.8);
                mouthElement.setAttribute('style', `height: ${openness * 20}px; border-radius: ${10 - openness * 5}px;`);
                
                requestAnimationFrame(updateMouth);
              }
            };
            
            updateMouth();
            
            return () => {
              // Clean up
              source.disconnect();
              analyser.disconnect();
            };
          }
        } catch (e) {
          console.error("Error setting up lip sync:", e);
        }
      }
    }
  }, [isTalking]);

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
      
      // Set language for speech recognition based on selected language
      recognitionRef.current.lang = currentLanguage.code;
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setShowAnimation(true);
        setTranscript("");
        toast({
          title: getTranslation('listening', currentLanguage),
          description: getTranslation('listening_description', currentLanguage),
        });
      };
      
      recognitionRef.current.onresult = (event) => {
        // Get only the final result to avoid duplication
        const currentTranscript = event.results[0][0].transcript;
        setTranscript(currentTranscript);
        
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
        setShowAnimation(false);
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
  
  // Enhanced function to speak the response with realistic lip-syncing
  const speakResponse = async (text: string) => {
    try {
      setIsTalking(true);
      setShowAnimation(true);
      
      // Use enhanced ElevenLabs service for audio
      const audioBlob = await convertTextToSpeech(text, currentLanguage);
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      audioRef.current = new Audio(audioUrl);
      
      // Set up event handlers for precise control of animation
      audioRef.current.onpause = () => {
        setIsTalking(false);
        // Keep animation showing as long as dialog is open
        if (!isListening && !isLoading && !isOpen) {
          setShowAnimation(false);
        }
      };
      
      audioRef.current.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setIsTalking(false);
        // Keep animation showing as long as dialog is open
        if (!isListening && !isLoading && !isOpen) {
          setShowAnimation(false);
        }
      };
      
      await audioRef.current.play();
    } catch (error) {
      console.error("Failed to play audio:", error);
      setIsTalking(false);
      toast({
        title: getTranslation('error', currentLanguage),
        description: getTranslation('error_audio', currentLanguage),
        variant: "destructive",
      });
    }
  };
  
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
    handleClose();
  };
  
  const handleSendMessage = async () => {
    if ((!transcript.trim() && selectedFiles.length === 0) || isLoading) return;
    
    // Create a message based on whether there are files or text input
    let messageContent = transcript.trim();
    if (selectedFiles.length > 0) {
      const fileNames = selectedFiles.map(file => file.name).join(", ");
      messageContent = transcript.trim() 
        ? `${transcript.trim()} (with ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}: ${fileNames})` 
        : `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}: ${fileNames}`;
    }
    
    addMessage(messageContent, "user");
    setLoading(true);
    
    // Display loading message immediately
    const loadingId = Math.random().toString(36).substring(2, 9);
    addMessage(getTranslation('loading', currentLanguage) + "...", "assistant", loadingId);
    
    setTranscript("");
    stopListening();
    
    try {
      setShowAnimation(true); // Keep animation while bot is "thinking"
      
      // Check for media files
      if (selectedFiles.length > 0) {
        // Process the media using Gemini API with the prompt
        const mediaPrompt = transcript.trim() || `Analyzing ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`;
        const response = await generateResponse(mediaPrompt, currentLanguage, selectedFiles);
        
        // Replace loading message with actual response
        const { editMessage } = useMessageStore.getState();
        editMessage(loadingId, response);
        
        // Speak a summary of the response
        speakResponse(`I've analyzed your ${selectedFiles.length > 1 ? 'files' : 'file'}. ${response.substring(0, 100)}...`);
        
        // Reset the selected files
        setSelectedFiles([]);
      } else {
        // Use selected content type if set, otherwise detect from message
        const contentType = selectedContentType !== 'none' ? 
          selectedContentType : 
          detectContentType(transcript.trim());
        
        // Reset the selected content type after use
        setSelectedContentType('none');
        
        // For regular conversations, just generate a normal response
        if (contentType === 'none') {
          const response = await generateResponse(transcript.trim(), currentLanguage);
          
          // Replace loading message with actual response
          const { editMessage } = useMessageStore.getState();
          editMessage(loadingId, response);
          
          // Speak the response and animate lip-sync
          speakResponse(response);
        } else {
          // If specialized content is requested, handle it differently
          try {
            // Replace the loading message to indicate specialized content is being generated
            const { editMessage } = useMessageStore.getState();
            editMessage(loadingId, `Generating ${contentType} content for you. Please wait...`);
            
            // Generate specialized content
            const content = await generateSpecializedContent(transcript.trim(), contentType);
            setGeneratedContent(content);
            
            // Update assistant message with info about generated content
            editMessage(
              loadingId, 
              `I've created ${contentType} content based on your request. You can now view or edit it using the specialized tools.`
            );
            
            // Speak confirmation message
            speakResponse(`I've created ${contentType} content based on your request. You can now view or edit it using the specialized tools.`);
            
          } catch (error) {
            console.error("Failed to generate specialized content:", error);
            const { editMessage } = useMessageStore.getState();
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
      
      // Update loading message with error
      const { editMessage } = useMessageStore.getState();
      editMessage(loadingId, getTranslation('error_response', currentLanguage));
      
      toast({
        title: getTranslation('error', currentLanguage),
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      });
      setIsTalking(false);
      setShowAnimation(false);
    } finally {
      setLoading(false);
    }
  };
  
  const toggleListening = () => {
    if (isListening) {
      stopListening();
      if (transcript.trim()) {
        handleSendMessage();
      }
    } else {
      startListening();
    }
  };

  // Handle text input manually
  const handleManualSend = async () => {
    if (!transcript.trim() && selectedFiles.length === 0) return;
    await handleSendMessage();
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };
  
  // Handle content type selection
  const selectContentType = (type: ContentType) => {
    setSelectedContentType(type === selectedContentType ? 'none' : type);
  };
  
  const toggleAttachmentOptions = () => {
    setShowAttachmentOptions(!showAttachmentOptions);
  };
  
  // Handle file selection for multiple images and video
  const handleFileSelection = (files: File[]) => {
    // Filter files - only images and videos allowed
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    
    // Check limits
    const imageFiles = validFiles.filter(file => file.type.startsWith('image/'));
    const videoFiles = validFiles.filter(file => file.type.startsWith('video/'));
    
    if (imageFiles.length > 20) {
      toast({
        title: "Too many images",
        description: "Maximum 20 images can be processed at once. Only the first 20 will be used.",
        variant: "destructive",
      });
    }
    
    if (videoFiles.length > 1) {
      toast({
        title: "Too many videos",
        description: "Only one video can be processed at a time. Only the first video will be used.",
        variant: "destructive",
      });
    }
    
    // Limit to 20 images and 1 video
    const finalImageFiles = imageFiles.slice(0, 20);
    const finalVideoFiles = videoFiles.slice(0, 1);
    
    setSelectedFiles([...finalImageFiles, ...finalVideoFiles]);
  };
  
  // Clear selected files
  const clearSelectedFiles = () => {
    setSelectedFiles([]);
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 rounded-full h-14 w-14 p-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-primary to-blue-400"
        size="icon"
      >
        <Bot className="h-6 w-6 text-white" />
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md rounded-xl max-h-[90vh] flex flex-col">
          <DialogHeader className="mb-2">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-gradient-to-br from-primary to-blue-400 rounded-full flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                MahmudGPT
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => {
                  handleClose();
                  // Reset the conversation
                  useMessageStore.getState().clearMessages();
                  toast({
                    title: getTranslation('chat_cleared', currentLanguage),
                    description: getTranslation('chat_cleared_description', currentLanguage),
                  });
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTitle>
            <DialogDescription>
              {isTalking ? 
                `${getTranslation('speaking', currentLanguage)} (${getVoiceNameForLanguage(currentLanguage)})` : 
                getTranslation('welcome_description', currentLanguage)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center p-4 flex-grow overflow-hidden">
            {/* 3D Animation Container */}
            <div className="mb-6 h-32 w-32 relative">
              {showAnimation ? (
                <div className="bot-animation absolute inset-0">
                  <div className="bot-face">
                    <div className="bot-eyes"></div>
                    {/* Expression changes based on state */}
                    {isListening && <div className="bot-mouth listening"></div>}
                    {!isListening && isLoading && <div className="bot-mouth thinking"></div>}
                    {isTalking && <div className="bot-mouth talking"></div>}
                    {!isListening && !isLoading && !isTalking && (
                      <div className="bot-mouth smiling"></div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full w-full rounded-full bg-gradient-to-br from-primary/20 to-blue-400/20 flex items-center justify-center">
                  <Smile className="h-16 w-16 text-primary" />
                </div>
              )}
            </div>
            
            {/* Generated Content UI */}
            {generatedContent && (
              <div className="w-full mb-4 p-4 border rounded-lg bg-secondary/20 animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {generatedContent.type === 'table' && <Table className="h-5 w-5 text-primary animate-scale-in" />}
                    {generatedContent.type === 'code' && <Code className="h-5 w-5 text-primary animate-scale-in" />}
                    {generatedContent.type === 'text' && <Text className="h-5 w-5 text-primary animate-scale-in" />}
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
                    className="w-full mt-2 animate-fade-in"
                    variant="outline"
                  >
                    Open in Tools
                  </Button>
                )}
              </div>
            )}
            
            <div className="w-full mb-4 relative flex-grow overflow-auto max-h-[45vh]">
              <div className="relative border rounded-lg p-3 min-h-20 text-sm h-full overflow-y-auto">
                {isEditing ? (
                  <Input
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    className="w-full min-h-[100px]"
                    placeholder={getTranslation('edit_message', currentLanguage)}
                    autoFocus
                  />
                ) : (
                  transcript || (isListening 
                    ? getTranslation('listening', currentLanguage) + "..." 
                    : getTranslation('type_message', currentLanguage))
                )}
                
                {transcript && !isListening && !isEditing && (
                  <button 
                    onClick={toggleEditMode}
                    className="absolute top-2 right-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label="Edit message"
                  >
                    <Pencil size={16} className="text-gray-500" />
                  </button>
                )}
              </div>
            </div>
            
            {/* File attachment UI */}
            {showAttachmentOptions && (
              <div className="w-full mb-4 animate-fade-in">
                <div className="border rounded-lg p-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium">Upload Files</h3>
                      {selectedFiles.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={clearSelectedFiles}>
                          Clear all
                        </Button>
                      )}
                    </div>
                    
                    {/* Show selected files */}
                    {selectedFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {selectedFiles.map((file, index) => (
                          <div 
                            key={index} 
                            className="flex items-center gap-1 bg-secondary/30 rounded px-2 py-1 text-xs"
                          >
                            {file.type.startsWith('image/') ? (
                              <ImageIcon className="h-3 w-3" />
                            ) : (
                              <Video className="h-3 w-3" />
                            )}
                            <span className="max-w-[100px] truncate">{file.name}</span>
                            <button 
                              onClick={() => {
                                setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
                              }}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* File upload controls */}
                    <div className="flex justify-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <label 
                              className="cursor-pointer flex items-center justify-center p-8 w-full border-2 border-dashed rounded-lg hover:bg-secondary/20 transition-colors"
                            >
                              <input 
                                type="file" 
                                multiple 
                                accept="image/*,video/*" 
                                className="hidden" 
                                onChange={(e) => {
                                  if (e.target.files) {
                                    const fileArray = Array.from(e.target.files);
                                    handleFileSelection(fileArray);
                                  }
                                }}
                              />
                              <div className="flex flex-col items-center gap-2">
                                <Upload className="h-8 w-8 text-gray-400" />
                                <span className="text-sm text-gray-500">
                                  {selectedFiles.length > 0 
                                    ? "Add more files" 
                                    : "Upload images or video"}
                                </span>
                                <span className="text-xs text-gray-400">
                                  Up to 20 images or 1 video (max 2 minutes)
                                </span>
                              </div>
                            </label>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Click to select files or drag and drop</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Content Type Selection Icons with animations */}
            <div className="flex justify-center gap-2 w-full mb-2">
              <Button
                variant="ghost"
                size="icon"
                className={`rounded-full hover-scale transition-all duration-300 ${
                  selectedContentType === 'table' && "bg-secondary text-primary animate-scale-in"
                }`}
                title="Generate table content"
                onClick={() => selectContentType('table')}
              >
                <Table className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`rounded-full hover-scale transition-all duration-300 ${
                  selectedContentType === 'code' && "bg-secondary text-primary animate-scale-in"
                }`}
                title="Generate code"
                onClick={() => selectContentType('code')}
              >
                <Code className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`rounded-full hover-scale transition-all duration-300 ${
                  selectedContentType === 'text' && "bg-secondary text-primary animate-scale-in"
                }`}
                title="Generate text content"
                onClick={() => selectContentType('text')}
              >
                <FileText className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`rounded-full hover-scale transition-all duration-300 ${
                  showAttachmentOptions && "bg-secondary text-primary animate-scale-in"
                }`}
                title="Attach files"
                onClick={toggleAttachmentOptions}
              >
                {selectedFiles.length > 0 ? (
                  <div className="relative">
                    <ImageIcon className="h-5 w-5" />
                    <div className="absolute -top-2 -right-2 h-4 w-4 bg-primary text-white rounded-full text-[10px] flex items-center justify-center">
                      {selectedFiles.length}
                    </div>
                  </div>
                ) : (
                  <ImageIcon className="h-5 w-5" />
                )}
              </Button>
            </div>
            
            <div className="flex gap-2 w-full mt-auto">
              {isEditing ? (
                <>
                  <Button 
                    type="button"
                    onClick={() => {
                      toggleEditMode();
                      if (transcript.trim()) {
                        handleManualSend();
                      }
                    }}
                    className="flex-1"
                  >
                    Save
                  </Button>
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => {
                      toggleEditMode();
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    type="button" 
                    onClick={toggleListening}
                    className={cn("flex-1", 
                      isListening && "bg-red-100 text-red-600 border-red-200 hover:bg-red-200"
                    )}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="h-4 w-4 mr-2" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 mr-2" />
                        Speak
                      </>
                    )}
                  </Button>

                  <Button 
                    type="button" 
                    onClick={handleManualSend}
                    disabled={(!transcript.trim() && selectedFiles.length === 0) || isLoading}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                </>
              )}
              
              <Button 
                variant="outline" 
                onClick={handleClose}
              >
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FloatingBotButton;
