"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  MapPin,
  BarChart3,
  TrendingUp,
  Shield,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const RISK_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  low: { color: "text-emerald-700", bg: "bg-emerald-100", label: "Low" },
  medium: { color: "text-amber-700", bg: "bg-amber-100", label: "Medium" },
  high: { color: "text-orange-700", bg: "bg-orange-100", label: "High" },
  emergency: { color: "text-rose-700", bg: "bg-rose-100", label: "Emergency" },
};

const RISK_CHART_COLORS: Record<string, string> = {
  low: "#10b981",
  medium: "#d69e2e",
  high: "#ea580c",
  emergency: "#e11d48",
};

export function AdminOverview() {
  const [stats, setStats] = useState<{
    totalAssessments: number;
    totalClinics: number;
    weekly: { date: string; count: number }[];
    byRisk: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/analytics").then((r) => r.json()),
      fetch("/api/clinics").then((r) => r.json()),
    ]).then(([analytics, clinicsData]) => {
      if (analytics.ok && analytics.system) {
        setStats({
          totalAssessments: analytics.system.total,
          totalClinics: clinicsData.clinics?.length ?? 0,
          weekly: analytics.system.weekly ?? [],
          byRisk: analytics.system.byRisk ?? {},
        });
      } else {
        setStats({
          totalAssessments: 0,
          totalClinics: clinicsData.clinics?.length ?? 0,
          weekly: [],
          byRisk: {},
        });
      }
    });
  }, []);

  if (!stats) {
    return (
      <div className="mt-8 flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-slate-500">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const pieData = Object.entries(stats.byRisk)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({
      name: RISK_CONFIG[name]?.label || name,
      value,
      fill: RISK_CHART_COLORS[name] || "#94a3b8",
    }));

  const weeklyFormatted = stats.weekly.map((w) => ({
    ...w,
    shortDate: new Date(w.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
  }));

  const hasEmergency = (stats.byRisk.emergency ?? 0) > 0;

  return (
    <div className="mt-8 space-y-8">
      {/* Hero / Status banner */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-white shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20">
              <Shield className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Admin Dashboard</h2>
              <p className="mt-1 text-slate-300">System health and analytics at a glance</p>
            </div>
          </div>
          {hasEmergency && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-500/20 px-4 py-2 text-rose-200">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm font-medium">{stats.byRisk.emergency} emergency assessment(s)</span>
            </div>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Assessments</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{stats.totalAssessments}</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
              <Activity className="h-7 w-7 text-emerald-600" />
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-slate-500">Clinics</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{stats.totalClinics}</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100">
              <MapPin className="h-7 w-7 text-blue-600" />
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-blue-400 to-blue-600" />
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-slate-500">Risk Levels</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{Object.keys(stats.byRisk).length}</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
              <TrendingUp className="h-7 w-7 text-amber-600" />
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
        </div>
        <Link
          href="/admin/analytics"
          className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-emerald-200 hover:shadow-md"
        >
          <div className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-slate-500">Full Analytics</p>
              <p className="mt-1 text-lg font-semibold text-emerald-600 group-hover:text-emerald-700">View details</p>
            </div>
            <ArrowRight className="h-6 w-6 text-emerald-500 transition-transform group-hover:translate-x-1" />
          </div>
          <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
        </Link>
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Risk distribution pie */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h3 className="font-semibold text-slate-900">Risk Distribution</h3>
            <p className="text-sm text-slate-500">Breakdown of assessment risk levels</p>
          </div>
          <div className="p-6">
            {pieData.length > 0 ? (
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="h-56 w-full sm:h-64 sm:w-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number | undefined) => [`${value ?? 0} assessments`, "Count"]}
                        contentStyle={{ borderRadius: "8px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-1 flex-wrap gap-3">
                  {Object.entries(stats.byRisk).map(([level, count]) => {
                    const cfg = RISK_CONFIG[level] || RISK_CONFIG.low;
                    return (
                      <div
                        key={level}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 ${cfg.bg}`}
                      >
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: RISK_CHART_COLORS[level] || "#94a3b8" }}
                        />
                        <span className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</span>
                        <span className="text-sm font-bold text-slate-700">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center rounded-xl bg-slate-50">
                <p className="text-slate-500">No assessment data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Weekly trend */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h3 className="font-semibold text-slate-900">Weekly Trend</h3>
            <p className="text-sm text-slate-500">Assessments over the last 7 days</p>
          </div>
          <div className="p-6">
            {weeklyFormatted.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyFormatted}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="shortDate"
                      tick={{ fontSize: 11 }}
                      stroke="#64748b"
                    />
                    <YAxis tick={{ fontSize: 11 }} stroke="#64748b" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: "8px" }}
                      formatter={(value: number | undefined) => [`${value ?? 0} assessments`, "Count"]}
                    />
                    <Bar
                      dataKey="count"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-xl bg-slate-50">
                <p className="text-slate-500">No data for the past week</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-slate-900">Quick Actions</h3>
        <p className="mt-1 text-sm text-slate-500">Common admin tasks</p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link
            href="/admin/clinics"
            className="flex items-center gap-3 rounded-xl border-2 border-emerald-500 bg-emerald-50 px-6 py-4 font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            <MapPin className="h-6 w-6" />
            Manage Clinics
          </Link>
          <Link
            href="/admin/analytics"
            className="flex items-center gap-3 rounded-xl border-2 border-slate-200 bg-slate-50 px-6 py-4 font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100"
          >
            <BarChart3 className="h-6 w-6" />
            Full Analytics
          </Link>
        </div>
      </div>
    </div>
  );
}
