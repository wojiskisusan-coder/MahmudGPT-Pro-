import React from "react";

interface Props {
  modeColor?: string;
}

const RGBBackground: React.FC<Props> = ({ modeColor = "purple" }) => {
  const colorSets: Record<string, string[]> = {
    purple: ["#7c3aed", "#6366f1", "#ec4899", "#8b5cf6"],
    blue: ["#3b82f6", "#6366f1", "#8b5cf6", "#06b6d4"],
    green: ["#10b981", "#06b6d4", "#3b82f6", "#14b8a6"],
    orange: ["#f97316", "#ec4899", "#ef4444", "#f59e0b"],
    cyan: ["#06b6d4", "#10b981", "#6366f1", "#22d3ee"],
  };

  const colors = colorSets[modeColor] || colorSets.purple;

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-radial from-background via-background to-background" />

      {/* Animated blobs - more vibrant */}
      <div
        className="absolute w-[700px] h-[700px] rounded-full opacity-[0.08] blur-[130px] animate-blob-1"
        style={{ background: `radial-gradient(circle, ${colors[0]}, ${colors[1]})`, top: "-15%", left: "-10%" }}
      />
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-[0.07] blur-[110px] animate-blob-2"
        style={{ background: `radial-gradient(circle, ${colors[1]}, ${colors[2]})`, bottom: "-10%", right: "-5%" }}
      />
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-[0.06] blur-[90px] animate-blob-3"
        style={{ background: `radial-gradient(circle, ${colors[2]}, ${colors[3]})`, top: "40%", left: "50%" }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-[0.05] blur-[100px] animate-blob-1"
        style={{ background: `radial-gradient(circle, ${colors[3]}, ${colors[0]})`, top: "20%", right: "20%", animationDelay: "5s" }}
      />

      {/* Particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-[0.12] animate-float-particle"
          style={{
            background: `radial-gradient(circle, ${colors[i % 4]}, transparent)`,
            width: `${2 + (i % 3)}px`,
            height: `${2 + (i % 3)}px`,
            left: `${(i * 5 + 3) % 100}%`,
            top: `${(i * 7 + 5) % 100}%`,
            animationDelay: `${i * 0.7}s`,
            animationDuration: `${12 + i * 1.5}s`,
          }}
        />
      ))}
    </div>
  );
};

export default RGBBackground;
