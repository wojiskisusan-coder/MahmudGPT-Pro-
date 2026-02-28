import React, { useState } from "react";
import { X, Sparkles, Video, Layers, Crown, Settings2, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Step {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const STEPS: Step[] = [
  {
    title: "Welcome to MahmudGPT",
    description: "The world's most powerful AI assistant, now with a premium iOS-inspired experience.",
    icon: <Sparkles className="h-8 w-8" />,
    color: "from-blue-500 to-cyan-400"
  },
  {
    title: "Specialized Modes",
    description: "Switch between Assistant, Codex, Research, and the new high-level Developer Mode for specialized tasks.",
    icon: <Layers className="h-8 w-8" />,
    color: "from-purple-500 to-pink-400"
  },
  {
    title: "Live & Voice Mode",
    description: "Interact in real-time with Live Video mode or have a natural conversation using Voice Chat.",
    icon: <Video className="h-8 w-8" />,
    color: "from-orange-500 to-red-400"
  },
  {
    title: "Custom Themes",
    description: "Choose between Dark, Neon, Emerald, Flutter, and the stunning Liquid Glass iOS theme.",
    icon: <Settings2 className="h-8 w-8" />,
    color: "from-emerald-500 to-teal-400"
  },
  {
    title: "Go Pro",
    description: "Unlock unlimited messages, Deep Research, and elite models by upgrading to our Pro plan.",
    icon: <Crown className="h-8 w-8" />,
    color: "from-yellow-400 to-orange-500"
  }
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const OnboardingModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative w-full max-w-lg glass-panel-strong rounded-[32px] overflow-hidden shadow-2xl animate-scale-in">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-accent/50 text-muted-foreground transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-8 sm:p-12 flex flex-col items-center text-center">
          <div className={cn(
            "h-20 w-20 rounded-3xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg mb-8 animate-float",
            step.color
          )}>
            {step.icon}
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold mb-4 font-['Space_Grotesk'] tracking-tight">
            {step.title}
          </h2>
          
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-12 max-w-[320px]">
            {step.description}
          </p>

          <div className="flex items-center gap-2 mb-8">
            {STEPS.map((_, i) => (
              <div 
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === currentStep ? "w-8 bg-primary" : "w-1.5 bg-primary/20"
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-3 w-full">
            {currentStep > 0 && (
              <Button 
                variant="ghost" 
                className="flex-1 h-12 rounded-2xl"
                onClick={() => setCurrentStep(prev => prev - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            
            <Button 
              className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              onClick={() => {
                if (currentStep < STEPS.length - 1) {
                  setCurrentStep(prev => prev + 1);
                } else {
                  onClose();
                }
              }}
            >
              {currentStep === STEPS.length - 1 ? "Get Started" : "Next"}
              {currentStep < STEPS.length - 1 && <ChevronRight className="h-4 w-4 ml-2" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
