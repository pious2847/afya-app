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

export function AdminAnalyticsCharts() {
  const [data, setData] = useState<{
    total: number;
    byRisk: Record<string, number>;
    weekly: { date: string; count: number }[];
  } | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok && j.system) setData(j.system);
      });
  }, []);

  if (!data) {
    return (
      <div className="mt-8 flex justify-center py-16">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  const pieData = Object.entries(data.byRisk).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="font-semibold text-slate-900">Total Assessments</h3>
        <p className="mt-2 text-3xl font-bold text-emerald-600">{data.total}</p>
      </div>

      {pieData.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-semibold text-slate-900">Risk Distribution</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
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

      {data.weekly.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <h3 className="font-semibold text-slate-900">Weekly Trend</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {data.total === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center lg:col-span-2">
          <p className="text-slate-500">No assessment data yet.</p>
        </div>
      )}
    </div>
  );
}
