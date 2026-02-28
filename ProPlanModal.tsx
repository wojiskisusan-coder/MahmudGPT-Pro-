import React, { useState } from "react";
import { X, Zap, Brain, Search, Code, BarChart3, Infinity as InfinityIcon, Crown, Sparkles, Gift, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/apiService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reason?: "limit" | "locked";
  onProActivated?: () => void;
}

const features = [
  { icon: InfinityIcon, label: "Unlimited messages", free: "30/day", pro: "∞" },
  { icon: Brain, label: "Advanced Reasoning", free: "—", pro: "✓" },
  { icon: Search, label: "Deep Research", free: "—", pro: "✓" },
  { icon: Code, label: "Code IDE Canvas", free: "—", pro: "✓" },
  { icon: BarChart3, label: "Full Chart Analysis", free: "Limited", pro: "✓" },
];

const ProPlanModal: React.FC<Props> = ({ isOpen, onClose, reason = "limit", onProActivated }) => {
  const [showPromo, setShowPromo] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemed, setRedeemed] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleRedeem = async () => {
    if (!promoCode.trim()) return;
    setIsRedeeming(true);
    await new Promise(r => setTimeout(r, 600));
    const success = apiService.applyPromoCode(promoCode.trim());
    if (success) {
      setRedeemed(true);
      toast({ title: "🎉 Promo Applied!", description: "Unlimited access unlocked!" });
      onProActivated?.();
      setTimeout(() => onClose(), 2000);
    } else {
      toast({ title: "Invalid Code", description: "That promo code doesn't exist. Try again.", variant: "destructive" });
    }
    setIsRedeeming(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-xl">
      <div className="glass-panel-strong rounded-3xl w-full max-w-md rgb-border animate-in fade-in zoom-in-95">
        <div className="p-6 text-center">
          <div className="relative mx-auto mb-5 w-fit">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center animate-hero-glow">
              <Crown className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center animate-pulse">
              <Sparkles className="h-3 w-3 text-primary-foreground" />
            </div>
          </div>

          {redeemed ? (
            <div className="py-8">
              <div className="h-16 w-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mx-auto mb-4 animate-in zoom-in-50">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold font-['Space_Grotesk'] mb-1 gradient-text">Pro Activated!</h2>
              <p className="text-sm text-muted-foreground">Enjoy unlimited access 🎉</p>
            </div>
          ) : (
            <>
              {reason === "limit" ? (
                <>
                  <h2 className="text-xl font-bold font-['Space_Grotesk'] mb-1 gradient-text">Daily Limit Reached</h2>
                  <p className="text-xs text-muted-foreground mb-5">Enter a promo code to get unlimited access.</p>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold font-['Space_Grotesk'] mb-1 gradient-text">Unlock Pro Features</h2>
                  <p className="text-xs text-muted-foreground mb-5">This feature requires a promo code. Contact us to get one!</p>
                </>
              )}

              <div className="space-y-1.5 mb-5">
                <div className="flex items-center gap-3 text-[10px] px-3 py-1 text-muted-foreground/60">
                  <span className="flex-1" />
                  <span className="w-14 text-center font-medium">Free</span>
                  <span className="w-14 text-center font-medium text-primary">Pro</span>
                </div>
                {features.map(f => (
                  <div key={f.label} className="flex items-center gap-3 text-xs px-3 py-2.5 rounded-xl bg-accent/20 border border-border/20 premium-card">
                    <f.icon className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="flex-1 text-left">{f.label}</span>
                    <span className="text-muted-foreground/60 w-14 text-center">{f.free}</span>
                    <span className="text-primary font-semibold w-14 text-center">{f.pro}</span>
                  </div>
                ))}
              </div>

              {showPromo ? (
                <div className="mb-5 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={e => setPromoCode(e.target.value)}
                      placeholder="Enter promo code"
                      className="flex-1 h-10 px-3 rounded-xl bg-accent/20 border border-border/30 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50 transition-all font-mono tracking-wider text-center"
                      autoFocus
                      onKeyDown={e => e.key === "Enter" && handleRedeem()}
                    />
                    <Button
                      onClick={handleRedeem}
                      disabled={!promoCode.trim() || isRedeeming}
                      className="h-10 px-4 rounded-xl shiny-button text-primary-foreground"
                    >
                      {isRedeeming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </Button>
                  </div>
                  <button onClick={() => setShowPromo(false)} className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 mb-4">
                  <a
                    href="https://wa.me/8801782242874?text=I%20want%20to%20upgrade%20to%20MahmudGPT%20Pro"
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-2xl text-sm font-bold shiny-button text-primary-foreground animate-upgrade-glow"
                  >
                    <Zap className="h-4 w-4" /> Get Promo Code
                  </a>
                  <p className="text-[9px] text-muted-foreground/50">Contact via WhatsApp</p>
                  <button
                    onClick={() => setShowPromo(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all"
                  >
                    <Gift className="h-3.5 w-3.5" /> Have a Promo Code?
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {!redeemed && (
          <div className="px-6 pb-5 flex justify-center">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs text-muted-foreground/60 hover:text-foreground">
              <X className="h-3 w-3 mr-1" /> Maybe Later
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProPlanModal;
