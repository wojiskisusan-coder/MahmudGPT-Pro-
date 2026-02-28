import React, { useState, useCallback, useRef } from "react";
import { Phone, PhoneOff, Volume2, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const VOICES = [
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah" },
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel" },
  { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice" },
];

interface Props {
  onSpeakText: (text: string, voiceId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const VoiceChat: React.FC<Props> = ({ onSpeakText, isOpen, onClose }) => {
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0]);
  const [showSettings, setShowSettings] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = useCallback(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SR();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.onresult = (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript;
      onSpeakText(transcript, selectedVoice.id);
    };
    recognitionRef.current.onerror = () => setIsListening(false);
    recognitionRef.current.onend = () => setIsListening(false);
    recognitionRef.current.start();
    setIsListening(true);
  }, [selectedVoice, onSpeakText]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center">
      <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-accent text-muted-foreground">
        <PhoneOff className="h-5 w-5" />
      </button>

      <div className="flex flex-col items-center gap-8">
        {/* Voice visualizer */}
        <div className={cn(
          "relative h-32 w-32 rounded-full flex items-center justify-center",
          isListening && "voice-pulse"
        )}>
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: "2s" }} />
          <div className="absolute inset-2 rounded-full bg-primary/30" />
          <div className="relative h-20 w-20 rounded-full bg-primary flex items-center justify-center glow-border">
            <Volume2 className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>

        <p className="text-lg font-semibold">
          {isListening ? "Listening..." : "Tap to speak"}
        </p>
        <p className="text-sm text-muted-foreground">Voice: {selectedVoice.name}</p>

        <div className="flex items-center gap-4">
          <Button
            size="lg"
            className={cn("rounded-full h-14 w-14", isListening && "bg-destructive hover:bg-destructive/90")}
            onClick={isListening ? stopListening : startListening}
          >
            {isListening ? <PhoneOff className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
          </Button>
          <Button variant="outline" size="icon" className="rounded-full h-10 w-10" onClick={() => setShowSettings(!showSettings)}>
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>

        {showSettings && (
          <div className="bg-card border border-border rounded-xl p-4 w-72 space-y-3 animate-in fade-in slide-in-from-bottom-2">
            <h4 className="text-sm font-semibold">Voice Settings</h4>
            <div className="grid grid-cols-2 gap-2">
              {VOICES.map(v => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVoice(v)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs border transition-all",
                    selectedVoice.id === v.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"
                  )}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceChat;
