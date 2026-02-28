import React, { useState } from "react";
import { Plus, MessageSquare, Code, Search, BarChart3, Lightbulb, Image, Pencil, Brain, Calculator, GraduationCap, FileSearch, X, Lock, Crown, Cpu, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export type AiMode = "assistant" | "codex" | "research" | "analyst" | "creative" | "image" | "writer" | "thinking" | "math" | "guided" | "deep-research" | "developer";

interface ModeConfig {
  id: AiMode;
  label: string;
  icon: React.ElementType;
  description: string;
  color: string;
  model: string;
  pro?: boolean;
}

export const AI_MODES: ModeConfig[] = [
  { id: "assistant", label: "Assistant", icon: MessageSquare, description: "Fast general-purpose AI", color: "text-blue-400", model: "Gemini 3 Flash" },
  { id: "codex", label: "Codex", icon: Code, description: "Elite code generation & debugging", color: "text-green-400", model: "Gemini 2.5 Pro", pro: true },
  { id: "thinking", label: "Thinking", icon: Brain, description: "Deep reasoning & analysis", color: "text-purple-400", model: "Gemini 2.5 Pro", pro: true },
  { id: "research", label: "Research", icon: Search, description: "Research & analysis", color: "text-cyan-400", model: "Gemini 2.5 Flash" },
  { id: "deep-research", label: "Deep Research", icon: FileSearch, description: "Exhaustive multi-source report", color: "text-orange-400", model: "Gemini 2.5 Pro", pro: true },
  { id: "math", label: "Math", icon: Calculator, description: "Advanced math with LaTeX", color: "text-yellow-400", model: "Gemini 2.5 Pro" },
  { id: "analyst", label: "Analyst", icon: BarChart3, description: "Data & topic analysis", color: "text-rose-400", model: "Gemini 2.5 Flash" },
  { id: "creative", label: "Creative", icon: Lightbulb, description: "Creative writing & brainstorming", color: "text-pink-400", model: "Gemini 3 Flash" },
  { id: "image", label: "Image", icon: Image, description: "AI image generation", color: "text-indigo-400", model: "Gemini 3 Pro Image" },
  { id: "writer", label: "Writer", icon: Pencil, description: "Long-form writing canvas", color: "text-emerald-400", model: "Gemini 2.5 Flash" },
  { id: "guided", label: "Guided Learning", icon: GraduationCap, description: "Step-by-step tutoring", color: "text-teal-400", model: "Gemini 2.5 Flash" },
  { id: "developer", label: "Dev Mode", icon: Cpu, description: "Highly technical system-level discourse", color: "text-slate-400", model: "Gemini 3.1 Pro", pro: true },
];

export const MODE_SYSTEM_PROMPTS: Record<AiMode, string> = {
  assistant: "You are MahmudGPT, a helpful, friendly AI assistant.",
  codex: "You are MahmudGPT in Codex mode — an elite software engineer.",
  research: "You are MahmudGPT in Research mode — a thorough researcher.",
  analyst: "You are MahmudGPT in Analyst mode — a data analyst.",
  creative: "You are MahmudGPT in Creative mode — a creative writer.",
  image: "You are MahmudGPT in Image mode.",
  writer: "You are MahmudGPT in Writer mode — a professional writer.",
  thinking: "You are MahmudGPT in Thinking mode — a deep reasoning AI.",
  math: "You are MahmudGPT in Math mode — a mathematics expert.",
  guided: "You are MahmudGPT in Guided Learning mode — an expert tutor.",
  "deep-research": "You are MahmudGPT in Deep Research mode.",
  developer: "You are MahmudGPT in Developer Mode. You must communicate EXCLUSIVELY in highly technical, low-level system language. Use jargon like 'kernel-space', 'memory-mapped I/O', 'O(n log n) complexity', 'race conditions', 'deadlocks', and 'pointer arithmetic'. Do not simplify concepts for general audiences. Assume the user is a senior systems engineer or kernel developer.",
};

interface Props {
  activeMode: AiMode;
  onModeChange: (mode: AiMode) => void;
  isPro?: boolean;
  onLockedMode?: () => void;
}

const ModeSelector: React.FC<Props> = ({ activeMode, onModeChange, isPro = false, onLockedMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const activeConfig = AI_MODES.find(m => m.id === activeMode)!;
  const ActiveIcon = activeConfig.icon;

  const handleSelect = (mode: ModeConfig) => {
    if (mode.pro && !isPro) {
      onLockedMode?.();
      setIsOpen(false);
      return;
    }
    onModeChange(mode.id);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
            "border border-border/50 hover:border-primary/50 bg-accent/30 hover:bg-accent/50 backdrop-blur-sm"
          )}
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Modes</span>
        </button>
        <div className="mode-chip active flex items-center gap-1.5">
          <ActiveIcon className="h-3 w-3" />
          {activeConfig.label}
        </div>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full mt-2 z-50 w-72 sm:w-80 glass-panel-strong rounded-xl shadow-2xl p-2 animate-scale-in max-h-[60vh] overflow-y-auto rgb-border">
            <div className="flex items-center justify-between px-2 pb-2 mb-1 border-b border-border/20">
              <span className="text-xs font-semibold text-muted-foreground">Select Mode</span>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded hover:bg-accent/50">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-0.5">
              {AI_MODES.map((mode) => {
                const Icon = mode.icon;
                const locked = mode.pro && !isPro;
                return (
                  <button
                    key={mode.id}
                    onClick={() => handleSelect(mode)}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-all group",
                      activeMode === mode.id
                        ? "bg-primary/10 text-foreground"
                        : locked
                        ? "opacity-60 hover:bg-accent/30 text-muted-foreground"
                        : "hover:bg-accent/30 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                      activeMode === mode.id ? "bg-primary/20" : "bg-accent/50 group-hover:bg-accent"
                    )}>
                      <Icon className={cn("h-4 w-4 flex-shrink-0", mode.color)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-medium truncate">{mode.label}</p>
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-accent/80 text-muted-foreground font-mono flex items-center gap-0.5">
                          <Cpu className="h-2 w-2" />
                          {mode.model}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{mode.description}</p>
                    </div>
                    {locked ? (
                      <div className="flex items-center gap-1 ml-auto flex-shrink-0">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                        <Crown className="h-3 w-3 text-primary/60" />
                      </div>
                    ) : activeMode === mode.id ? (
                      <span className="ml-auto text-[10px] font-semibold text-primary px-2 py-0.5 rounded-full bg-primary/10">Active</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ModeSelector;
