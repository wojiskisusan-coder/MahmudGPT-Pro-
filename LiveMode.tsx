import React, { useState, useRef, useCallback, useEffect } from "react";
import { Camera, CameraOff, Monitor, MonitorOff, Phone, PhoneOff, Volume2, Settings2, SwitchCamera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { streamChat, speakWithElevenLabs, type ChatMessage } from "@/services/chatService";
import { speak } from "@/services/ttsService";

const VOICES = [
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah" },
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily" },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  voiceId: string;
}

type LiveModeType = "camera" | "screen" | "voice";

const LiveMode: React.FC<Props> = ({ isOpen, onClose, voiceId }) => {
  const [mode, setMode] = useState<LiveModeType>("voice");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [selectedVoice, setSelectedVoice] = useState(voiceId);
  const [showSettings, setShowSettings] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const captureIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      stopStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setMode("camera");
    } catch (err) {
      console.error("Camera error:", err);
    }
  }, [facingMode]);

  // Start screen share
  const startScreenShare = useCallback(async () => {
    try {
      stopStream();
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      stream.getVideoTracks()[0].onended = () => setMode("voice");
      setMode("screen");
    } catch (err) {
      console.error("Screen share error:", err);
    }
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const switchToVoice = useCallback(() => {
    stopStream();
    setMode("voice");
  }, [stopStream]);

  // Capture frame as base64
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, 640, 480);
    return canvas.toDataURL("image/jpeg", 0.7).split(",")[1];
  }, []);

  // Start listening
  const startListening = useCallback(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (e) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          final += e.results[i][0].transcript;
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      if (final) {
        setTranscript(final);
        handleUserMessage(final);
      } else {
        setTranscript(interim);
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => {
      if (isListening) {
        try { recognition.start(); } catch (err) {
          console.error("Speech recognition restart failed:", err);
        }
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }, [isListening]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  // Send message to AI with optional frame
  const handleUserMessage = useCallback(async (text: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setAiResponse("");

    const fileData: { name: string; type: string; base64: string }[] = [];

    // Capture frame if in camera/screen mode
    if (mode !== "voice") {
      const frame = captureFrame();
      if (frame) {
        fileData.push({ name: "live-frame.jpg", type: "image/jpeg", base64: frame });
      }
    }

    const newHistory: ChatMessage[] = [...chatHistory, { role: "user", content: text }];

    let response = "";
    try {
      await streamChat({
        messages: newHistory,
        mode: "assistant",
        fileData: fileData.length > 0 ? fileData : undefined,
        onDelta: (chunk) => {
          response += chunk;
          setAiResponse(response);
        },
        onDone: async () => {
          setIsProcessing(false);
          setChatHistory([...newHistory, { role: "assistant", content: response }]);
          setIsSpeaking(true);
          try {
            await speakWithElevenLabs(response.slice(0, 2000), selectedVoice);
          } catch {
            speak(response);
          }
          setIsSpeaking(false);
        },
        onError: (err) => {
          setIsProcessing(false);
          setAiResponse("Sorry, an error occurred: " + err);
        },
      });
    } catch {
      setIsProcessing(false);
    }
  }, [chatHistory, mode, captureFrame, selectedVoice, isProcessing]);

  // Toggle camera facing
  const toggleCamera = useCallback(() => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  }, []);

  useEffect(() => {
    if (mode === "camera" && isOpen) startCamera();
  }, [facingMode]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopStream();
      stopListening();
      if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/98 backdrop-blur-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <h3 className="text-sm font-semibold font-['Space_Grotesk'] gradient-text">Live Mode</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/50 text-muted-foreground capitalize">{mode}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSettings(!showSettings)}>
            <Settings2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => { stopStream(); stopListening(); onClose(); }}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-4 overflow-auto">
        {/* Video feed */}
        {mode !== "voice" && (
          <div className="relative w-full max-w-lg rounded-2xl overflow-hidden border border-border/30 bg-black">
            <video
              ref={videoRef}
              className="w-full aspect-video object-cover"
              playsInline
              muted
              autoPlay
            />
            {mode === "camera" && (
              <button
                onClick={toggleCamera}
                className="absolute bottom-3 right-3 p-2 rounded-full bg-background/60 backdrop-blur-sm hover:bg-background/80 transition-all"
              >
                <SwitchCamera className="h-4 w-4" />
              </button>
            )}
            {isProcessing && (
              <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] text-primary font-medium">Analyzing...</span>
              </div>
            )}
          </div>
        )}

        {/* Voice visualizer (voice-only mode) */}
        {mode === "voice" && (
          <div className={cn("relative h-32 w-32 rounded-full flex items-center justify-center", isListening && "voice-pulse")}>
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: "2s" }} />
            <div className="absolute inset-2 rounded-full bg-primary/30" />
            <div className="relative h-20 w-20 rounded-full bg-primary flex items-center justify-center glow-border">
              <Volume2 className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
        )}

        {/* Status */}
        <div className="text-center">
          <p className="text-lg font-semibold">
            {isProcessing ? "Thinking..." : isSpeaking ? "Speaking..." : isListening ? "Listening..." : "Tap to start"}
          </p>
          {transcript && (
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              You: "{transcript}"
            </p>
          )}
          {aiResponse && (
            <p className="text-sm text-primary/80 mt-2 max-w-md line-clamp-3">
              AI: {aiResponse.slice(0, 200)}{aiResponse.length > 200 ? "..." : ""}
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Camera toggle */}
          <Button
            variant="outline"
            size="icon"
            className={cn("rounded-full h-12 w-12", mode === "camera" && "border-primary bg-primary/10 text-primary")}
            onClick={mode === "camera" ? switchToVoice : startCamera}
          >
            {mode === "camera" ? <CameraOff className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
          </Button>

          {/* Main mic button */}
          <Button
            size="lg"
            className={cn(
              "rounded-full h-16 w-16",
              isListening ? "bg-destructive hover:bg-destructive/90" : "shiny-button"
            )}
            onClick={isListening ? stopListening : startListening}
          >
            {isListening ? <PhoneOff className="h-7 w-7" /> : <Phone className="h-7 w-7" />}
          </Button>

          {/* Screen share toggle */}
          <Button
            variant="outline"
            size="icon"
            className={cn("rounded-full h-12 w-12", mode === "screen" && "border-primary bg-primary/10 text-primary")}
            onClick={mode === "screen" ? switchToVoice : startScreenShare}
          >
            {mode === "screen" ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
          </Button>
        </div>

        {/* Voice settings */}
        {showSettings && (
          <div className="bg-card border border-border rounded-xl p-4 w-72 space-y-3 animate-in fade-in slide-in-from-bottom-2">
            <h4 className="text-sm font-semibold">Voice Settings</h4>
            <div className="grid grid-cols-2 gap-2">
              {VOICES.map(v => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVoice(v.id)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs border transition-all",
                    selectedVoice === v.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"
                  )}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default LiveMode;