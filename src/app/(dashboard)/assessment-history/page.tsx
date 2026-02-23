import { AssessmentHistoryClient } from "./AssessmentHistoryClient";

export default function AssessmentHistoryPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">My Assessments</h1>
      <p className="mt-1 text-slate-500">
        View your past triage results and recommendations.
      </p>
      <AssessmentHistoryClient />
    </div>
  );
}
