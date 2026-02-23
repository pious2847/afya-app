import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { StatCard } from "@/components/dashboard/StatCard";
import { Activity, AlertTriangle, CheckCircle, Phone, TrendingUp } from "lucide-react";
import Link from "next/link";
import { isAdmin } from "@/lib/admin";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const admin = await isAdmin(userId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-slate-500">
          Overview of your health assessments and activity.
        </p>
      </div>

      <DashboardCharts admin={admin} />

      <Link
        href="/teleconsult"
        className="block rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 transition-all hover:border-emerald-300 hover:shadow-md"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Phone className="h-7 w-7" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">Call AfyaAI</p>
            <p className="text-sm text-slate-600">Talk to the AI health assistant – tap to start</p>
          </div>
        </div>
      </Link>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/assessment">
          <StatCard
            title="New Assessment"
            value="Start"
            subtitle="Describe symptoms for AI triage"
            icon={Activity}
          />
        </Link>
        <Link href="/assessment-history">
          <StatCard
            title="My Assessments"
            value="View history"
            subtitle="Past triage results"
            icon={CheckCircle}
          />
        </Link>
        <Link href="/clinics">
          <StatCard
            title="Find Clinics"
            value="Locate care"
            subtitle="Healthcare facilities nearby"
            icon={TrendingUp}
          />
        </Link>
        <Link href="/assessment?emergency=1">
          <StatCard
            title="Emergency"
            value="Alert"
            subtitle="Get help now"
            icon={AlertTriangle}
          />
        </Link>
      </div>

      {admin && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Admin Quick Links</h2>
          <div className="mt-4 flex flex-wrap gap-4">
            <Link
              href="/admin"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Admin Overview
            </Link>
            <Link
              href="/admin/clinics"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Manage Clinics
            </Link>
            <Link
              href="/admin/analytics"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Analytics
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
