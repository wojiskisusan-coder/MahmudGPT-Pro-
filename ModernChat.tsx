import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, Mic, MicOff, ArrowDown, Menu, Phone, Settings2, Sparkles, Crown, LogOut, FileSearch, Volume2, VolumeX, Video, Image as ImageIcon, Film, Plus, BarChart3, Cpu, Search, Code, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { streamChat, generateImage, fileToBase64, type ChatMessage as ChatMsg } from "@/services/chatService";
import { speak, stopSpeaking } from "@/services/ttsService";
import { audioController } from "@/services/audioController";
import { convertTextToSpeech } from "@/services/elevenlabsService";
import { cleanTextForSpeech } from "@/utils/textCleaner";
import MessageBubble from "./MessageBubble";
import type { AiMode } from "./chat/ModeSelector";
import ChatSidebar from "./chat/ChatSidebar";
import CodeCanvas from "./chat/CodeCanvas";
import WritingCanvas from "./chat/WritingCanvas";
import FileUpload, { type UploadedFile } from "./chat/FileUpload";
import VoiceChat from "./chat/VoiceChat";
import LiveMode from "./chat/LiveMode";
import SettingsPanel, { DEFAULT_SETTINGS, type UserSettings } from "./chat/SettingsPanel";
import RGBBackground from "./RGBBackground";
import FloatingBadge from "./FloatingBadge";
import ProPlanModal from "./ProPlanModal";
import OnboardingModal from "./chat/OnboardingModal";
import { useUsageLimit } from "@/hooks/useUsageLimit";
import { useChatPersistence, type ChatMessage } from "@/hooks/useChatPersistence";
import { useToast } from "@/hooks/use-toast";
// Auth removed — no login required
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";

const MODE_COLORS: Record<string, string> = {
  assistant: "blue", codex: "purple", thinking: "purple", research: "cyan",
  "deep-research": "orange", math: "blue", analyst: "green", creative: "orange",
  image: "purple", writer: "green", guided: "cyan", flutter: "blue", ios: "blue",
  developer: "slate",
};

const HERO_SUGGESTIONS = [
  { text: "Analyze patient diagnostic data trends", icon: <BarChart3 className="h-4 w-4" />, label: "Medical Analyst" },
  { text: "Debug kernel-level memory leaks", icon: <Cpu className="h-4 w-4" />, label: "Systems Dev" },
  { text: "Synthesize latest oncology research", icon: <Search className="h-4 w-4" />, label: "Clinical Research" },
  { text: "Architect a scalable microservices mesh", icon: <Code className="h-4 w-4" />, label: "Architecture" },
  { text: "Generate high-res surgical diagrams", icon: <ImageIcon className="h-4 w-4" />, label: "Medical Visualization" },
  { text: "Draft a technical whitepaper on AI safety", icon: <Pencil className="h-4 w-4" />, label: "Technical Writing" },
];

const MODE_OPTIONS = [
  { id: "assistant", icon: "🧠", label: "Think" },
  { id: "image", icon: "🖼", label: "Image" },
  { id: "codex", icon: "💻", label: "Code" },
  { id: "research", icon: "📊", label: "Research" },
  { id: "math", icon: "🧮", label: "Math" },
  { id: "creative", icon: "🎨", label: "Creative" },
  { id: "writer", icon: "📚", label: "Write" },
];

