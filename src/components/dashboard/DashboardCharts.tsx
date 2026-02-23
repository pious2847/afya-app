"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const RISK_COLORS: Record<string, string> = {
  low: "#38a169",
  medium: "#d69e2e",
  high: "#dd6b20",
  emergency: "#c53030",
};

export function DashboardCharts({ admin }: { admin?: boolean }) {
  const [data, setData] = useState<{
    user: { total: number; byRisk: Record<string, number>; recent: unknown[] };
    system?: { total: number; byRisk: Record<string, number>; weekly: { date: string; count: number }[] };
  } | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => res.json())
      .then((json) => json.ok && setData(json));
  }, []);

  if (!data) return null;

  const pieData = Object.entries(data.user.byRisk).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Stats row */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="font-semibold text-slate-900">Your Assessments</h3>
        <p className="mt-1 text-3xl font-bold text-emerald-600">
          {data.user.total}
        </p>
        <p className="mt-1 text-sm text-slate-500">Total assessments to date</p>
      </div>
      {admin && data.system && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-semibold text-slate-900">System-wide Assessments</h3>
          <p className="mt-1 text-3xl font-bold text-emerald-600">
            {data.system.total}
          </p>
          <p className="mt-1 text-sm text-slate-500">All users</p>
        </div>
      )}

      {/* Risk distribution pie */}
      {pieData.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-semibold text-slate-900">Risk Distribution (You)</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={RISK_COLORS[entry.name.toLowerCase()] || "#94a3b8"}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Weekly trend (admin) */}
      {admin && data.system && data.system.weekly.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-semibold text-slate-900">Weekly Trend</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.system.weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  stroke="#64748b"
                />
                <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent assessments */}
      {data.user.recent.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <h3 className="font-semibold text-slate-900">Recent Assessments</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Risk Level</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data.user.recent as { id: string; riskLevel: string; createdAt: string }[]).slice(0, 5).map((r) => (
                  <tr key={r.id} className="border-b border-slate-100">
                    <td className="py-3 text-slate-600">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <span
                        className="rounded-full px-2 py-1 text-xs font-medium"
                        style={{
                          backgroundColor: `${RISK_COLORS[r.riskLevel] || "#94a3b8"}20`,
                          color: RISK_COLORS[r.riskLevel] || "#64748b",
                        }}
                      >
                        {r.riskLevel}
                      </span>
                    </td>
                    <td>
                      <a
                        href={`/results?id=${r.id}`}
                        className="text-emerald-600 hover:underline"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
