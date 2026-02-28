
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, Loader2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguageStore } from "@/store/languageStore";
import { getTranslation } from "@/utils/translations";
import { convertTextToSpeech, getVoiceNameForLanguage } from "@/services/elevenlabsService";

interface TextToSpeechButtonProps {
  text: string;
}

const TextToSpeechButton: React.FC<TextToSpeechButtonProps> = ({ text }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const { toast } = useToast();
  const { currentLanguage } = useLanguageStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Clean up audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlay = async () => {
    setIsLoading(true);
    try {
      // Stop any ongoing speech
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      // If browser is reading text, stop that too
      window.speechSynthesis.cancel();
      
      // Get audio blob using enhanced ElevenLabs service
      const audioBlob = await convertTextToSpeech(text, currentLanguage);
      
      // Create audio element for playing the audio
      const audioUrl = URL.createObjectURL(audioBlob);
      audioRef.current = new Audio(audioUrl);
      
      // Set up event listeners
      audioRef.current.onplay = () => setSpeaking(true);
      audioRef.current.onpause = () => setSpeaking(false);
      audioRef.current.onended = () => {
        setSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      // Get voice name for display
      const voiceName = getVoiceNameForLanguage(currentLanguage);
      
      // Start playing
      await audioRef.current.play();
      
      toast({
        title: getTranslation('playing_audio', currentLanguage),
        description: `${getTranslation('speaking', currentLanguage)} (${voiceName})`,
      });
    } catch (error) {
      console.error("Failed to play audio:", error);
      toast({
        title: getTranslation('error', currentLanguage),
        description: getTranslation('error_audio', currentLanguage),
        variant: "destructive",
      });
      setSpeaking(false);
    } finally {
      setIsLoading(false);
    }
  };

  const stopSpeaking = () => {
    // Stop all speech synthesis
    window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeaking(false);
  };

  return (
    <Button 
      variant="outline" 
      size="icon" 
      onClick={speaking ? stopSpeaking : handlePlay}
      disabled={isLoading || !text.trim()}
      title={speaking ? "Stop speaking" : "Listen to response"}
      className={`flex items-center justify-center ${speaking ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300" : ""}`}
    >
      {isLoading ? 
        <Loader2 className="h-4 w-4 animate-spin" /> : 
        <Volume2 className="h-4 w-4" />
      }
    </Button>
  );
};

export default TextToSpeechButton;