const ModernChat: React.FC = () => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [activeMode, setActiveMode] = useState<AiMode>("assistant");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [codeCanvasContent, setCodeCanvasContent] = useState<string | null>(null);
  const [writingCanvasContent, setWritingCanvasContent] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [voiceChatOpen, setVoiceChatOpen] = useState(false);
  const [liveModeOpen, setLiveModeOpen] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    try { return JSON.parse(localStorage.getItem("mahmudgpt-voice-enabled") || "false"); } catch { return false; }
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [proModalOpen, setProModalOpen] = useState(false);
  const [proModalReason, setProModalReason] = useState<"limit" | "locked">("limit");
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("mahmudgpt-onboarding-seen");
    if (!hasSeenOnboarding) {
      setOnboardingOpen(true);
      localStorage.setItem("mahmudgpt-onboarding-seen", "true");
    }
  }, []);
  const [researchProgress, setResearchProgress] = useState(0);
  const [isResearching, setIsResearching] = useState(false);
  const [showModePanel, setShowModePanel] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(() => {
    try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem("mahmudgpt-settings") || "{}") }; } catch { return DEFAULT_SETTINGS; }
  });

  // @Image / @Video trigger detection
  const [triggerMode, setTriggerMode] = useState<"image" | "video" | null>(null);

  useEffect(() => {
    const trimmed = input.trimStart();
    if (trimmed.startsWith("@Image ") || trimmed.startsWith("@image ")) {
      setTriggerMode("image");
    } else if (trimmed.startsWith("@Video ") || trimmed.startsWith("@video ")) {
      setTriggerMode("video");
    } else {
      setTriggerMode(null);
    }
  }, [input]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const modePanelRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const usage = useUsageLimit();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const chat = useChatPersistence();

  // Auth guard removed for now
  useEffect(() => {
    // No-op
  }, []);

  useEffect(() => { document.documentElement.classList.add("dark"); }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-neon", "theme-emerald", "theme-flutter", "theme-ios");
    if (settings.theme === "neon") root.classList.add("theme-neon");
    if (settings.theme === "emerald") root.classList.add("theme-emerald");
    if (settings.theme === "flutter") root.classList.add("theme-flutter");
    if (settings.theme === "ios") root.classList.add("theme-ios");
  }, [settings.theme]);

  // Close mode panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modePanelRef.current && !modePanelRef.current.contains(e.target as Node)) {
        setShowModePanel(false);
      }
    };
    if (showModePanel) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showModePanel]);

  const saveSettings = (s: UserSettings) => {
    setSettings(s);
    localStorage.setItem("mahmudgpt-settings", JSON.stringify(s));
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [chat.messages, scrollToBottom]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 100);
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const downloadReport = (content: string) => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "research-report.md"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleLockedMode = () => { setProModalReason("locked"); setProModalOpen(true); };

  const send = async () => {
    let text = input.trim();
    if (!text || isLoading) return;

    if (!usage.canSend) { setProModalReason("limit"); setProModalOpen(true); return; }
    usage.increment();

    // Handle @Image / @Video triggers
    let effectiveMode = activeMode;
    if (triggerMode === "image") {
      text = text.replace(/^@[Ii]mage\s+/, "");
      effectiveMode = "image";
    } else if (triggerMode === "video") {
      text = text.replace(/^@[Vv]ideo\s+/, "");
      toast({ title: "Video Generation", description: "Video generation is coming soon! Try @Image instead.", variant: "default" });
      setInput("");
      return;
    }

    const fileDataPromises = uploadedFiles.map(async (f) => ({
      name: f.file.name, type: f.file.type, base64: await fileToBase64(f.file),
    }));
    const fileData = uploadedFiles.length > 0 ? await Promise.all(fileDataPromises) : undefined;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(), role: "user", content: input.trim(),
      files: uploadedFiles.map(f => ({ name: f.file.name, type: f.file.type, previewUrl: f.previewUrl })),
    };

    let convId = chat.activeConvId;
    if (!convId) {
      convId = await chat.createConversation(text.slice(0, 40), effectiveMode);
    }

    chat.setMessages(prev => [...prev, userMsg]);
    setInput("");
    setUploadedFiles([]);
    setIsLoading(true);
    setTriggerMode(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    if (convId) chat.addMessage(convId, { role: "user", content: userMsg.content, files: userMsg.files });

    if (effectiveMode === "image") {
      try {
        const imageUrl = await generateImage(text);
        const assistantMsg: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: `Here's your generated image for: "${text}"`, imageUrl };
        chat.setMessages(prev => [...prev, assistantMsg]);
        if (convId) chat.addMessage(convId, { role: "assistant", content: assistantMsg.content, imageUrl });
      } catch (e: unknown) {
        const err = e as Error;
        toast({ title: "Image Error", description: err.message || "Failed to generate image", variant: "destructive" });
      }
      setIsLoading(false);
      return;
    }

    // Deep research progress simulation
    let progressInterval: ReturnType<typeof setInterval> | null = null;
    if (effectiveMode === "deep-research") {
      setIsResearching(true);
      setResearchProgress(0);
      let p = 0;
      progressInterval = setInterval(() => {
        p += Math.random() * 3 + 0.5;
        if (p > 92) p = 92;
        setResearchProgress(p);
      }, 500);
    }

    let assistantContent = "";
    let thinkingContent = "";
    const assistantId = crypto.randomUUID();
    const chatHistory: ChatMsg[] = [...chat.messages, userMsg].map(m => ({ role: m.role, content: m.content }));

    try {
      await streamChat({
        messages: chatHistory, mode: effectiveMode, fileData,
        onThinking: (chunk) => {
          if (!settings.showThinking) return;
          thinkingContent += chunk;
          chat.setMessages(prev => {
            const exists = prev.find(m => m.id === assistantId);
            if (exists) return prev.map(m => m.id === assistantId ? { ...m, thinking: thinkingContent, isStreaming: true } : m);
            return [...prev, { id: assistantId, role: "assistant", content: "", thinking: thinkingContent, isStreaming: true }];
          });
        },
        onDelta: (chunk) => {
          assistantContent += chunk;
          chat.setMessages(prev => {
            const exists = prev.find(m => m.id === assistantId);
            if (exists) return prev.map(m => m.id === assistantId ? { ...m, content: assistantContent, isStreaming: true } : m);
            return [...prev, { id: assistantId, role: "assistant", content: assistantContent, isStreaming: true }];
          });
          if (effectiveMode === "codex" && assistantContent.includes("```") && !codeCanvasContent) setCodeCanvasContent(assistantContent);
          if (effectiveMode === "writer" && assistantContent.length > 200 && !writingCanvasContent) setWritingCanvasContent(assistantContent);
        },
        onDone: () => {
          setIsLoading(false);
          if (progressInterval) { clearInterval(progressInterval); setResearchProgress(100); setTimeout(() => { setIsResearching(false); setResearchProgress(0); }, 1000); }
          chat.setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, isStreaming: false } : m));
          if (codeCanvasContent && assistantContent.includes("```")) setCodeCanvasContent(assistantContent);
          if (writingCanvasContent) setWritingCanvasContent(assistantContent);
          if (settings.autoTTS && assistantContent) {
            handleSpeak(assistantContent, assistantId);
          }
          if (convId) chat.addMessage(convId, { role: "assistant", content: assistantContent, thinking: thinkingContent || undefined });
        },
        onError: (err) => {
          toast({ title: "Error", description: err, variant: "destructive" });
          setIsLoading(false);
          if (progressInterval) { clearInterval(progressInterval); setIsResearching(false); setResearchProgress(0); }
        },
      });
    } catch (e) {
      console.error(e);
      setIsLoading(false);
      toast({ title: "Error", description: "Failed to get response.", variant: "destructive" });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const handleNewChat = () => { chat.newChat(); audioController.stop(); stopSpeaking(); setCodeCanvasContent(null); setWritingCanvasContent(null); };
  const handleDeleteConv = (id: string) => { chat.deleteConversation(id); if (chat.activeConvId === id) handleNewChat(); };

  const toggleListening = () => {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      toast({ title: "Not supported", description: "Speech recognition is not available.", variant: "destructive" }); return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SR();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.onresult = (e) => { setInput(prev => prev + e.results[0][0].transcript); setIsListening(false); };
    recognitionRef.current.onerror = () => setIsListening(false);
    recognitionRef.current.onend = () => setIsListening(false);
    recognitionRef.current.start();
    setIsListening(true);
  };

  /** Global speak handler using audioController */
  const handleSpeak = async (text: string, messageId: string) => {
    if (audioController.isActiveFor(messageId) && (audioController.isPlaying || audioController.isLoading)) {
      audioController.stop();
      return;
    }
    audioController.setLoading(messageId);
    try {
      const blob = await convertTextToSpeech(text.slice(0, 2000), settings.voiceId || "en");
      // Check if still active (user may have cancelled)
      if (audioController.isActiveFor(messageId)) {
        await audioController.playBlob(blob, messageId);
      }
    } catch {
      // Fallback to browser TTS
      audioController.stop();
      speak(cleanTextForSpeech(text));
    }
  };

  const handleVoiceSpeak = async (text: string) => {
    setInput(text);
    setVoiceChatOpen(false);
    setTimeout(() => send(), 100);
  };

  const handleAutoDebug = (code: string) => {
    setInput(`Please debug this code and fix any issues:\n\n${code}`);
    setActiveMode("codex");
    setCodeCanvasContent(null);
    textareaRef.current?.focus();
  };

  const showCanvas = codeCanvasContent !== null || writingCanvasContent !== null;
  const fontSize = settings.fontSize === "sm" ? "text-xs" : settings.fontSize === "lg" ? "text-base" : "text-sm";
  const usagePercent = usage.isPro ? 100 : Math.min((usage.count / usage.limit) * 100, 100);

  return (
    <div className="flex h-dvh overflow-hidden relative">
      <RGBBackground modeColor={MODE_COLORS[activeMode] || "purple"} />

      <ChatSidebar
        conversations={chat.conversations} activeId={chat.activeConvId}
        onSelect={chat.setActiveConvId} onNew={handleNewChat} onDelete={handleDeleteConv}
        isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}
        onUpgrade={() => { setProModalReason("locked"); setProModalOpen(true); }}
        activeMode={activeMode} onModeChange={setActiveMode}
        isPro={usage.isPro} onLockedMode={handleLockedMode}
        theme={settings.theme}
      />

      <div className={cn(
        "flex-1 flex flex-col min-w-0 relative z-10 pb-20 md:pb-0", 
        showCanvas && "hidden md:flex",
        settings.theme === "ios" && "bg-background"
      )}>
        {/* Header */}
        <header className={cn(
          "flex items-center gap-2 px-3 py-2.5 border-b border-border/5 bg-card/30 backdrop-blur-3xl sticky top-0 z-10",
          settings.theme === "ios" && "ios-blur border-b-border/20"
        )}>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent/30 rounded-xl" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-primary via-primary/80 to-primary/50 flex items-center justify-center shadow-lg shadow-primary/20 animate-logo-pulse">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            {!isMobile && (
              <div>
                <h1 className="text-sm font-bold font-['Space_Grotesk'] gradient-text leading-none">MahmudGPT</h1>
                <p className="text-[8px] text-muted-foreground/40 leading-none mt-0.5">World's Best AI</p>
              </div>
            )}
          </div>

          {/* Active mode badge */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-full glass-panel text-[9px] font-medium text-muted-foreground">
            <span>{MODE_OPTIONS.find(m => m.id === activeMode)?.icon || "🧠"}</span>
            <span className="hidden sm:inline">{MODE_OPTIONS.find(m => m.id === activeMode)?.label || "Think"}</span>
          </div>

          {/* Usage progress bar */}
          {!usage.isPro && (
            <div className="hidden sm:flex items-center gap-2 mr-1">
              <div className="w-20 h-1.5 rounded-full bg-accent/30 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary/60 transition-all duration-500"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <span className="text-[9px] text-muted-foreground/50 font-mono">{usage.count}/{usage.limit}</span>
            </div>
          )}

          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost" size="icon"
              className={cn("h-8 w-8 rounded-xl hover:bg-accent/30", voiceEnabled && "text-primary bg-primary/10")}
              onClick={() => {
                const newVal = !voiceEnabled;
                setVoiceEnabled(newVal);
                localStorage.setItem("mahmudgpt-voice-enabled", JSON.stringify(newVal));
                saveSettings({ ...settings, autoTTS: newVal });
              }}
              title={voiceEnabled ? "Voice On" : "Voice Off"}
            >
              {voiceEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-accent/30" onClick={() => setLiveModeOpen(true)} title="Live Mode">
              <Video className="h-3.5 w-3.5" />
            </Button>
            {!isMobile && (
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-accent/30" onClick={() => setVoiceChatOpen(true)}>
                <Phone className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-accent/30" onClick={() => setSettingsOpen(true)}>
              <Settings2 className="h-3.5 w-3.5" />
            </Button>
            {!usage.isPro && (
              <button
                onClick={() => { setProModalReason("locked"); setProModalOpen(true); }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[9px] font-semibold shiny-button text-primary-foreground ml-0.5"
              >
                <Crown className="h-2.5 w-2.5" />
                <span className="hidden sm:inline">Pro</span>
              </button>
            )}
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto message-list">
          {chat.loadingMessages ? (
            <div className="flex flex-col gap-4 p-4 max-w-3xl mx-auto mt-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-20 rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-2xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : chat.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 gap-8">
              {/* Ultra Hero */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent rounded-full blur-3xl scale-150" />
                <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-3xl bg-gradient-to-br from-primary via-primary/70 to-primary/40 flex items-center justify-center animate-hero-glow shadow-2xl shadow-primary/30">
                  <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 text-primary-foreground animate-float" />
                </div>
              </div>

              <div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-2 font-['Space_Grotesk'] gradient-text">MahmudGPT</h2>
                <p className="text-xs sm:text-sm text-muted-foreground/40">What can I help you with today?</p>
              </div>

              {/* Suggestion Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl w-full px-4">
                {HERO_SUGGESTIONS.map((s) => (
                  <button
                    key={s.text}
                    onClick={() => setInput(s.text)}
                    className="suggestion-card text-left p-4 rounded-2xl border border-border/10 glass-panel group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        {s.icon}
                      </div>
                      <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">{s.label}</span>
                    </div>
                    <span className="block text-xs leading-relaxed text-muted-foreground/80 group-hover:text-foreground transition-colors font-medium">{s.text}</span>
                  </button>
                ))}
              </div>

              {!usage.isPro && (
                <p className="text-[9px] text-muted-foreground/25">{usage.remaining} messages remaining today</p>
              )}
            </div>
          ) : (
            <div className={fontSize}>
              {chat.messages.map(msg => (
                <MessageBubble
                  key={msg.id} message={msg}
                  onSpeak={handleSpeak}
                  onOpenCodeCanvas={setCodeCanvasContent}
                  onOpenWritingCanvas={setWritingCanvasContent}
                  onDownloadReport={activeMode === "deep-research" ? downloadReport : undefined}
                  theme={settings.theme}
                />
              ))}
              {isLoading && !chat.messages.find(m => m.role === "assistant" && m.isStreaming) && (
                <div className="px-4 py-6 flex flex-col items-center gap-3">
                  {isResearching && (
                    <div className="w-full max-w-md space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <FileSearch className="h-3.5 w-3.5 text-primary animate-pulse" />
                        <span>Deep researching… analyzing sources</span>
                        <span className="ml-auto font-mono text-primary">{Math.round(researchProgress)}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-accent/30 overflow-hidden">
                        <div
                          className="h-full rounded-full research-progress-bar transition-all duration-500 ease-out"
                          style={{ width: `${researchProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {!isResearching && (
                    <div className="flex items-center gap-3">
                      <div className="typing-indicator"><span /><span /><span /></div>
                      <span className="text-[10px] text-muted-foreground/40">Thinking...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {showScrollBtn && (
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10">
            <Button variant="secondary" size="icon" className="rounded-full shadow-xl h-9 w-9 glass-panel border border-border/20" onClick={scrollToBottom}>
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Input Area */}
        <div className={cn(
          "border-t border-border/5 bg-card/20 backdrop-blur-3xl p-2.5 sm:p-3",
          settings.theme === "ios" && "ios-blur border-t-border/20"
        )}>
          <div className="max-w-3xl mx-auto">
            {/* @Trigger indicator */}
            {triggerMode && (
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 mb-2 rounded-xl text-[10px] font-medium border animate-fade-in",
                triggerMode === "image"
                  ? "bg-primary/5 border-primary/20 text-primary"
                  : "bg-accent/30 border-accent/50 text-muted-foreground",
                settings.theme === "ios" && "ios-card"
              )}>
                {triggerMode === "image" ? (
                  <><ImageIcon className="h-3 w-3" /> Image Generation Mode</>
                ) : (
                  <><Film className="h-3 w-3" /> Video Generation Mode (Coming Soon)</>
                )}
              </div>
            )}

            {uploadedFiles.length > 0 && (
              <div className="mb-1.5">
                <FileUpload files={uploadedFiles} onFilesChange={setUploadedFiles} />
              </div>
            )}

            <div className={cn(
              "flex items-end gap-1.5 rounded-2xl border px-3 py-2 transition-all glass-panel",
              triggerMode === "image"
                ? "border-primary/30 bg-primary/5"
                : "border-border/10",
              "focus-within:border-primary/30 focus-within:shadow-[0_0_30px_hsl(var(--primary)/0.1)]",
              settings.theme === "ios" && "rounded-[22px] border-border/40 bg-accent/20"
            )}>
              {/* Mode panel toggle */}
              <div className="relative" ref={modePanelRef}>
                <button
                  className={cn(
                    "h-8 w-8 rounded-xl flex items-center justify-center transition-all",
                    showModePanel ? "bg-primary/10 text-primary rotate-45" : "hover:bg-accent/30 text-muted-foreground"
                  )}
                  onClick={() => setShowModePanel(!showModePanel)}
                >
                  <Plus className="h-4 w-4 transition-transform" />
                </button>
                {showModePanel && (
                  <div className="absolute bottom-12 left-0 glass-panel-strong rounded-2xl p-2 min-w-[200px] animate-scale-in shadow-2xl z-50">
                    <p className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-wider px-2 mb-1.5">Mode</p>
                    <div className="grid grid-cols-2 gap-1">
                      {MODE_OPTIONS.map(m => (
                        <button
                          key={m.id}
                          onClick={() => { setActiveMode(m.id as AiMode); setShowModePanel(false); }}
                          className={cn(
                            "flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs transition-all",
                            activeMode === m.id
                              ? "bg-primary/15 text-primary font-semibold"
                              : "hover:bg-accent/50 text-muted-foreground"
                          )}
                        >
                          <span>{m.icon}</span>
                          <span>{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {uploadedFiles.length === 0 && (
                <FileUpload files={uploadedFiles} onFilesChange={setUploadedFiles} />
              )}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={triggerMode === "image" ? "Describe your image..." : "Message MahmudGPT… (try @Image or @Video)"}
                rows={1}
                className="flex-1 bg-transparent border-none outline-none resize-none text-sm py-1.5 placeholder:text-muted-foreground/25 max-h-[160px]"
              />
              <div className="flex items-center gap-0.5 pb-0.5">
                <Button
                  variant="ghost" size="icon"
                  className={cn("h-8 w-8 rounded-xl hover:bg-accent/30", isListening && "text-destructive bg-destructive/10 animate-pulse")}
                  onClick={toggleListening}
                >
                  {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-4 w-4" />}
                </Button>
                <button
                  className={cn(
                    "h-9 w-9 rounded-xl flex items-center justify-center transition-all",
                    input.trim()
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 active:scale-90"
                      : "bg-muted/30 text-muted-foreground/40"
                  )}
                  onClick={send}
                  disabled={!input.trim() || isLoading}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="text-center text-[8px] text-muted-foreground/15 mt-2">
              MahmudGPT — World's Best AI
            </p>
          </div>
        </div>
      </div>

      {/* Canvas panels */}
      {codeCanvasContent !== null && (
        <CodeCanvas content={codeCanvasContent} onClose={() => setCodeCanvasContent(null)} onAutoDebug={handleAutoDebug} />
      )}
      {writingCanvasContent !== null && (
        <WritingCanvas initialContent={writingCanvasContent} onClose={() => setWritingCanvasContent(null)} />
      )}

      {/* Overlays */}
      <VoiceChat onSpeakText={handleVoiceSpeak} isOpen={voiceChatOpen} onClose={() => setVoiceChatOpen(false)} />
      <LiveMode isOpen={liveModeOpen} onClose={() => setLiveModeOpen(false)} voiceId={settings.voiceId} />
      <SettingsPanel
        isOpen={settingsOpen} onClose={() => setSettingsOpen(false)}
        settings={settings} onSave={saveSettings}
        usageCount={usage.count} usageLimit={usage.limit} isPro={usage.isPro}
      />
      <ProPlanModal isOpen={proModalOpen} onClose={() => setProModalOpen(false)} reason={proModalReason} onProActivated={() => usage.refreshPro()} />
      <OnboardingModal isOpen={onboardingOpen} onClose={() => setOnboardingOpen(false)} />
      
      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav">
        <button 
          onClick={() => { handleNewChat(); setSidebarOpen(false); }}
          className={cn("mobile-nav-item", chat.messages.length === 0 && "active")}
        >
          <Plus className="h-5 w-5" />
          <span>New Chat</span>
        </button>
        <button 
          onClick={() => setSidebarOpen(true)}
          className={cn("mobile-nav-item", sidebarOpen && "active")}
        >
          <Menu className="h-5 w-5" />
          <span>History</span>
        </button>
        <button 
          onClick={() => setSettingsOpen(true)}
          className={cn("mobile-nav-item", settingsOpen && "active")}
        >
          <Settings2 className="h-5 w-5" />
          <span>Settings</span>
        </button>
        <button 
          onClick={() => { setProModalReason("locked"); setProModalOpen(true); }}
          className={cn("mobile-nav-item", usage.isPro && "active")}
        >
          <Crown className="h-5 w-5" />
          <span>Pro</span>
        </button>
      </div>

      <FloatingBadge />
    </div>
  );
};

export default ModernChat;
