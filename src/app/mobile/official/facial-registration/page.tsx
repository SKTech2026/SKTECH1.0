import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";

import FacialRegistrationClient from "@/app/dashboard/official/facial-registration/registration-client";
import { authOptions } from "@/lib/auth";
import { requireDashboardRole } from "@/lib/roleGuard";

export const dynamic = "force-dynamic";

export default async function MobileOfficialFacialRegistrationPage() {
  const session = await getServerSession(authOptions);
  requireDashboardRole(session, [Role.OFFICIAL], {
    unauthenticatedRedirect: "/official/auth",
    requireApproved: false,
  });

  return <FacialRegistrationClient />;
}
