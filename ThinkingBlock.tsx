import React, { useState } from "react";
import { ChevronDown, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  thinking: string;
  isStreaming?: boolean;
}

const ThinkingBlock: React.FC<Props> = ({ thinking, isStreaming }) => {
  const [expanded, setExpanded] = useState(false);

  if (!thinking) return null;

  return (
    <div className="mb-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-all",
          "bg-accent/50 border border-border hover:border-primary/30",
          isStreaming && "thinking-shimmer"
        )}
      >
        <Brain className={cn("h-3.5 w-3.5 text-primary", isStreaming && "animate-pulse")} />
        <span className={cn("font-medium", isStreaming && "thinking-glow")}>
          {isStreaming ? "Thinking..." : "Thought process"}
        </span>
        <ChevronDown className={cn("h-3 w-3 transition-transform ml-auto", expanded && "rotate-180")} />
      </button>
      {expanded && (
        <div className="mt-1.5 px-3 py-2 text-xs text-muted-foreground bg-accent/30 rounded-lg border border-border leading-relaxed whitespace-pre-wrap animate-in fade-in slide-in-from-top-1">
          {thinking}
        </div>
      )}
    </div>
  );
};

export default ThinkingBlock;
