import FlippablePortraitID from "@/components/id/FlippablePortraitID";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { formatEnumLabel, formatOfficialFullName } from "@/lib/sk-official";

export const dynamic = "force-dynamic";

export default async function IDPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const headerStore = await headers();
  const forwardedProto = headerStore.get("x-forwarded-proto") ?? "https";
  const forwardedHost = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const requestBaseUrl = forwardedHost ? `${forwardedProto}://${forwardedHost}` : "";
  const configuredBaseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? process.env.NEXTAUTH_URL ?? "")
    .trim()
    .replace(/\/+$/, "");
  const baseUrl = configuredBaseUrl || requestBaseUrl;

  const official = await prisma.sKOfficial.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      suffix: true,
      role: true,
      position: true,
      skFederationOfficer: true,
      skFederationPosition: true,
      municipality: true,
      barangay: true,
      sitio: true,
      dateElected: true,
      termStart: true,
      address: true,
      admissionStatus: true,
      status: true,
      user: {
        select: {
          image: true,
        },
      },
    },
  });

  if (!official) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#071637] p-6 text-white">
        <div className="text-center">
          <h1 className="mb-4 text-3xl font-bold">ID Not Found</h1>
          <p>The SK Official ID you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  const fallbackAddress = official.address ?? "";
  const fallbackBarangay = fallbackAddress
    .split(",")
    .map((segment) => segment.trim())
    .find((segment) => segment.length > 0);
  const fallbackMunicipality = fallbackAddress
    .split(",")
    .map((segment) => segment.trim())
    .find((segment, index) => segment.length > 0 && index > 0);
  const photoUrl =
    official.user?.image && official.user.image.startsWith("/")
      ? official.user.image
      : "/images/default-official.svg";

  const fullName = formatOfficialFullName(official);
  const position = formatEnumLabel((official.position ?? "SK_COUNCILOR").toString());
  const skfedPosition =
    official.skFederationOfficer && official.skFederationPosition
      ? formatEnumLabel(official.skFederationPosition)
      : null;
  const barangay = official.barangay ?? fallbackBarangay ?? "Not specified";
  const municipality = official.municipality ?? fallbackMunicipality ?? "Not specified";
  const idNumber = official.id.replace(/-/g, "").slice(-12).toUpperCase();

  return (
    <div className="min-h-screen bg-[#eef2f6] px-4 py-8 text-[#13213b] sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-6 text-center">
          <p className="text-sm font-semibold text-[#b3262d]">SKTech Governance Registry</p>
          <h1 className="mt-2 text-2xl font-black text-[#12315f] sm:text-3xl">
            Sangguniang Kabataan Official Credential
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-[#526071]">
            Province-backed digital identification for official verification and attendance.
          </p>
        </header>
        <FlippablePortraitID
          fullName={fullName}
          position={position}
          barangay={barangay}
          municipality={municipality}
          sitio={official.sitio}
          skfedPosition={skfedPosition}
          dateElected={(official.dateElected ?? official.termStart).toISOString()}
          registryStatus={official.status}
          photoUrl={photoUrl}
          qrValue={`${baseUrl}/id/${official.id}`}
          idNumber={idNumber}
          provinceName="PROVINCE OF ORIENTAL MINDORO"
          frontTemplateUrl="/illustrations/front.svg"
          backTemplateUrl="/illustrations/back.svg"
          skfedLogoUrl="/sk-tech-logo.png"
          provincialSealUrl="/images/sk-tech-logo.png"
          issuedDate={new Intl.DateTimeFormat("en-US", {
            month: "long",
            day: "2-digit",
            year: "numeric",
          }).format(new Date())}
        />
      </div>
    </div>
  );
}
