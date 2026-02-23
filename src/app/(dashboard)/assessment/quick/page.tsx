"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const SYMPTOM_CATEGORIES = [
  { id: "general", label: "General", options: ["Fever", "Fatigue", "Headache", "Body aches", "Loss of appetite", "Weight loss"] },
  { id: "respiratory", label: "Respiratory", options: ["Cough", "Shortness of breath", "Chest pain", "Sore throat", "Runny nose"] },
  { id: "digestive", label: "Digestive", options: ["Nausea", "Vomiting", "Diarrhea", "Stomach pain", "Difficulty swallowing"] },
  { id: "other", label: "Other", options: ["Skin rash", "Swelling", "Dizziness", "Vision problems", "Pain when urinating", "Bleeding"] },
];

const SEVERITY_OPTIONS = [
  { value: "mild", label: "Mild", description: "Barely noticeable" },
  { value: "moderate", label: "Moderate", description: "Uncomfortable but manageable" },
  { value: "severe", label: "Severe", description: "Significantly affects daily life" },
  { value: "critical", label: "Critical", description: "Emergency – need immediate help" },
];

export default function QuickAssessmentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [symptomDetails, setSymptomDetails] = useState("");
  const [severity, setSeverity] = useState("");
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const handleSubmit = async () => {
    if (!selectedSymptoms.length) return;
    setLoading(true);
    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms: selectedSymptoms,
          details: symptomDetails,
          severity,
          duration,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem(
            `assessment-${data.assessmentId}`,
            JSON.stringify({ riskLevel: data.riskLevel, recommendations: data.recommendations || [] })
          );
        }
        router.push(`/results?id=${data.assessmentId}`);
      } else {
        alert(data.error || "Assessment failed");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.push("/assessment")}
          className="text-sm text-slate-500 hover:text-emerald-600"
        >
          ← Back to chat
        </button>
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Quick Assessment</h1>
      <p className="mt-1 text-slate-500">Step {step} of 3</p>
      <div className="mb-8 mt-6 h-2 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${(step / 3) * 100}%` }} />
      </div>

      {step === 1 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">What symptoms are you experiencing?</h2>
          <div className="mt-8 space-y-6">
            {SYMPTOM_CATEGORIES.map((cat) => (
              <div key={cat.id}>
                <h3 className="mb-3 font-medium text-slate-700">{cat.label}</h3>
                <div className="flex flex-wrap gap-2">
                  {cat.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleSymptom(opt)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        selectedSymptoms.includes(opt) ? "bg-emerald-600 text-white" : "border border-slate-200 bg-white text-slate-700 hover:border-emerald-400"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 flex justify-end">
            <button type="button" onClick={() => setStep(2)} disabled={!selectedSymptoms.length} className="rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white disabled:opacity-50 hover:bg-emerald-700">Next</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Tell us more</h2>
          <div className="mt-8 space-y-6">
            <div>
              <label className="block font-medium text-slate-700">Additional details (optional)</label>
              <textarea value={symptomDetails} onChange={(e) => setSymptomDetails(e.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="e.g. Fever started 2 days ago..." />
            </div>
            <div>
              <label className="block font-medium text-slate-700">Severity</label>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {SEVERITY_OPTIONS.map((s) => (
                  <button key={s.value} type="button" onClick={() => setSeverity(s.value)} className={`rounded-lg border p-4 text-left transition ${severity === s.value ? "border-emerald-500 bg-emerald-50" : "border-slate-200"}`}>
                    <span className="font-medium">{s.label}</span>
                    <p className="mt-1 text-sm text-slate-500">{s.description}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block font-medium text-slate-700">Duration</label>
              <select value={duration} onChange={(e) => setDuration(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-emerald-500 focus:outline-none">
                <option value="">Select duration</option>
                <option value="hours">Less than 24 hours</option>
                <option value="days">1–3 days</option>
                <option value="week">4–7 days</option>
                <option value="weeks">More than a week</option>
              </select>
            </div>
          </div>
          <div className="mt-10 flex justify-between">
            <button type="button" onClick={() => setStep(1)} className="rounded-lg border border-slate-300 px-6 py-3 font-medium hover:bg-slate-50">Back</button>
            <button type="button" onClick={() => setStep(3)} disabled={!severity} className="rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white disabled:opacity-50 hover:bg-emerald-700">Next</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Review and submit</h2>
          <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-6">
            <p className="font-medium">Selected: {selectedSymptoms.join(", ")}</p>
            <p className="mt-2">Severity: {severity}</p>
          </div>
          <div className="mt-10 flex justify-between">
            <button type="button" onClick={() => setStep(2)} className="rounded-lg border border-slate-300 px-6 py-3 font-medium hover:bg-slate-50">Back</button>
            <button type="button" onClick={handleSubmit} disabled={loading} className="rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white disabled:opacity-50 hover:bg-emerald-700">{loading ? "Analyzing…" : "Get Assessment"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
