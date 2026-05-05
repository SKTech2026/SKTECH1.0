import Link from "next/link";

import AuthLayout from "@/components/layouts/AuthLayout";

export default function OfficialOnboardingPage() {
  return (
    <AuthLayout
      title="Official Onboarding"
      subtitle="Before accessing full services, complete your admission details and wait for staff approval."
      illustrationTitle="SK Official Onboarding"
      illustrationSubtitle="A guided onboarding route for compliant and secure SK official access."
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          You can submit or update your profile details in the admission form. Staff will review
          your submission and activate dashboard access after approval.
        </div>

        <Link
          href="/dashboard/official/admission"
          className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          Go to Admission Form
        </Link>

        <Link
          href="/dashboard/official"
          className="inline-flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Back to Official Home
        </Link>
      </div>
    </AuthLayout>
  );
}
