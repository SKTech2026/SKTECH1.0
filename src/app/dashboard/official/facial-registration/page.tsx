import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { requireOfficialFeatureAccess } from "@/lib/roleGuard";

import FacialRegistrationClient from "./registration-client";

export const dynamic = "force-dynamic";

export default async function OfficialFacialRegistrationPage() {
  const session = await getServerSession(authOptions);
  await requireOfficialFeatureAccess(session);

  return <FacialRegistrationClient />;
}
