import React, { useState, useEffect } from "react";
import { X, User, Palette, Volume2, Brain, Save, Zap, Ticket, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiService } from "@/services/apiService";

export interface UserSettings {
  displayName: string;
  systemPrompt: string;
  voiceId: string;
  voiceName: string;
  autoTTS: boolean;
  showThinking: boolean;
  streamSpeed: "fast" | "normal" | "slow";
  fontSize: "sm" | "base" | "lg";
  theme: "dark" | "neon" | "emerald" | "flutter" | "ios";
  animationsEnabled: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  displayName: "User",
  systemPrompt: "",
  voiceId: "JBFqnCBsd6RMkjVDRZzb",
  voiceName: "George",
  autoTTS: false,
  showThinking: true,
  streamSpeed: "normal",
  fontSize: "base",
  theme: "dark",
  animationsEnabled: true,
};

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

const THEMES = [
  { id: "dark" as const, label: "Dark", color: "bg-[hsl(240,15%,7%)]" },
  { id: "neon" as const, label: "Neon", color: "bg-[hsl(280,60%,10%)]" },
  { id: "emerald" as const, label: "Emerald", color: "bg-[hsl(160,40%,8%)]" },
  { id: "flutter" as const, label: "Flutter", color: "bg-[hsl(199,100%,50%)]" },
  { id: "ios" as const, label: "iOS", color: "bg-[hsl(210,100%,50%)]" },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
  usageCount?: number;
  usageLimit?: number;
  isPro?: boolean;
}

const SettingsPanel: React.FC<Props> = ({ isOpen, onClose, settings, onSave, usageCount = 0, usageLimit = 30, isPro = false }) => {
  const [local, setLocal] = useState<UserSettings>(settings);
  const [activeTab, setActiveTab] = useState<"profile" | "voice" | "ai" | "appearance">("profile");

  useEffect(() => setLocal(settings), [settings]);

  const save = () => { onSave(local); onClose(); };

  if (!isOpen) return null;

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "voice" as const, label: "Voice", icon: Volume2 },
    { id: "ai" as const, label: "AI", icon: Brain },
    { id: "appearance" as const, label: "Theme", icon: Palette },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold font-['Space_Grotesk']">Settings</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        {/* Usage Counter */}
        <div className="px-5 py-3 border-b border-border">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">Daily Usage</span>
            {isPro ? (
              <span className="text-[10px] font-medium text-primary flex items-center gap-1"><Zap className="h-3 w-3" /> Pro — Unlimited</span>
            ) : (
              <span className="text-[10px] font-medium">{usageCount} / {usageLimit}</span>
            )}
          </div>
          {!isPro && (
            <div className="w-full h-1.5 rounded-full bg-accent overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.min((usageCount / usageLimit) * 100, 100)}%` }}
              />
            </div>
          )}
        </div>

        <div className="flex border-b border-border">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
              activeTab === t.id ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            )}>
              <t.icon className="h-3.5 w-3.5" />{t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === "profile" && (
            <>
              <div>
                <label className="text-xs font-medium mb-1 block">Display Name</label>
                <input value={local.displayName} onChange={e => setLocal({ ...local, displayName: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Custom System Prompt</label>
                <textarea value={local.systemPrompt} onChange={e => setLocal({ ...local, systemPrompt: e.target.value })} rows={4} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none" placeholder="Override default AI personality..." />
              </div>
            </>
          )}
          {activeTab === "voice" && (
            <>
              <div>
                <label className="text-xs font-medium mb-2 block">Voice</label>
                <div className="grid grid-cols-2 gap-2">
                  {VOICES.map(v => (
                    <button key={v.id} onClick={() => setLocal({ ...local, voiceId: v.id, voiceName: v.name })} className={cn(
                      "px-3 py-2 rounded-lg text-xs border transition-all",
                      local.voiceId === v.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"
                    )}>{v.name}</button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={local.autoTTS} onChange={e => setLocal({ ...local, autoTTS: e.target.checked })} className="accent-primary" />
                Auto-read responses aloud
              </label>
            </>
          )}
          {activeTab === "ai" && (
            <>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={local.showThinking} onChange={e => setLocal({ ...local, showThinking: e.target.checked })} className="accent-primary" />
                Show AI thinking process
              </label>
              <div>
                <label className="text-xs font-medium mb-1 block">Stream Speed</label>
                <div className="flex gap-2">
                  {(["fast", "normal", "slow"] as const).map(s => (
                    <button key={s} onClick={() => setLocal({ ...local, streamSpeed: s })} className={cn(
                      "flex-1 py-2 rounded-lg text-xs border transition-all capitalize",
                      local.streamSpeed === s ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"
                    )}>{s}</button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border/50">
                <label className="text-xs font-medium mb-2 flex items-center gap-1.5">
                  <Ticket className="h-3 w-3 text-primary" />
                  Promo Code
                </label>
                <div className="flex gap-2">
                  <input 
                    id="promo-code-input"
                    placeholder="Enter code..." 
                    className="flex-1 bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => {
                      const input = document.getElementById("promo-code-input") as HTMLInputElement;
                      if (input && input.value) {
                        const success = apiService.applyPromoCode(input.value);
                        if (success) {
                          alert("Promo code applied successfully! Your experience has been enhanced.");
                          input.value = "";
                        } else {
                          alert("Invalid promo code. Please try again.");
                        }
                      }
                    }}
                  >
                    Apply
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground/50 mt-1.5">
                  Enter a promo code to unlock exclusive features and higher priority access.
                </p>
              </div>
            </>
          )}
          {activeTab === "appearance" && (
            <>
              <div>
                <label className="text-xs font-medium mb-2 block">Theme</label>
                <div className="flex gap-2">
                  {THEMES.map(t => (
                    <button key={t.id} onClick={() => setLocal({ ...local, theme: t.id })} className={cn(
                      "flex-1 py-3 rounded-lg text-xs border transition-all flex flex-col items-center gap-1.5",
                      local.theme === t.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"
                    )}>
                      <div className={cn("h-6 w-6 rounded-full border border-border", t.color)} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Font Size</label>
                <div className="flex gap-2">
                  {(["sm", "base", "lg"] as const).map(s => (
                    <button key={s} onClick={() => setLocal({ ...local, fontSize: s })} className={cn(
                      "flex-1 py-2 rounded-lg text-xs border transition-all",
                      local.fontSize === s ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"
                    )}>{s === "sm" ? "Small" : s === "base" ? "Medium" : "Large"}</button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={local.animationsEnabled} onChange={e => setLocal({ ...local, animationsEnabled: e.target.checked })} className="accent-primary" />
                Enable animations
              </label>
            </>
          )}
        </div>

        <div className="px-5 py-3 border-t border-border flex justify-end">
          <Button onClick={save} className="gap-2"><Save className="h-3.5 w-3.5" />Save Settings</Button>
        </div>
      </div>
    </div>
  );
};

export { DEFAULT_SETTINGS };
export default SettingsPanel;
