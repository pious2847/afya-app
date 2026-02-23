"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Share2, Video, Mic, Printer } from "lucide-react";

const RISK_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  low: { label: "Low Risk", color: "text-emerald-600", bg: "bg-emerald-50", icon: "✓" },
  medium: { label: "Medium Risk", color: "text-amber-600", bg: "bg-amber-50", icon: "!" },
  high: { label: "High Risk", color: "text-orange-600", bg: "bg-orange-50", icon: "!" },
  emergency: { label: "Emergency", color: "text-rose-600", bg: "bg-rose-50", icon: "!!" },
};

type EmergencyHospital = { name: string; address: string; phone: string | null; distanceText: string };

function ResultsContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [data, setData] = useState<{ riskLevel: string; recommendations: string[]; emergencyHospitals?: EmergencyHospital[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [matchedClinics, setMatchedClinics] = useState<{ name: string; address: string; phone: string | null }[] | null>(null);
  const [emergencyHospitals, setEmergencyHospitals] = useState<EmergencyHospital[] | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const fromStorage = typeof window !== "undefined" ? sessionStorage.getItem(`assessment-${id}`) : null;
    if (fromStorage) {
      try {
        const parsed = JSON.parse(fromStorage);
        setData(parsed);
        if (parsed.emergencyHospitals?.length) setEmergencyHospitals(parsed.emergencyHospitals);
      } catch {}
      setLoading(false);
      return;
    }
    fetch(`/api/assessment/${id}`)
      .then((r) => r.json())
      .then((j) => { if (j.ok) setData(j); })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!data?.riskLevel) return;
    if (data.emergencyHospitals?.length) {
      setEmergencyHospitals(data.emergencyHospitals);
    }
    fetch("/api/clinics/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ riskLevel: data.riskLevel }),
    })
      .then((r) => r.json())
      .then((j) => j.ok && setMatchedClinics(j.clinics?.slice(0, 3)));
  }, [data?.riskLevel, data?.emergencyHospitals]);

  useEffect(() => {
    if (data?.riskLevel !== "emergency" || emergencyHospitals?.length) return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        fetch(`/api/clinics/nearby?lat=${latitude}&lng=${longitude}&type=hospital&limit=5`)
          .then((r) => r.json())
          .then((j) => j.ok && j.clinics?.length && setEmergencyHospitals(j.clinics));
      },
      () => {}
    );
  }, [data?.riskLevel, emergencyHospitals?.length]);

  const handleShare = () => {
    const text = data
      ? `AfyaAI Assessment: ${data.riskLevel} risk. Recommendations: ${data.recommendations?.join("; ")}`
      : "";
    if (navigator.share) {
      navigator.share({
        title: "AfyaAI Assessment",
        text,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text);
    }
  };

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-slate-500">Loading…</div>;
  }
  if (!data) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-900">Assessment not found</h2>
        <Link href="/assessment" className="mt-4 inline-block text-emerald-600 hover:underline">Start new assessment</Link>
      </div>
    );
  }

  const config = RISK_CONFIG[data.riskLevel] || RISK_CONFIG.low;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h1 className="text-2xl font-bold text-slate-900">Assessment Result</h1>
      <p className="mt-2 text-slate-500">Based on your symptoms, here is our assessment.</p>

      <div className={`mt-8 flex items-center gap-4 rounded-xl p-6 ${config.bg}`}>
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl font-bold ${config.color}`}>
          {config.icon}
        </div>
        <div>
          <p className={`text-xl font-semibold ${config.color}`}>{config.label}</p>
          <p className="mt-1 text-sm text-slate-600">
            {data.riskLevel === "emergency" ? "Seek emergency care immediately." :
             data.riskLevel === "high" ? "Visit a healthcare provider soon." :
             data.riskLevel === "medium" ? "Consider visiting a clinic if symptoms persist." :
             "Monitor at home. Seek care if symptoms worsen."}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-semibold text-slate-900">Recommendations</h2>
        <ul className="mt-3 space-y-3">
          {data.recommendations?.map((rec, i) => (
            <li key={i} className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <span className="text-emerald-600">{i + 1}.</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm font-medium text-blue-800">Symptom insight</p>
        <p className="mt-1 text-sm text-blue-700">
          People with similar symptoms often benefit from rest, fluids, and monitoring. Visit a clinic if anything worsens.
        </p>
      </div>

      {data?.riskLevel === "emergency" && emergencyHospitals && emergencyHospitals.length > 0 && (
        <div className="mt-6 rounded-xl border-2 border-rose-200 bg-rose-50 p-6">
          <h3 className="font-semibold text-rose-900">Nearest hospitals – call now</h3>
          <p className="mt-1 text-sm text-rose-700">Contact these facilities immediately for emergency care.</p>
          <div className="mt-4 space-y-3">
            {emergencyHospitals.map((h) => (
              <div key={h.name} className="flex items-center justify-between gap-4 rounded-lg border border-rose-200 bg-white p-4">
                <div>
                  <p className="font-medium text-slate-900">{h.name}</p>
                  <p className="text-sm text-slate-600">{h.address}</p>
                  <p className="mt-1 text-xs text-slate-500">{h.distanceText}</p>
                </div>
                {h.phone && (
                  <a
                    href={`tel:${h.phone}`}
                    className="shrink-0 rounded-lg bg-rose-600 px-4 py-2 font-medium text-white hover:bg-rose-700"
                  >
                    Call
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {matchedClinics && matchedClinics.length > 0 && data?.riskLevel !== "emergency" && (
        <div className="mt-6">
          <h3 className="font-semibold text-slate-900">Recommended clinics for your risk level</h3>
          <div className="mt-3 space-y-2">
            {matchedClinics.map((c) => (
              <div key={c.name} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="font-medium text-slate-900">{c.name}</p>
                <p className="text-sm text-slate-600">{c.address}</p>
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="mt-1 inline-block text-sm font-medium text-emerald-600 hover:underline">
                    {c.phone}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/clinics" className="rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white hover:bg-emerald-700">
          Find Matched Clinics
        </Link>
        <Link
          href={`/teleconsult?text=${encodeURIComponent((data.recommendations || []).join(". "))}`}
          className="flex items-center gap-2 rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 hover:bg-slate-50"
        >
          <Mic className="h-5 w-5" />
          Hear Aloud
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 hover:bg-slate-50"
        >
          <Printer className="h-5 w-5" />
          Print / Export
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-2 rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 hover:bg-slate-50"
        >
          <Share2 className="h-5 w-5" />
          Share
        </button>
        <Link href="/assessment" className="rounded-lg border border-slate-300 px-6 py-3 font-medium hover:bg-slate-50">
          New Assessment
        </Link>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <div>
      <Suspense fallback={<div className="py-16 text-center text-slate-500">Loading…</div>}>
        <ResultsContent />
      </Suspense>
    </div>
  );
}
