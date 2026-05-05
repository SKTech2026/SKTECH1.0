import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/roleGuard";

import EventKioskClient from "./kiosk-client";

export const dynamic = "force-dynamic";

export default async function StaffEventKioskPage() {
  const session = await getServerSession(authOptions);
  const authorized = requireRole(session, [Role.STAFF]);

  if (!authorized.user.municipalityPresidentId) {
    redirect("/unauthorized?error=staff_unassigned");
  }

  return <EventKioskClient />;
}

