import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { isAdmin } from "@/lib/admin";
import { ManageClinics } from "./ManageClinics";

export default async function AdminClinicsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const admin = await isAdmin(userId);
  if (!admin) redirect("/dashboard");

  return (
    <DashboardLayout isAdmin>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manage Clinics</h1>
        <p className="mt-1 text-slate-500">
          Add, edit, and remove healthcare facilities.
        </p>
        <ManageClinics />
      </div>
    </DashboardLayout>
  );
}
