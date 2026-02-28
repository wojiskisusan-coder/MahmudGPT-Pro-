import React, { useState, useEffect } from "react";
import { X, Copy, Check, Download, Eye, Edit3, Maximize2, Minimize2, FileText, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import MarkdownRenderer from "./MarkdownRenderer";
import { cn } from "@/lib/utils";

interface Props {
  initialContent?: string;
  onClose: () => void;
}

const WritingCanvas: React.FC<Props> = ({ initialContent = "", onClose }) => {
  const [content, setContent] = useState(initialContent);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "split">("split");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setContent(initialContent); }, [initialContent]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMd = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "document.md"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadHtml = () => {
    // Create a rendered HTML version
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MahmudGPT Document</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; line-height: 1.8; color: #1a1a2e; padding: 40px; max-width: 800px; margin: 0 auto; background: #fafafa; }
    h1 { font-size: 2em; margin: 1em 0 0.5em; color: #0a0a1a; border-bottom: 2px solid #e0e0e0; padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; margin: 1em 0 0.4em; color: #1a1a2e; }
    h3 { font-size: 1.2em; margin: 0.8em 0 0.3em; }
    p { margin: 0.6em 0; }
    code { background: #f0f0f5; padding: 2px 6px; border-radius: 4px; font-family: 'JetBrains Mono', monospace; font-size: 0.9em; }
    pre { background: #1e1e2e; color: #cdd6f4; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 1em 0; }
    pre code { background: none; padding: 0; color: inherit; }
    blockquote { border-left: 4px solid #6c63ff; padding-left: 16px; margin: 1em 0; color: #555; font-style: italic; }
    table { width: 100%; border-collapse: collapse; margin: 1em 0; }
    th, td { border: 1px solid #ddd; padding: 10px 14px; text-align: left; }
    th { background: #f5f5ff; font-weight: 600; }
    ul, ol { padding-left: 24px; margin: 0.5em 0; }
    li { margin: 0.3em 0; }
    img { max-width: 100%; border-radius: 8px; }
    strong { color: #0a0a1a; }
    a { color: #6c63ff; }
    hr { border: none; border-top: 1px solid #e0e0e0; margin: 2em 0; }
  </style>
</head>
<body>${markdownToSimpleHtml(content)}</body>
</html>`;
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "document.html"; a.click();
    URL.revokeObjectURL(url);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className={cn(
      "flex flex-col canvas-panel",
      isFullscreen ? "fixed inset-0 z-50 w-full" : "h-full w-full md:w-[50vw] lg:w-[45vw]"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/20 glass-panel-strong">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold font-['Space_Grotesk'] gradient-text leading-none">Writing Canvas</h3>
            <p className="text-[9px] text-muted-foreground/50 mt-0.5">{wordCount} words · {content.length} chars</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center bg-accent/30 rounded-xl p-0.5 mr-2 backdrop-blur-sm border border-border/20">
            <button onClick={() => setViewMode("edit")} className={cn("px-2.5 py-1.5 rounded-lg text-[10px] transition-all", viewMode === "edit" ? "bg-primary/20 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              <Edit3 className="h-3 w-3" />
            </button>
            <button onClick={() => setViewMode("split")} className={cn("px-2.5 py-1.5 rounded-lg text-[10px] transition-all", viewMode === "split" ? "bg-primary/20 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              Split
            </button>
            <button onClick={() => setViewMode("preview")} className={cn("px-2.5 py-1.5 rounded-lg text-[10px] transition-all", viewMode === "preview" ? "bg-primary/20 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              <Eye className="h-3 w-3" />
            </button>
          </div>
          <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 text-xs rounded-xl hover:bg-primary/10">
            {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
          </Button>
          {/* Download dropdown */}
          <div className="relative group/dl">
            <Button variant="ghost" size="sm" className="h-7 text-xs rounded-xl hover:bg-primary/10">
              <Download className="h-3 w-3" />
            </Button>
            <div className="absolute right-0 top-full mt-1 glass-panel-strong rounded-xl p-1 min-w-[140px] opacity-0 invisible group-hover/dl:opacity-100 group-hover/dl:visible transition-all z-50 shadow-xl">
              <button onClick={handleDownloadHtml} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-accent/50 transition-colors">
                <FileDown className="h-3 w-3" /> Download HTML
              </button>
              <button onClick={handleDownloadMd} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-accent/50 transition-colors">
                <FileText className="h-3 w-3" /> Download MD
              </button>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)} className="h-7 w-7 rounded-xl hover:bg-primary/10">
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 rounded-xl hover:bg-destructive/10 hover:text-destructive">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {(viewMode === "edit" || viewMode === "split") && (
          <div className={cn("flex flex-col", viewMode === "split" ? "w-1/2 border-r border-border/20" : "w-full")}>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 bg-transparent p-4 resize-none outline-none text-sm leading-relaxed font-mono placeholder:text-muted-foreground/50 focus:bg-accent/5 transition-colors"
              placeholder="Start writing in Markdown..."
              spellCheck
            />
          </div>
        )}
        {(viewMode === "preview" || viewMode === "split") && (
          <div className={cn("overflow-auto p-4", viewMode === "split" ? "w-1/2" : "w-full")}>
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
              <MarkdownRenderer content={content} />
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-1.5 border-t border-border/20 text-[10px] text-muted-foreground/60 flex justify-between glass-panel">
        <span>{wordCount} words · {content.length} chars</span>
        <span className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
          Markdown
        </span>
      </div>
    </div>
  );
};

/** Simple markdown to HTML converter for export */
function markdownToSimpleHtml(md: string): string {
  let html = md;
  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Headers
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  // Bold & italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Links & images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  // Blockquotes
  html = html.replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>');
  // Unordered lists
  html = html.replace(/^[-*+] (.*$)/gm, '<li>$1</li>');
  // Ordered lists
  html = html.replace(/^\d+\. (.*$)/gm, '<li>$1</li>');
  // Horizontal rules
  html = html.replace(/^[-*_]{3,}$/gm, '<hr>');
  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';
  // Clean up
  html = html.replace(/<p><h([1-3])>/g, '<h$1>');
  html = html.replace(/<\/h([1-3])><\/p>/g, '</h$1>');
  html = html.replace(/<p><pre>/g, '<pre>');
  html = html.replace(/<\/pre><\/p>/g, '</pre>');
  html = html.replace(/<p><blockquote>/g, '<blockquote>');
  html = html.replace(/<\/blockquote><\/p>/g, '</blockquote>');
  html = html.replace(/<p><li>/g, '<ul><li>');
  html = html.replace(/<\/li><\/p>/g, '</li></ul>');
  return html;
}

export default WritingCanvas;
