"use client";

type OrbState = "idle" | "connecting" | "listening" | "speaking" | "error";

interface OrbProps extends React.HTMLAttributes<HTMLDivElement> {
  state?: OrbState;
  size?: "sm" | "md" | "lg";
}

export function Orb({ state = "idle", size = "lg", className = "", ...props }: OrbProps) {
  const sizeClasses = {
    sm: "w-24 h-24",
    md: "w-32 h-32",
    lg: "w-40 h-40",
  };

  const stateClasses = {
    idle: "bg-gradient-to-br from-emerald-500/20 to-emerald-600/10",
    connecting: "bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 animate-pulse",
    listening: "bg-gradient-to-br from-emerald-500/40 to-emerald-600/30 animate-pulse",
    speaking: "bg-gradient-to-br from-emerald-500/40 to-teal-600/30",
    error: "bg-gradient-to-br from-rose-500/30 to-rose-600/20",
  };

  return (
    <div
      className={`relative flex items-center justify-center ${sizeClasses[size]} ${className}`}
      {...props}
    >
      <div
        className={`absolute inset-0 rounded-full ${stateClasses[state]} ${(state === "listening" || state === "speaking") ? "animate-ping opacity-20" : ""}`}
      />
      <div
        className={`absolute inset-2 rounded-full ${stateClasses[state]} ${(state === "listening" || state === "speaking") ? "animate-pulse" : ""}`}
      />
      <div
        className={`absolute inset-4 rounded-full ${
          state === "idle"
            ? "bg-gradient-to-br from-emerald-500/40 to-emerald-600/30"
            : state === "connecting"
            ? "bg-gradient-to-br from-emerald-500/60 to-emerald-600/50 animate-pulse"
            : state === "listening"
            ? "bg-gradient-to-br from-emerald-500/70 to-emerald-600/60"
            : state === "speaking"
            ? "bg-gradient-to-br from-emerald-500/70 to-teal-600/60 animate-pulse"
            : "bg-gradient-to-br from-rose-500/60 to-rose-600/50"
        }`}
      />
      <div
        className={`absolute inset-8 rounded-full ${
          state === "idle" ? "bg-emerald-500/50" :
          state === "connecting" ? "bg-emerald-500 animate-pulse" :
          state === "listening" ? "bg-emerald-500" :
          state === "speaking" ? "bg-teal-500 animate-pulse" :
          "bg-rose-500"
        }`}
      />
    </div>
  );
}
