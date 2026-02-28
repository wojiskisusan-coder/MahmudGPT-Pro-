import React, { useState } from "react";
import mahmudProfile from "@/assets/mahmud-profile.jpg";
import { X, Globe, Github, Mail } from "lucide-react";

const FloatingBadge: React.FC = () => {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowPopup(true)}
        className="fixed bottom-3 right-3 z-40 px-3 py-1.5 rounded-full text-[10px] font-medium bg-card/40 backdrop-blur-xl border border-border/30 text-muted-foreground/60 hover:text-foreground transition-all hover:border-primary/30 hover:bg-card/60 hover:shadow-[0_0_20px_hsl(var(--primary)/0.15)]"
      >
        Built with <span className="text-primary font-bold">Mahmud</span>
      </button>

      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-md" onClick={() => setShowPopup(false)}>
          <div className="glass-panel-strong rounded-3xl p-8 max-w-sm w-full text-center animate-in fade-in zoom-in-95 rgb-border" onClick={e => e.stopPropagation()}>
            {/* Close button */}
            <button onClick={() => setShowPopup(false)} className="absolute top-4 right-4 h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors">
              <X className="h-4 w-4" />
            </button>

            {/* Profile image */}
            <div className="relative mx-auto mb-5 w-fit">
              <img src={mahmudProfile} alt="Tasnim Mahmud" className="h-24 w-24 rounded-2xl object-cover ring-2 ring-primary/40 shadow-[0_0_30px_hsl(var(--primary)/0.2)]" />
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary border-2 border-background" />
            </div>

            {/* Name & title */}
            <h3 className="text-xl font-bold font-['Space_Grotesk'] gradient-text mb-1">Tasnim Mahmud</h3>
            <p className="text-sm text-primary font-medium mb-3">AI System Architect & Researcher</p>

            {/* Bio */}
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              Building the world's smartest AI platforms. Researcher, developer, and advanced AI explorer creating scalable, intelligent systems that amplify human potential.
            </p>

            {/* Social links */}
            <div className="flex items-center justify-center gap-3 mb-5">
              {[
                { icon: Globe, label: "Website" },
                { icon: Github, label: "GitHub" },
                { icon: Mail, label: "Email" },
              ].map(({ icon: Icon, label }) => (
                <button key={label} className="h-10 w-10 rounded-xl bg-accent/20 border border-border/20 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 hover:border-primary/30 transition-all" title={label}>
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {[
                { value: "50+", label: "Projects" },
                { value: "10K+", label: "Users" },
                { value: "∞", label: "Vision" },
              ].map(s => (
                <div key={s.label} className="py-2 rounded-xl bg-accent/10 border border-border/10">
                  <p className="text-sm font-bold text-primary">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground/60">{s.label}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowPopup(false)}
              className="px-6 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors border border-primary/20"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingBadge;
