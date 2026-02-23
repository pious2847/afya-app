"use client";

import { useState, useCallback, useEffect } from "react";
import { useConversation } from "@elevenlabs/react";
import { Phone, PhoneOff } from "lucide-react";
import { Orb } from "@/components/Orb";

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || "";

export function LiveAICallElevenLabs() {
  const [agentState, setAgentState] = useState<"disconnected" | "connecting" | "connected" | "disconnecting">("disconnected");
  const [orbState, setOrbState] = useState<"idle" | "connecting" | "listening" | "speaking">("idle");
  const [error, setError] = useState("");

  const conversation = useConversation({
    onConnect: () => {
      setAgentState("connected");
      setOrbState("listening");
      setError("");
    },
    onDisconnect: (details?: unknown) => {
      setAgentState("disconnected");
      setOrbState("idle");
      const d = details as { closeReason?: string } | undefined;
      const reason = String(d?.closeReason || "").toLowerCase();
      if (reason.includes("quota")) {
        setError("API quota exceeded. Please check your ElevenLabs plan.");
      }
    },
    onStatusChange: (status: { status: string }) => {
      setAgentState(status.status as "disconnected" | "connecting" | "connected" | "disconnecting");
      if (status.status === "connected") setOrbState("listening");
      else if (status.status === "connecting") setOrbState("connecting");
      else if (status.status === "disconnected") setOrbState("idle");
    },
    onModeChange: (mode: { mode?: string }) => {
      if (mode?.mode === "speaking") setOrbState("speaking");
      else if (mode?.mode === "listening" || agentState === "connected") setOrbState("listening");
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : String(err || "Connection error"));
    },
  });

  useEffect(() => {
    if (conversation.isSpeaking) setOrbState("speaking");
    else if (agentState === "connected") setOrbState("listening");
  }, [conversation.isSpeaking, agentState]);

  const startCall = useCallback(async () => {
    if (!AGENT_ID) {
      setError("ElevenLabs Agent not configured. Add NEXT_PUBLIC_ELEVENLABS_AGENT_ID to .env");
      return;
    }
    setError("");
    setAgentState("connecting");
    setOrbState("connecting");
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (micErr) {
      setError("Microphone access denied. Allow mic in browser settings.");
      setAgentState("disconnected");
      setOrbState("idle");
      return;
    }
    try {
      await conversation.startSession({
        agentId: AGENT_ID,
        connectionType: "webrtc",
      });
    } catch (sessionErr: unknown) {
      const msg = sessionErr instanceof Error ? sessionErr.message : String(sessionErr);
      setError(msg || "Failed to connect");
      setAgentState("disconnected");
      setOrbState("idle");
    }
  }, [conversation]);

  const stopCall = useCallback(async () => {
    await conversation.endSession();
    setAgentState("disconnected");
    setOrbState("idle");
  }, [conversation]);

  const toggleCall = () => {
    if (agentState === "connected" || agentState === "connecting") {
      stopCall();
    } else {
      startCall();
    }
  };

  if (!AGENT_ID) {
    return (
      <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6">
        <p className="font-medium text-amber-800">ElevenLabs Agent not configured</p>
        <p className="mt-2 text-sm text-amber-700">
          Add <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_ELEVENLABS_AGENT_ID</code> to your .env to use
          the natural voice call (like talking to a real person). Create an agent at{" "}
          <a href="https://elevenlabs.io/app/conversational-ai" target="_blank" rel="noopener noreferrer" className="underline">
            elevenlabs.io
          </a>.
        </p>
        <p className="mt-4 text-sm text-amber-600">
          The fallback flow (Chrome speech + Whisper) will be used instead.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
      {/* Prominent call button – easy to tap */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
        <button
          type="button"
          onClick={toggleCall}
          disabled={agentState === "connecting" || agentState === "disconnecting"}
          className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-white shadow-lg transition-all hover:scale-105 active:scale-95 sm:h-24 sm:w-24 ${
            agentState === "connected" || agentState === "disconnecting"
              ? "bg-rose-500 hover:bg-rose-600"
              : "bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60"
          }`}
          aria-label={agentState === "connected" ? "End call" : "Start AI call"}
        >
          {agentState === "connected" || agentState === "disconnecting" ? (
            <PhoneOff className="h-10 w-10 sm:h-12 sm:w-12" />
          ) : (
            <Phone className="h-10 w-10 sm:h-12 sm:w-12" />
          )}
        </button>
        <div className="text-center sm:text-left">
          <p className="font-semibold text-slate-900">
            {agentState === "connected"
              ? "Call active – speak naturally"
              : agentState === "connecting"
              ? "Connecting…"
              : "Tap to call AfyaAI"}
          </p>
          <p className="text-sm text-slate-500">
            {agentState === "connected"
              ? "No need to click between turns"
              : "Natural voice conversation. Requires mic."}
          </p>
        </div>
      </div>

      {/* Orb and status when in call */}
      {(agentState === "connected" || agentState === "connecting") && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
          <div className="flex flex-col items-center gap-3">
            <Orb state={orbState} size="lg" />
            <p className="text-sm text-slate-600">
              {orbState === "listening" && "Listening…"}
              {orbState === "speaking" && "AfyaAI is speaking…"}
              {orbState === "connecting" && "Connecting…"}
            </p>
          </div>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
    </div>
  );
}
