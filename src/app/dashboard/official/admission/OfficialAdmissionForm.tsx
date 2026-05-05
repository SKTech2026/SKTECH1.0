"use client";

import { AdmissionStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

import SKOfficialAdmissionWizard from "@/components/admission/SKOfficialAdmissionWizard";
import {
  MunicipalityOption,
  SKOfficialAdmissionSubmissionPayload,
  SKOfficialFormPayload,
} from "@/lib/sk-official";

type ExistingProfile = {
  firstName: string;
  middleName: string | null;
  lastName: string;
  birthDate: string;
  province: string;
  municipalityId: string;
  barangayId: string;
  position: SKOfficialFormPayload["position"];
  dateElected: string;
  termEnd: string;
  status: AdmissionStatus;
  email: string;
  contactNo: string | null;
  address: string | null;
  proofDocumentUrl: string | null;
  proofDocumentName: string | null;
  proofDocumentType: string | null;
  updatedAt: string;
};

type AdmissionResponse = {
  message?: string;
  error?: string;
};

type OfficialAdmissionFormProps = {
  initialProfile: ExistingProfile | null;
  municipalities: MunicipalityOption[];
  initialStep?: number;
};

export default function OfficialAdmissionForm({
  initialProfile,
  municipalities,
  initialStep,
}: OfficialAdmissionFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const onSubmit = async (payload: SKOfficialAdmissionSubmissionPayload) => {
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/official-admission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = (await response.json()) as AdmissionResponse;
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to submit admission profile.");
      }

      setSuccessMessage(body.message ?? "Admission profile submitted successfully.");
      router.push("/dashboard/official?admission=submitted");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to submit admission profile.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-glass-border bg-surface p-5 shadow-xl backdrop-blur-md sm:p-7">
      <div className="mb-5">
        <h3 className="text-xl font-semibold text-foreground">Detailed Official Submission</h3>
        <p className="mt-1 text-sm text-muted">
          Complete all required fields for staff review and approval.
        </p>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      {successMessage ? (
        <p className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {successMessage}
        </p>
      ) : null}

      <SKOfficialAdmissionWizard
        municipalities={municipalities}
        includeEmail={false}
        requireEmail={false}
        initialStep={initialStep}
        initialValues={
          initialProfile
            ? {
                firstName: initialProfile.firstName,
                middleName: initialProfile.middleName,
                lastName: initialProfile.lastName,
                birthDate: initialProfile.birthDate,
                province: initialProfile.province,
                municipalityId: initialProfile.municipalityId,
                barangayId: initialProfile.barangayId,
                position: initialProfile.position,
                dateElected: initialProfile.dateElected,
                termEnd: initialProfile.termEnd,
                email: initialProfile.email,
                contactNo: initialProfile.contactNo,
                address: initialProfile.address,
                proofDocumentUrl: initialProfile.proofDocumentUrl,
                proofDocumentName: initialProfile.proofDocumentName,
                proofDocumentType: initialProfile.proofDocumentType,
              }
            : undefined
        }
        submitting={submitting}
        submitLabel="Submit Admission"
        statusLabel={initialProfile?.status ?? null}
        onSubmit={onSubmit}
      />
    </section>
  );
}
