import React, { useState, useMemo } from "react";
import { X, Play, Copy, Check, Bug, FileCode, Maximize2, Minimize2, Download, SplitSquareHorizontal, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";

interface CodeFile {
  name: string;
  language: string;
  content: string;
}

interface Props {
  content: string;
  onClose: () => void;
  onAutoDebug?: (code: string) => void;
}

const CodeCanvas: React.FC<Props> = ({ content, onClose, onAutoDebug }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [layout, setLayout] = useState<"code" | "split" | "preview">("split");

  const files: CodeFile[] = useMemo(() => {
    const codeBlocks: CodeFile[] = [];
    const regex = /```(\w+)?(?:\s+(?:\/\/|#|<!--)\s*(.+?))?[\s\n]([\s\S]*?)```/g;
    let match;
    let idx = 0;
    while ((match = regex.exec(content)) !== null) {
      const lang = match[1] || "text";
      const fileName = match[2]?.trim() || `file${idx > 0 ? idx : ""}.${lang === "javascript" || lang === "js" ? "js" : lang === "typescript" || lang === "ts" ? "ts" : lang === "python" ? "py" : lang === "html" ? "html" : lang === "css" ? "css" : lang}`;
      codeBlocks.push({ name: fileName, language: lang, content: match[3].trim() });
      idx++;
    }
    if (codeBlocks.length === 0) {
      codeBlocks.push({ name: "code.txt", language: "text", content });
    }
    return codeBlocks;
  }, [content]);

  const activeFile = files[activeTab] || files[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAll = () => {
    files.forEach(f => {
      const blob = new Blob([f.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = f.name; a.click();
      URL.revokeObjectURL(url);
    });
  };

  const buildCombinedHtml = (): string => {
    const htmlFile = files.find(f => ["html", "htm"].includes(f.language.toLowerCase()));
    const cssFile = files.find(f => f.language.toLowerCase() === "css");
    const jsFiles = files.filter(f => ["javascript", "js", "typescript", "ts"].includes(f.language.toLowerCase()));

    if (htmlFile) {
      let html = htmlFile.content;
      if (cssFile) html = html.replace("</head>", `<style>${cssFile.content}</style></head>`);
      if (jsFiles.length) html = html.replace("</body>", jsFiles.map(j => `<script>${j.content}</script>`).join("") + "</body>");
      return html;
    }

    const css = cssFile ? `<style>${cssFile.content}</style>` : "";
    const js = jsFiles.map(j => `<script>${j.content}</script>`).join("");
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${css}</head><body>${js}</body></html>`;
  };

  const handleRun = () => {
    setConsoleOutput([]);
    const lang = activeFile.language.toLowerCase();
    if (["html", "htm"].includes(lang) || files.some(f => ["html", "htm"].includes(f.language.toLowerCase()))) {
      setPreviewHtml(buildCombinedHtml());
      setConsoleOutput(prev => [...prev, "▶ Rendered HTML preview"]);
    } else if (["javascript", "js", "typescript", "ts"].includes(lang)) {
      try {
        const logs: string[] = [];
        const mockConsole = {
          log: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
          error: (...args: unknown[]) => logs.push("ERROR: " + args.map(String).join(" ")),
          warn: (...args: unknown[]) => logs.push("WARN: " + args.map(String).join(" ")),
          info: (...args: unknown[]) => logs.push("INFO: " + args.map(String).join(" ")),
          table: (data: unknown) => logs.push(JSON.stringify(data, null, 2)),
        };
        const cleanCode = activeFile.content.replace(/import .+/g, "// import removed").replace(/export .+/g, "// export removed");
        const fn = new Function("console", cleanCode);
        fn(mockConsole);
        setConsoleOutput(logs.length > 0 ? logs : ["✓ Code executed successfully (no output)"]);
        // Wrap JS output in HTML for preview
        const htmlOutput = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{background:#0a0a0f;color:#e2e8f0;font-family:'JetBrains Mono',monospace;padding:20px;font-size:13px;line-height:1.6}pre{white-space:pre-wrap;word-break:break-word}.error{color:#f87171}.warn{color:#facc15}.success{color:#4ade80}</style></head><body><pre>${logs.map(l => {
          if (l.startsWith("ERROR")) return `<span class="error">${l}</span>`;
          if (l.startsWith("WARN")) return `<span class="warn">${l}</span>`;
          if (l.startsWith("✓")) return `<span class="success">${l}</span>`;
          return l;
        }).join("\n") || '<span class="success">✓ Code executed successfully (no output)</span>'}</pre></body></html>`;
        setPreviewHtml(htmlOutput);
      } catch (err: unknown) {
        const error = err as Error;
        setConsoleOutput([`❌ Error: ${error.message}`]);
        setPreviewHtml(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{background:#0a0a0f;color:#f87171;font-family:'JetBrains Mono',monospace;padding:20px;font-size:14px}</style></head><body><pre>❌ Error: ${error.message}</pre></body></html>`);
      }
    } else {
      setConsoleOutput([`ℹ️ Preview not available for ${activeFile.language} files`]);
      setPreviewHtml(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{background:#0a0a0f;color:#94a3b8;font-family:system-ui;padding:40px;text-align:center}h2{color:#818cf8}</style></head><body><h2>Preview</h2><p>Preview not available for .${activeFile.language} files</p></body></html>`);
    }
    if (layout === "code") setLayout("split");
  };

  const handleDebug = () => onAutoDebug?.(activeFile.content);

  return (
    <div className={cn(
      "flex flex-col glass-panel",
      isFullscreen ? "fixed inset-0 z-50 w-full" : "h-full w-full md:w-[50vw] lg:w-[45vw] border-l border-border/50"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-card/60 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <FileCode className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold font-['Space_Grotesk']">Code Canvas</h3>
          <span className="text-[10px] text-muted-foreground bg-accent/50 px-1.5 py-0.5 rounded">{files.length} file{files.length > 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="sm" onClick={handleRun} className="h-7 text-xs gap-1 text-green-400 hover:text-green-300 hover:bg-green-500/10">
            <Play className="h-3 w-3" /> Run
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDebug} className="h-7 text-xs gap-1">
            <Bug className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 text-xs gap-1">
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDownloadAll} className="h-7 text-xs gap-1">
            <Download className="h-3 w-3" />
          </Button>
          <div className="flex items-center bg-accent/30 rounded-lg p-0.5 mx-1">
            <button onClick={() => setLayout("code")} className={cn("p-1 rounded text-[10px]", layout === "code" ? "bg-primary/20 text-primary" : "text-muted-foreground")} title="Code only">
              <FileCode className="h-3 w-3" />
            </button>
            <button onClick={() => setLayout("split")} className={cn("p-1 rounded text-[10px]", layout === "split" ? "bg-primary/20 text-primary" : "text-muted-foreground")} title="Split view">
              <SplitSquareHorizontal className="h-3 w-3" />
            </button>
            <button onClick={() => setLayout("preview")} className={cn("p-1 rounded text-[10px]", layout === "preview" ? "bg-primary/20 text-primary" : "text-muted-foreground")} title="Preview only">
              <Monitor className="h-3 w-3" />
            </button>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)} className="h-7 w-7">
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* File tabs */}
      <div className="flex items-center gap-0.5 px-2 py-1 bg-accent/20 border-b border-border/50 overflow-x-auto">
        {files.map((file, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={cn(
              "px-3 py-1 rounded text-xs whitespace-nowrap transition-all",
              i === activeTab ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            {file.name}
          </button>
        ))}
      </div>

      {/* Main content: Code + Preview side by side */}
      <div className="flex-1 flex overflow-hidden">
        {/* Code panel */}
        {(layout === "code" || layout === "split") && (
          <div className={cn("overflow-auto", layout === "split" ? "w-1/2 border-r border-border/50" : "w-full")}>
            <SyntaxHighlighter
              language={activeFile.language}
              style={oneDark}
              showLineNumbers
              customStyle={{ margin: 0, borderRadius: 0, minHeight: "100%", fontSize: "0.8rem", background: "transparent" }}
            >
              {activeFile.content}
            </SyntaxHighlighter>
          </div>
        )}

        {/* Preview panel - large, side by side */}
        {(layout === "split" || layout === "preview") && (
          <div className={cn("flex flex-col", layout === "split" ? "w-1/2" : "w-full")}>
            {previewHtml ? (
              <iframe
                srcDoc={previewHtml}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-modals"
                title="Live Preview"
                style={{ background: "#fff" }}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Monitor className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Click <strong>Run</strong> to preview</p>
                  <p className="text-xs mt-1 opacity-60">Code output will appear here</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeCanvas;
