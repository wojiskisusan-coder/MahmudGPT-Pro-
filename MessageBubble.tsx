import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { Copy, Check, Volume2, User, Code, Pencil, Download, Sparkles, Loader2, Square, FileText, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import MarkdownRenderer from "./chat/MarkdownRenderer";
import ImageDisplay from "./chat/ImageDisplay";
import ThinkingBlock from "./chat/ThinkingBlock";
import { audioController } from "@/services/audioController";
import mahmudProfile from "@/assets/mahmud-profile.jpg";

interface Props {
  message: {
    id: string;
    role: "user" | "assistant";
    content: string;
    imageUrl?: string;
    thinking?: string;
    isStreaming?: boolean;
    files?: { name: string; type: string; previewUrl?: string }[];
  };
  onSpeak?: (text: string, messageId: string) => void;
  onOpenCodeCanvas?: (content: string) => void;
  onOpenWritingCanvas?: (content: string) => void;
  onDownloadReport?: (content: string) => void;
  theme?: string;
}

const MessageBubble: React.FC<Props> = ({ message, onSpeak, onOpenCodeCanvas, onOpenWritingCanvas, onDownloadReport, theme }) => {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [displayedContent, setDisplayedContent] = useState("");
  const contentRef = useRef(message.content);
  const isDeveloperProfile = message.content.includes("[DEVELOPER_PROFILE_START]");

  // Subscribe to audio controller state - using stable primitives
  const isAudioLoading = useSyncExternalStore(
    (cb) => audioController.subscribe(cb),
    () => audioController.isLoading && audioController.isActiveFor(message.id),
  );
  const isAudioPlaying = useSyncExternalStore(
    (cb) => audioController.subscribe(cb),
    () => audioController.isPlaying && audioController.isActiveFor(message.id),
  );

  useEffect(() => {
    if (isUser) { setDisplayedContent(message.content); return; }
    const cleanContent = message.content.replace(/\[DEVELOPER_PROFILE_START\]|\[DEVELOPER_PROFILE_END\]/g, "");
    if (message.isStreaming) {
      setDisplayedContent(cleanContent);
    } else if (contentRef.current !== message.content) {
      contentRef.current = message.content;
      setDisplayedContent(cleanContent);
    }
  }, [message.content, message.isStreaming, isUser]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (isAudioPlaying || isAudioLoading) {
      audioController.stop();
      return;
    }
    onSpeak?.(message.content, message.id);
  };

  const hasCode = /```[\s\S]+```/.test(message.content);

  const getSpeakIcon = () => {
    if (isAudioLoading) return <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />;
    if (isAudioPlaying) return <Square className="h-3 w-3 sm:h-3.5 sm:w-3.5" />;
    return <Volume2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />;
  };

  // Rounded canvas trigger cards for code/writing
  const canvasCards = [];
  if (hasCode && onOpenCodeCanvas) {
    canvasCards.push({
      onClick: () => onOpenCodeCanvas(message.content),
      icon: <Terminal className="h-4 w-4 text-primary" />,
      label: "Code Canvas",
      description: "Open in IDE",
    });
  }
  if (onOpenWritingCanvas) {
    canvasCards.push({
      onClick: () => onOpenWritingCanvas(message.content),
      icon: <FileText className="h-4 w-4 text-primary" />,
      label: "Writing Canvas",
      description: "Edit & Export",
    });
  }

  return (
    <div className={cn(
      "message-container group px-2.5 sm:px-4 py-3 sm:py-5 transition-colors",
      isUser ? "bg-[hsl(var(--chat-user-bg)/0.6)]" : "bg-transparent",
      theme === "ios" && (isUser ? "bg-transparent" : "bg-transparent px-3 py-2")
    )}>
      <div className={cn(
        "flex gap-2.5 sm:gap-3.5 max-w-3xl mx-auto",
        theme === "ios" && isUser && "flex-row-reverse"
      )}>
        {/* Avatar */}
        {theme !== "ios" && (
          <div className={cn(
            "h-7 w-7 sm:h-8 sm:w-8 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5 shadow-lg transition-all",
            isUser
              ? "bg-gradient-to-br from-primary/80 to-primary/40 ring-1 ring-primary/20"
              : "bg-gradient-to-br from-primary via-primary/80 to-primary/50 ring-1 ring-primary/30",
            !isUser && message.isStreaming && "animate-pulse"
          )}>
            {isUser ? (
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-foreground" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-foreground" />
            )}
          </div>
        )}

        <div className={cn(
          "flex-1 min-w-0",
          theme === "ios" && isUser && "flex flex-col items-end"
        )}>
          {theme !== "ios" && (
            <p className="text-[10px] sm:text-[11px] font-semibold mb-1.5 sm:mb-2 text-muted-foreground/70">
              {isUser ? "You" : <span className="gradient-text font-bold">MahmudGPT</span>}
              {!isUser && message.isStreaming && <span className="ml-2 streaming-dot text-xs">●</span>}
            </p>
          )}

          {message.files && message.files.length > 0 && (
            <div className={cn(
              "flex flex-wrap gap-1.5 mb-2",
              theme === "ios" && isUser && "justify-end"
            )}>
              {message.files.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 glass-panel rounded-xl px-2.5 py-1.5 text-[10px] sm:text-[11px]">
                  {f.previewUrl ? <img src={f.previewUrl} alt="" className="h-5 w-5 rounded-lg object-cover" /> : null}
                  <span className="truncate max-w-[100px]">{f.name}</span>
                </div>
              ))}
            </div>
          )}

          {!isUser && message.thinking && (
            <ThinkingBlock thinking={message.thinking} isStreaming={message.isStreaming} />
          )}

          {isDeveloperProfile && !isUser && (
            <div className="flex flex-col items-center gap-4 my-4">
              <img src={mahmudProfile} alt="Tasnim Mahmud" className="h-32 w-32 sm:h-40 sm:w-40 rounded-full ring-2 ring-primary/50 object-cover animate-hero-glow" />
            </div>
          )}

          {message.imageUrl && <ImageDisplay imageUrl={message.imageUrl} prompt={message.content} />}

          {isUser ? (
            <div className={cn(
              "glass-panel rounded-2xl rounded-tl-md px-3.5 py-2.5 inline-block max-w-full",
              theme === "ios" && "bg-primary text-primary-foreground border-none rounded-[20px] rounded-tr-[4px] px-4 py-2.5 shadow-sm"
            )}>
              <p className="text-[13px] sm:text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          ) : (
            <div className={cn(
              "prose prose-sm dark:prose-invert max-w-none text-[13px] sm:text-sm leading-relaxed",
              message.isStreaming && "streaming-content",
              theme === "ios" && "bg-muted/50 rounded-[20px] rounded-tl-[4px] px-4 py-2.5 inline-block"
            )}>
              <MarkdownRenderer content={displayedContent} />
              {message.isStreaming && <span className="typing-cursor" />}
            </div>
          )}

          {/* Canvas trigger cards - rounded file-folder style */}
          {!isUser && !message.isStreaming && canvasCards.length > 0 && message.content.length > 100 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {canvasCards.map((card, i) => (
                <button
                  key={i}
                  onClick={card.onClick}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl glass-panel border border-border/20 hover:border-primary/40 hover:bg-primary/5 transition-all active:scale-95 group/card"
                >
                  <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center group-hover/card:bg-primary/20 transition-colors">
                    {card.icon}
                  </div>
                  <div className="text-left">
                    <span className="block text-xs font-semibold text-foreground">{card.label}</span>
                    <span className="block text-[10px] text-muted-foreground">{card.description}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Action buttons */}
          {!isUser && message.content && !message.isStreaming && (
            <div className="flex items-center gap-0.5 mt-2.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
              {[
                { onClick: handleCopy, icon: () => copied ? <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />, title: "Copy", show: true },
                { onClick: handleSpeak, icon: getSpeakIcon, title: isAudioPlaying ? "Stop" : isAudioLoading ? "Loading..." : "Read aloud", show: !!onSpeak },
                { onClick: () => onDownloadReport?.(message.content), icon: () => <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5" />, title: "Download Report", show: !!onDownloadReport },
              ].filter(a => a.show).map((action, i) => (
                <button
                  key={i}
                  onClick={action.onClick}
                  className={cn(
                    "p-1.5 sm:p-2 rounded-xl hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-all active:scale-90",
                    action.title === "Stop" && "text-primary bg-primary/10",
                    action.title === "Loading..." && "text-primary"
                  )}
                  title={action.title}
                >
                  {action.icon()}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
