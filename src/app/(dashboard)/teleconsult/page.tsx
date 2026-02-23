"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { LiveAICallElevenLabs } from "./LiveAICallElevenLabs";

const MAX_CHARS = 500;
const MAX_CALL_EXCHANGES = 5;

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((e: Record<string, unknown>) => void) | null;
  onerror: ((e?: { error?: string }) => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

const RECORD_DURATION_MS = 8000;

function LiveAICall() {
  const [status, setStatus] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [callError, setCallError] = useState("");
  const [exchangeCount, setExchangeCount] = useState(0);
  const [conversation, setConversation] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [callActive, setCallActive] = useState(false);
  const callActiveRef = useRef(false);
  const exchangeCountRef = useRef(0);
  const historyRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);
  const assessmentIdRef = useRef<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const userLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const [emergencyHospitals, setEmergencyHospitals] = useState<{ name: string; address: string; phone: string | null; distanceText: string }[]>([]);

  const SpeechRecognitionAPI = typeof window !== "undefined"
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : undefined;

  const transcribeWithWhisper = async (blob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append("audio", blob, "audio.webm");
    const res = await fetch("/api/teleconsult/transcribe", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "Transcription failed");
    return data.text || "";
  };

  const speak = async (text: string) => {
    const toSpeak = text.slice(0, MAX_CHARS);
    const res = await fetch("/api/teleconsult/voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: toSpeak }),
    });
    const data = await res.json();
    if (!data.ok || !data.audio) throw new Error(data.error || "Voice failed");
    return new Promise<void>((resolve, reject) => {
      const audio = new Audio(`data:audio/mpeg;base64,${data.audio}`);
      audio.onended = () => resolve();
      audio.onerror = () => reject();
      audio.play();
    });
  };

  const processUserMessage = async (userText: string) => {
    if (exchangeCountRef.current >= MAX_CALL_EXCHANGES) {
      setCallError(`Call limit reached (${MAX_CALL_EXCHANGES} exchanges). End call to start a new one.`);
      setStatus("idle");
      setCallActive(false);
      return;
    }
    setStatus("thinking");
    setCallError("");
    setConversation((c) => [...c, { role: "user", text: userText }]);

    try {
      const res = await fetch("/api/assessment/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          assessmentId: assessmentIdRef.current,
          history: historyRef.current,
          userLat: userLocationRef.current?.lat,
          userLng: userLocationRef.current?.lng,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "AI failed");

      if (data.assessmentId) assessmentIdRef.current = data.assessmentId;
      historyRef.current = [
        ...historyRef.current,
        { role: "user", content: userText },
        { role: "assistant", content: data.reply },
      ];

      setConversation((c) => [...c, { role: "assistant", text: data.reply }]);
      if (data.emergencyHospitals?.length) setEmergencyHospitals(data.emergencyHospitals);
      const newCount = exchangeCountRef.current + 1;
      setExchangeCount(newCount);
      exchangeCountRef.current = newCount;
      setStatus("speaking");
      await speak(data.reply);
      if (data.complete) {
        setCallError("Assessment complete. You can end the call.");
      }
      if (callActiveRef.current && exchangeCountRef.current < MAX_CALL_EXCHANGES) {
        setStatus("listening");
        startWhisperRecording();
      } else {
        setStatus("idle");
      }
    } catch (e) {
      setCallError((e as Error).message || "Something went wrong");
      setStatus("idle");
      if (callActiveRef.current) startWhisperRecording();
    }
  };

  const startWhisperRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (chunksRef.current.length === 0) {
          if (callActiveRef.current && exchangeCountRef.current < MAX_CALL_EXCHANGES)
            setTimeout(startWhisperRecording, 500);
          return;
        }
        const mime = mediaRecorderRef.current?.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mime });
        try {
          const text = await transcribeWithWhisper(blob);
          if (text.length >= 2) {
            await processUserMessage(text);
          } else if (callActiveRef.current && exchangeCountRef.current < MAX_CALL_EXCHANGES) {
            setStatus("listening");
            setTimeout(startWhisperRecording, 500);
          } else {
            setStatus("idle");
          }
        } catch (err) {
          setCallError((err as Error).message || "Transcription failed");
          if (callActiveRef.current) setTimeout(startWhisperRecording, 1000);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setStatus("listening");
      setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, RECORD_DURATION_MS);
    } catch (err) {
      setCallError("Microphone access denied. Allow mic in browser settings.");
      setStatus("idle");
    }
  };

  const stopWhisperRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    mediaRecorderRef.current = null;
    streamRef.current = null;
  };

  const startCall = () => {
    setCallError("");
    setExchangeCount(0);
    setEmergencyHospitals([]);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { userLocationRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude }; },
        () => {},
        { enableHighAccuracy: true }
      );
    }
    exchangeCountRef.current = 0;
    setConversation([]);
    historyRef.current = [];
    assessmentIdRef.current = null;
    setCallActive(true);
    callActiveRef.current = true;

    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => setStatus("listening");
      recognition.onend = () => {
        if (callActiveRef.current && recognitionRef.current === recognition) {
          setStatus((s) => {
            if (s === "listening") {
              try { recognition.start(); } catch {}
            }
            return s;
          });
        }
      };
      recognition.onresult = (e: Record<string, unknown>) => {
        const results = e.results as { length?: number; [i: number]: { 0?: { transcript?: string }; length?: number } };
        const len = results?.length ?? 0;
        if (len > 0) {
          const last = results[len - 1];
          const transcript = last?.[0]?.transcript?.trim();
          if (transcript) processUserMessage(transcript);
        }
      };
      recognition.onerror = (e?: { error?: string }) => {
        const err = (e as { error?: string } | undefined)?.error;
        if (err === "network" || err === "no-speech" || err === "aborted") {
          if (callActiveRef.current) {
            recognitionRef.current = null;
            try { recognition.stop(); } catch {}
            setCallError("Switching to Whisper (works without Chrome). Speak during each 8-second window.");
            startWhisperRecording();
          }
        } else if (err === "not-allowed" || err === "service-not-allowed") {
          setCallError("Microphone denied. Allow mic access.");
          setCallActive(false);
          callActiveRef.current = false;
          setStatus("idle");
        } else if (err && !["no-speech", "aborted"].includes(err)) {
          setCallError("Voice failed. Using Whisper instead…");
          if (callActiveRef.current) startWhisperRecording();
        }
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
        setStatus("listening");
      } catch {
        startWhisperRecording();
      }
    } else {
      startWhisperRecording();
    }
  };

  const stopCall = () => {
    setCallActive(false);
    callActiveRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    stopWhisperRecording();
    setStatus("idle");
  };

  const toggleCall = () => {
    if (callActiveRef.current || callActive || status === "listening") {
      stopCall();
    } else if (exchangeCount < MAX_CALL_EXCHANGES) {
      startCall();
    }
  };

  const [fallbackInput, setFallbackInput] = useState("");

  const handleFallbackSubmit = () => {
    const text = fallbackInput.trim();
    if (!text) return;
    setFallbackInput("");
    processUserMessage(text);
  };

  return (
    <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
      <p className="text-sm text-slate-600">
        Like a normal call: click to start, then just talk. No need to click between turns. AI listens and responds with voice.
      </p>
      <p className="mt-2 text-xs text-slate-500">
        Uses Whisper when Chrome speech fails (e.g. network issues). Requires mic permission.
      </p>
      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          onClick={toggleCall}
          disabled={status === "thinking" || status === "speaking"}
          className={`flex h-16 w-16 items-center justify-center rounded-full text-white transition ${
            callActive || status === "listening"
              ? "animate-pulse bg-rose-500 hover:bg-rose-600"
              : "bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
          }`}
        >
          {callActive || status === "listening" ? (
            <PhoneOff className="h-8 w-8" />
          ) : (
            <Phone className="h-8 w-8" />
          )}
        </button>
        <div>
          <p className="font-medium text-slate-900">
            {status === "idle" && !callActive && "Click to start call"}
            {status === "listening" && "Listening…"}
            {status === "thinking" && "Thinking…"}
            {status === "speaking" && "AI is speaking…"}
          </p>
          <p className="text-sm text-slate-500">
            {exchangeCount} / {MAX_CALL_EXCHANGES} exchanges
          </p>
        </div>
      </div>
      {callError && <p className="mt-4 text-sm text-rose-600">{callError}</p>}
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={fallbackInput}
          onChange={(e) => setFallbackInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleFallbackSubmit()}
          placeholder="Or type your message here if mic isn't working..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          disabled={status === "thinking" || status === "speaking"}
        />
        <button
          type="button"
          onClick={handleFallbackSubmit}
          disabled={!fallbackInput.trim() || status === "thinking" || status === "speaking"}
          className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50 hover:bg-slate-300"
        >
          Send
        </button>
      </div>
      {conversation.length > 0 && (
        <div className="mt-6 max-h-48 space-y-3 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4">
          {conversation.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.role === "user" ? "bg-emerald-600 text-white" : "bg-white text-slate-900"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>
      )}
      {emergencyHospitals.length > 0 && (
        <div className="mt-4 rounded-xl border-2 border-rose-200 bg-rose-50 p-4">
          <p className="font-semibold text-rose-900">Nearest hospitals – call now</p>
          <div className="mt-3 space-y-2">
            {emergencyHospitals.map((h) => (
              <div key={h.name} className="flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-white p-3">
                <div>
                  <p className="font-medium text-slate-900">{h.name}</p>
                  <p className="text-xs text-slate-600">{h.address}</p>
                  <p className="text-xs text-slate-500">{h.distanceText}</p>
                </div>
                {h.phone && (
                  <a href={`tel:${h.phone}`} className="shrink-0 rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700">
                    Call
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TeleconsultContent() {
  const searchParams = useSearchParams();
  const [text, setText] = useState("");
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const t = searchParams.get("text");
    if (t) setText(decodeURIComponent(t));
  }, [searchParams]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const charCount = text.length;
  const overLimit = charCount > MAX_CHARS;

  const handlePlay = async () => {
    const toSpeak = text.trim().slice(0, MAX_CHARS);
    if (!toSpeak) {
      setError("Enter text to hear");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/teleconsult/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: toSpeak }),
      });
      const data = await res.json();
      if (data.ok && data.audio) {
        const audio = new Audio(`data:audio/mpeg;base64,${data.audio}`);
        audioRef.current = audio;
        audio.onplay = () => setPlaying(true);
        audio.onended = () => setPlaying(false);
        await audio.play();
      } else {
        setError(data.error || "Voice failed");
      }
    } catch (e) {
      setError("Connection failed");
    } finally {
      setLoading(false);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
    }
  };

  const [mode, setMode] = useState<"playback" | "call">("call");

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Voice Teleconsultation</h1>
      <p className="mt-1 text-slate-500">
        Talk to the AI health assistant or hear recommendations aloud.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("call")}
          className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
            mode === "call" ? "bg-emerald-600 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Live AI call
        </button>
        <button
          type="button"
          onClick={() => setMode("playback")}
          className={`rounded-lg px-4 py-2.5 text-sm font-medium ${
            mode === "playback" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Hear aloud
        </button>
      </div>

      {mode === "call" && (
        <>
          <LiveAICallElevenLabs />
          {!process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-slate-700">Fallback (no agent):</p>
              <LiveAICall />
            </div>
          )}
        </>
      )}

      {mode === "playback" && (
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-600">
          Paste your assessment recommendations below, or type a message to hear it read aloud in a natural voice.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          className="mt-4 w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="e.g. Based on your symptoms: 1. Rest and drink plenty of fluids. 2. Monitor your fever. 3. Visit a clinic if symptoms worsen..."
        />
        <div className="mt-2 flex items-center justify-between">
          <span className={`text-sm ${overLimit ? "text-rose-600" : "text-slate-500"}`}>
            {charCount} / {MAX_CHARS} characters
          </span>
          <div className="flex gap-3">
            {playing ? (
              <button
                type="button"
                onClick={handleStop}
                className="flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 font-medium text-white hover:bg-rose-600"
              >
                <MicOff className="h-5 w-5" />
                Stop
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePlay}
                disabled={loading || !text.trim() || overLimit}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white disabled:opacity-50 hover:bg-emerald-700"
              >
                <Mic className="h-5 w-5" />
                {loading ? "Generating…" : "Play Voice"}
              </button>
            )}
          </div>
        </div>
        {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      </div>
      )}

      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm text-amber-800">
          <strong>Free tier limit:</strong> Voice is capped at ~{MAX_CHARS} chars per response. Live call limited to {MAX_CALL_EXCHANGES} exchanges.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          href="/assessment-history"
          className="text-emerald-600 hover:underline"
        >
          View my assessments →
        </Link>
        <Link href="/clinics" className="text-emerald-600 hover:underline">
          Find clinics to call →
        </Link>
      </div>
    </div>
  );
}

export default function TeleconsultPage() {
  return (
    <Suspense fallback={<div className="py-16 text-slate-500">Loading…</div>}>
      <TeleconsultContent />
    </Suspense>
  );
}
