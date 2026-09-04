import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/roleGuard";

import FacialRegistrationClient from "./registration-client";

export const dynamic = "force-dynamic";

export default async function OfficialFacialRegistrationPage() {
  const session = await getServerSession(authOptions);
  requireRole(session, [Role.OFFICIAL]);

  return <FacialRegistrationClient />;
}
