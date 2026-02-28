import React, { useState } from "react";
import {
  Plus, MessageSquare, Trash2, X, Crown, Sparkles, ChevronDown,
  Code, Search, Brain, Calculator, GraduationCap, Image, Pencil,
  BarChart3, Lightbulb, FileSearch, Video, Mic, BookOpen,
  Layers, Palette, Monitor, Headphones, Briefcase, Cpu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AiMode } from "./ModeSelector";

export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
}

interface ModeCategory {
  label: string;
  icon: React.ElementType;
  modes: { id: AiMode; label: string; icon: React.ElementType; description: string; pro?: boolean }[];
}

const MODE_CATEGORIES: ModeCategory[] = [
  {
    label: "Chat",
    icon: MessageSquare,
    modes: [
      { id: "assistant", label: "Assistant", icon: MessageSquare, description: "Fast general AI" },
    ],
  },
  {
    label: "Intelligence",
    icon: Brain,
    modes: [
      { id: "thinking", label: "Thinking", icon: Brain, description: "Deep reasoning", pro: true },
      { id: "research", label: "Research", icon: Search, description: "Research & analysis" },
      { id: "deep-research", label: "Deep Research", icon: FileSearch, description: "Multi-source report", pro: true },
      { id: "math", label: "Math", icon: Calculator, description: "Advanced math" },
    ],
  },
  {
    label: "Developer",
    icon: Code,
    modes: [
      { id: "codex", label: "Codex", icon: Code, description: "Elite code gen", pro: true },
      { id: "analyst", label: "Analyst", icon: BarChart3, description: "Data analysis" },
      { id: "developer", label: "Dev Mode", icon: Cpu, description: "Highly technical discourse", pro: true },
    ],
  },
  {
    label: "Creative",
    icon: Palette,
    modes: [
      { id: "creative", label: "Creative", icon: Lightbulb, description: "Brainstorming" },
      { id: "image", label: "Image", icon: Image, description: "AI image gen" },
      { id: "writer", label: "Writer", icon: Pencil, description: "Writing canvas" },
    ],
  },
  {
    label: "Learning",
    icon: GraduationCap,
    modes: [
      { id: "guided", label: "Guided", icon: GraduationCap, description: "Step-by-step tutor" },
    ],
  },
];

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
  activeMode: AiMode;
  onModeChange: (mode: AiMode) => void;
  isPro?: boolean;
  onLockedMode?: () => void;
  theme?: string;
}

const ChatSidebar: React.FC<Props> = ({
  conversations, activeId, onSelect, onNew, onDelete,
  isOpen, onClose, onUpgrade, activeMode, onModeChange, isPro, onLockedMode, theme
}) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["Chat"]);
  const [showHistory, setShowHistory] = useState(true);

  const toggleCategory = (label: string) => {
    setExpandedCategories(prev =>
      prev.includes(label) ? prev.filter(c => c !== label) : [...prev, label]
    );
  };

  const handleModeSelect = (mode: typeof MODE_CATEGORIES[0]["modes"][0]) => {
    if (mode.pro && !isPro) {
      onLockedMode?.();
      return;
    }
    onModeChange(mode.id);
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-background/60 backdrop-blur-md z-40 md:hidden" onClick={onClose} />}

      <aside className={cn(
        "fixed md:relative z-50 md:z-auto h-full w-[260px] flex flex-col border-r border-border/10 transition-transform duration-300",
        "bg-card/80 backdrop-blur-2xl",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-0 md:border-0 md:overflow-hidden",
        theme === "ios" && "ios-blur border-r-border/20"
      )}>
        {/* Header */}
        <div className="p-3 flex items-center justify-between border-b border-border/10">
          <Button
            variant="ghost" size="sm"
            className="flex-1 justify-start gap-2 hover:bg-primary/5 text-xs h-8"
            onClick={onNew}
          >
            <Plus className="h-3.5 w-3.5 text-primary" /> New Chat
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 md:hidden" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Mode Navigation */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="px-2 pt-3 pb-1">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/40 px-2 mb-2">
              Modes
            </p>
          </div>

          {MODE_CATEGORIES.map(cat => {
            const isExpanded = expandedCategories.includes(cat.label);
            const CatIcon = cat.icon;
            const hasActiveMode = cat.modes.some(m => m.id === activeMode);

            return (
              <div key={cat.label} className="px-2 mb-0.5">
                <button
                  onClick={() => toggleCategory(cat.label)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all",
                    hasActiveMode ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                  )}
                >
                  <CatIcon className={cn("h-3.5 w-3.5", hasActiveMode && "text-primary")} />
                  <span className="flex-1 text-left">{cat.label}</span>
                  <ChevronDown className={cn(
                    "h-3 w-3 transition-transform duration-200",
                    !isExpanded && "-rotate-90"
                  )} />
                </button>

                {isExpanded && (
                  <div className="ml-3 pl-3 border-l border-border/10 space-y-0.5 mt-0.5 mb-1">
                    {cat.modes.map(mode => {
                      const Icon = mode.icon;
                      const isActive = activeMode === mode.id;
                      const locked = mode.pro && !isPro;

                      return (
                        <button
                          key={mode.id}
                          onClick={() => handleModeSelect(mode)}
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] transition-all group",
                            isActive
                              ? "bg-primary/10 text-primary font-medium"
                              : locked
                              ? "text-muted-foreground/50 hover:bg-accent/20"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                          )}
                        >
                          <Icon className={cn("h-3 w-3", isActive && "text-primary")} />
                          <span className="flex-1 text-left truncate">{mode.label}</span>
                          {locked && <Crown className="h-2.5 w-2.5 text-primary/40" />}
                          {isActive && (
                            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* History Section */}
          <div className="px-2 mt-4">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/40"
            >
              <span className="flex-1 text-left">History</span>
              <ChevronDown className={cn("h-3 w-3 transition-transform", !showHistory && "-rotate-90")} />
            </button>
          </div>

          {showHistory && (
            <div className="px-2 space-y-0.5 pb-2">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="h-8 w-8 rounded-lg bg-accent/30 flex items-center justify-center mb-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground/30" />
                  </div>
                  <p className="text-[10px] text-muted-foreground/30">No conversations</p>
                </div>
              ) : (
                conversations.map(conv => (
                  <div
                    key={conv.id}
                    className={cn(
                      "group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-[11px] transition-all",
                      activeId === conv.id
                        ? "bg-accent/50 text-foreground"
                        : "text-muted-foreground hover:bg-accent/20 hover:text-foreground"
                    )}
                    onClick={() => onSelect(conv.id)}
                  >
                    <MessageSquare className="h-3 w-3 flex-shrink-0 text-muted-foreground/40" />
                    <span className="flex-1 truncate">{conv.title}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/10 hover:text-destructive transition-all"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border/10 space-y-2">
          {onUpgrade && !isPro && (
            <button
              onClick={onUpgrade}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-semibold shiny-button text-primary-foreground"
            >
              <Crown className="h-3 w-3" />
              Upgrade to Pro
            </button>
          )}
          <div className="flex items-center justify-center gap-1.5">
            <Sparkles className="h-2.5 w-2.5 text-primary/30" />
            <p className="text-[8px] text-muted-foreground/30">MahmudGPT v2.0</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default ChatSidebar;
