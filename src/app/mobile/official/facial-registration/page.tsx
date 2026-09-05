import { getServerSession } from "next-auth";

import FacialRegistrationClient from "@/app/dashboard/official/facial-registration/registration-client";
import { authOptions } from "@/lib/auth";
import { requireOfficialFeatureAccess } from "@/lib/roleGuard";

export const dynamic = "force-dynamic";

export default async function MobileOfficialFacialRegistrationPage() {
  const session = await getServerSession(authOptions);
  await requireOfficialFeatureAccess(session);

  return <FacialRegistrationClient />;
}
