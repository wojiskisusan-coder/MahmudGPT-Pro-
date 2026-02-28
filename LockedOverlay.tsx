import React from "react";
import { Lock, Zap } from "lucide-react";

interface Props {
  onUpgrade: () => void;
}

const LockedOverlay: React.FC<Props> = ({ onUpgrade }) => (
  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm rounded-xl">
    <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in-95">
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center glow-border">
        <Lock className="h-5 w-5 text-primary" />
      </div>
      <p className="text-sm font-medium">Upgrade to Pro to Unlock</p>
      <button
        onClick={onUpgrade}
        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
      >
        <Zap className="h-3 w-3" /> Upgrade
      </button>
    </div>
  </div>
);

export default LockedOverlay;
