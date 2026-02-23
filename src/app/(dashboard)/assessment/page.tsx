"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageCircle, Send, MapPin } from "lucide-react";

const BODY_REGIONS = [
  { id: "head", label: "Head", emoji: "🧠" },
  { id: "neck", label: "Neck", emoji: "👤" },
  { id: "chest", label: "Chest", emoji: "🫀" },
  { id: "stomach", label: "Stomach", emoji: "🫃" },
  { id: "back", label: "Back", emoji: "🦴" },
  { id: "limbs", label: "Arms/Legs", emoji: "💪" },
  { id: "skin", label: "Skin", emoji: "✨" },
  { id: "general", label: "General", emoji: "🌡️" },
];

type Message = { role: "user" | "assistant"; content: string };

export default function AssessmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEmergency = searchParams.get("emergency") === "1";
  const [mode, setMode] = useState<"chat" | "quick">("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [bodyRegions, setBodyRegions] = useState<string[]>([]);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const userLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { userLocationRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude }; },
        () => {},
        { enableHighAccuracy: true }
      );
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isEmergency) {
      setInput("I need emergency help. I'm experiencing a critical situation.");
    }
  }, [isEmergency]);

  const toggleRegion = (id: string) => {
    setBodyRegions((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/assessment/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          assessmentId,
          bodyRegions: bodyRegions.length ? bodyRegions : undefined,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          userLat: userLocationRef.current?.lat,
          userLng: userLocationRef.current?.lng,
        }),
      });
      const data = await res.json();

      if (data.ok) {
        setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
        if (data.assessmentId) setAssessmentId(data.assessmentId);
        if (data.complete) {
          setComplete(true);
          if (typeof window !== "undefined") {
            sessionStorage.setItem(
              `assessment-${data.assessmentId}`,
              JSON.stringify({
                riskLevel: data.riskLevel,
                recommendations: data.recommendations || [],
                emergencyHospitals: data.emergencyHospitals,
              })
            );
          }
          setTimeout(() => {
            router.push(`/results?id=${data.assessmentId}`);
          }, 1500);
        }
      } else {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data.error || "Something went wrong. Please try again." },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Connection error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const starterPrompts = [
    "I have a fever and headache",
    "I've had cough for a few days",
    "Stomach pain and nausea",
    "I need help – not sure what's wrong",
  ];

  if (complete) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="rounded-xl bg-emerald-50 p-8 text-center">
          <p className="text-lg font-semibold text-emerald-700">Assessment complete</p>
          <p className="mt-2 text-slate-600">Redirecting to your results...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Health Assessment</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("chat")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              mode === "chat" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            <MessageCircle className="mr-1.5 inline h-4 w-4" />
            Chat
          </button>
          <button
            type="button"
            onClick={() => router.push("/assessment/quick")}
            className="rounded-lg px-3 py-1.5 text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            Quick form
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {messages.length === 0 && (
          <div className="border-b border-slate-200 p-6">
            <p className="text-slate-600">
              Describe your symptoms in your own words. I&apos;ll ask follow-up questions to understand better.
            </p>
            <p className="mt-4 text-sm font-medium text-slate-700">Where do you feel it? (optional)</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {BODY_REGIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggleRegion(r.id)}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm transition ${
                    bodyRegions.includes(r.id)
                      ? "bg-emerald-600 text-white"
                      : "border border-slate-200 bg-white hover:border-emerald-300"
                  }`}
                >
                  <span>{r.emoji}</span>
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
            <p className="mt-4 text-sm text-slate-500">Or tap a quick starter:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setInput(prompt)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="max-h-[400px] overflow-y-auto p-6 space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  m.role === "user"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-900"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm">{m.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-slate-100 px-4 py-3">
                <span className="animate-pulse text-slate-500">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        <div className="border-t border-slate-200 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your symptoms..."
              className="flex-1 rounded-lg border border-slate-300 px-4 py-3 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-lg bg-emerald-600 px-5 py-3 text-white disabled:opacity-50 hover:bg-emerald-700"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
