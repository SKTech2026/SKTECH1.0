import Link from "next/link";
import AuthLayout from "@/components/layouts/AuthLayout";

export default function UnauthorizedPage() {
  return (
    <AuthLayout
      title="Unauthorized Access"
      subtitle="You do not have permission to access this resource with your current account."
      illustrationTitle="Access Restricted"
      illustrationSubtitle="Return to the appropriate role portal to continue securely."
    >
      <div className="space-y-4">
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Permission denied for this page.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/post-login"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Go to Role Redirect
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
