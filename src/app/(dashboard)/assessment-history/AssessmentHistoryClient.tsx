"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";

const RISK_COLORS: Record<string, string> = {
  low: "#38a169",
  medium: "#d69e2e",
  high: "#dd6b20",
  emergency: "#c53030",
};

type Assessment = {
  id: string;
  riskLevel: string;
  symptoms: string;
  createdAt: string;
};

export function AssessmentHistoryClient() {
  const [list, setList] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/assessments")
      .then((res) => res.json())
      .then((json) => {
        if (json.ok) setList(json.assessments || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mt-8 flex items-center justify-center rounded-xl border border-slate-200 bg-white py-16">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-12 text-center">
        <FileText className="mx-auto h-12 w-12 text-slate-300" />
        <h3 className="mt-4 font-semibold text-slate-900">No assessments yet</h3>
        <p className="mt-2 text-slate-500">
          Start your first health assessment to see results here.
        </p>
        <Link
          href="/assessment"
          className="mt-6 inline-block rounded-lg bg-emerald-600 px-6 py-2.5 font-medium text-white hover:bg-emerald-700"
        >
          Start Assessment
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      {list.map((a) => {
        let symptoms: string[] = [];
        try {
          const parsed = JSON.parse(a.symptoms);
          symptoms = Array.isArray(parsed.symptoms) ? parsed.symptoms : [];
        } catch {
          // ignore
        }
        return (
          <div
            key={a.id}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div>
              <p className="font-medium text-slate-900">
                {symptoms.slice(0, 3).join(", ")}
                {symptoms.length > 3 ? "..." : ""}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {new Date(a.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span
                className="rounded-full px-3 py-1 text-sm font-medium"
                style={{
                  backgroundColor: `${RISK_COLORS[a.riskLevel] || "#94a3b8"}20`,
                  color: RISK_COLORS[a.riskLevel] || "#64748b",
                }}
              >
                {a.riskLevel}
              </span>
              <Link
                href={`/results?id=${a.id}`}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                View
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
